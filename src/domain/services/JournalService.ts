// JournalService: domain service for JournalEntry operations
// Per TASKLIST Part 1: Journal contains only executed actions with mandatory trading fields
// Services call repositories only, no direct storage access

import type { JournalEntry, PortfolioAction, Position, EntityRef, ActionType, PaymentInfo } from '@/domain/types/entities'
import { generateTimestamp } from '@/domain/types/entities'
import { JournalRepository } from '@/domain/repositories/JournalRepository'
import { PositionRepository } from '@/domain/repositories/PositionRepository'
import { RelationRepository } from '@/domain/repositories/RelationRepository'
import { EventRepository } from '@/domain/repositories/EventRepository'

interface JournalFilter {
  actionType?: ActionType
}

// Input for creating a journal entry
export interface JournalCreateInput {
  actionType: ActionType
  ticker: string
  quantity: number
  price: number
  entryTime: string
  positionMode: 'new' | 'existing'
  positionId?: string
  payment?: PaymentInfo
  meta?: Record<string, unknown>
}

// Result of creating a journal entry
export interface JournalCreateResult {
  journalEntry: JournalEntry
  position: Position
  eventId: string
  cashDeducted?: number
}

// Legacy result type for backward compatibility
export interface PortfolioActionResult {
  journalEntry: JournalEntry
  position: Position
  eventId: string
}

const CASH_TICKER = 'USD'

class JournalServiceClass {
  list(filter?: JournalFilter): JournalEntry[] {
    const entries = JournalRepository.list(false) // excludes archived by default

    if (filter?.actionType) {
      return entries.filter((entry) => entry.actionType === filter.actionType)
    }

    return entries
  }

  get(id: string): JournalEntry | null {
    return JournalRepository.getById(id)
  }

  /**
   * Create a journal entry and execute the associated portfolio action.
   * Per TASKLIST Part 1: journal entry creation triggers position changes.
   *
   * For buys: creates/increases position, deducts from cash (unless isNewMoney)
   * For sells: decreases position, closes if quantity reaches 0
   * For deposits/withdraws: affects cash position
   * For long/short: creates/modifies leveraged position (exact math deferred)
   */
  create(input: JournalCreateInput): JournalCreateResult {
    const { actionType, ticker, quantity, price, entryTime, positionMode, positionId, payment, meta } = input

    let position: Position
    let cashDeducted: number | undefined

    // Handle position changes based on action type
    switch (actionType) {
      case 'buy': {
        if (positionMode === 'new') {
          // Create new position
          position = PositionRepository.create({
            ticker: ticker.toUpperCase(),
            quantity,
            avgCost: price,
            currency: 'USD',
            openedAt: entryTime,
          })
        } else {
          // Increase existing position
          if (!positionId) {
            throw new Error('Position ID required for existing position')
          }
          const existing = PositionRepository.getById(positionId)
          if (!existing) {
            throw new Error(`Position ${positionId} not found`)
          }
          if (existing.closedAt) {
            throw new Error('Cannot buy into closed position')
          }

          // Calculate new average cost
          const totalCost = existing.quantity * existing.avgCost + quantity * price
          const newQuantity = existing.quantity + quantity
          const newAvgCost = totalCost / newQuantity

          position = PositionRepository.update(positionId, {
            quantity: newQuantity,
            avgCost: newAvgCost,
          })
        }

        // Handle cash deduction for buys
        if (payment && !payment.isNewMoney && payment.asset === 'USD') {
          cashDeducted = this.deductFromCash(payment.amount)
        }
        break
      }

      case 'sell': {
        if (positionMode === 'new') {
          throw new Error('Cannot sell a new position; must select existing position')
        }
        if (!positionId) {
          throw new Error('Position ID required for sell action')
        }
        const existing = PositionRepository.getById(positionId)
        if (!existing) {
          throw new Error(`Position ${positionId} not found`)
        }
        if (existing.closedAt) {
          throw new Error('Cannot sell from closed position')
        }
        if (quantity > existing.quantity) {
          throw new Error(`Cannot sell ${quantity}; only ${existing.quantity} held`)
        }

        const newQuantity = existing.quantity - quantity
        position = PositionRepository.update(positionId, {
          quantity: newQuantity,
          closedAt: newQuantity === 0 ? entryTime : undefined,
        })
        break
      }

      case 'deposit': {
        // Deposit increases cash position
        position = this.getOrCreateCashPosition()
        position = PositionRepository.update(position.id, {
          quantity: position.quantity + quantity,
        })
        break
      }

      case 'withdraw': {
        // Withdraw decreases cash position
        position = this.getOrCreateCashPosition()
        if (quantity > position.quantity) {
          throw new Error(`Cannot withdraw ${quantity}; only ${position.quantity} available`)
        }
        position = PositionRepository.update(position.id, {
          quantity: position.quantity - quantity,
        })
        break
      }

      case 'long':
      case 'short': {
        // Long/short positions: create or update
        // Per TASKLIST: exact leverage math is deferred
        if (positionMode === 'new') {
          position = PositionRepository.create({
            ticker: ticker.toUpperCase(),
            quantity,
            avgCost: price,
            currency: 'USD',
            openedAt: entryTime,
            // Mark as leveraged in meta
          })
          PositionRepository.update(position.id, {
            meta: { leveraged: true, direction: actionType },
          })
          position = PositionRepository.getById(position.id)!
        } else {
          if (!positionId) {
            throw new Error('Position ID required for existing position')
          }
          const existing = PositionRepository.getById(positionId)
          if (!existing) {
            throw new Error(`Position ${positionId} not found`)
          }
          position = PositionRepository.update(positionId, {
            quantity: existing.quantity + quantity,
          })
        }
        break
      }

      default:
        throw new Error(`Unknown action type: ${actionType}`)
    }

    // Create the journal entry
    const journalEntry = JournalRepository.create({
      type: 'decision',
      actionType,
      ticker: ticker.toUpperCase(),
      quantity,
      price,
      entryTime,
      positionMode,
      positionId: position.id,
      payment,
      meta,
    })

    // Create relation: journal → position
    const journalRef: EntityRef = { type: 'journal', id: journalEntry.id }
    const positionRef: EntityRef = { type: 'position', id: position.id }

    RelationRepository.create(journalRef, positionRef, 'related', {
      derivedFrom: 'journalEntry',
      actionType,
    })

    // Emit trade event
    const event = EventRepository.create(
      `trade.${actionType}`,
      [journalRef, positionRef],
      {
        ticker: position.ticker,
        quantity,
        price,
        actionType,
        value: quantity * price,
        payment,
      },
      entryTime
    )

    return {
      journalEntry,
      position,
      eventId: event.id,
      cashDeducted,
    }
  }

  update(id: string, patch: Partial<JournalEntry>): JournalEntry {
    return JournalRepository.update(id, patch)
  }

  archive(id: string): void {
    JournalRepository.archive(id)
  }

  /**
   * Replace an existing journal entry with a corrected one.
   * Reverses the old entry's effects, applies the new entry, and supersedes the original.
   */
  replaceTrade(originalId: string, input: JournalCreateInput): JournalCreateResult {
    const original = JournalRepository.getById(originalId)
    if (!original) {
      throw new Error(`Journal entry ${originalId} not found`)
    }
    if (original.archivedAt) {
      throw new Error('Cannot replace an archived journal entry')
    }
    if (original.supersededById) {
      throw new Error('This journal entry has already been superseded')
    }

    // Undo original portfolio effects
    this.reverseEntry(original)

    // Apply corrected trade
    const result = this.create(input)

    // Preserve linked relations from original entry
    this.copyRelations(original.id, result.journalEntry.id)

    // Mark original as superseded (and archive to hide by default)
    JournalRepository.update(original.id, {
      archivedAt: generateTimestamp(),
      supersededById: result.journalEntry.id,
    })

    return result
  }

  /**
   * Get or create the USD cash position
   */
  private getOrCreateCashPosition(): Position {
    const positions = PositionRepository.list(false)
    let cashPosition = positions.find(p => p.ticker === CASH_TICKER && p.assetType === 'cash')

    if (!cashPosition) {
      cashPosition = PositionRepository.create({
        ticker: CASH_TICKER,
        quantity: 0,
        avgCost: 1,
        currency: 'USD',
        assetType: 'cash',
        openedAt: generateTimestamp(),
      })
    }

    return cashPosition
  }

  /**
   * Deduct amount from cash position
   * Returns amount actually deducted
   */
  private deductFromCash(amount: number): number {
    const cashPosition = this.getOrCreateCashPosition()
    const deductAmount = Math.min(amount, cashPosition.quantity)

    if (deductAmount > 0) {
      PositionRepository.update(cashPosition.id, {
        quantity: cashPosition.quantity - deductAmount,
      })
    }

    return deductAmount
  }

  /**
   * Reverse the portfolio effects of a journal entry.
   * Uses inverse math based on the current position state.
   */
  private reverseEntry(entry: JournalEntry): void {
    const positionId = entry.positionId
    if (!positionId) {
      throw new Error('Journal entry has no positionId to reverse')
    }

    const position = PositionRepository.getById(positionId)
    if (!position) {
      throw new Error(`Position ${positionId} not found for reversal`)
    }

    switch (entry.actionType) {
      case 'buy': {
        const newQuantity = position.quantity - entry.quantity
        if (newQuantity < 0) {
          throw new Error('Cannot reverse buy; position quantity would go negative')
        }
        const updates: Partial<Position> = {
          quantity: newQuantity,
          closedAt: newQuantity === 0 ? entry.entryTime : undefined,
        }
        if (newQuantity > 0) {
          const previousTotalCost = position.quantity * position.avgCost - entry.quantity * entry.price
          const newAvgCost = previousTotalCost / newQuantity
          if (Number.isFinite(newAvgCost) && newAvgCost >= 0) {
            updates.avgCost = newAvgCost
          }
        }
        PositionRepository.update(position.id, updates)

        // Restore cash if it was deducted for this buy
        if (entry.payment && !entry.payment.isNewMoney && entry.payment.asset === 'USD') {
          const cashPosition = this.getOrCreateCashPosition()
          PositionRepository.update(cashPosition.id, {
            quantity: cashPosition.quantity + entry.payment.amount,
          })
        }
        break
      }

      case 'sell': {
        const newQuantity = position.quantity + entry.quantity
        PositionRepository.update(position.id, {
          quantity: newQuantity,
          closedAt: newQuantity > 0 ? undefined : position.closedAt,
        })
        break
      }

      case 'deposit': {
        if (entry.quantity > position.quantity) {
          throw new Error('Cannot reverse deposit; cash would go negative')
        }
        PositionRepository.update(position.id, {
          quantity: position.quantity - entry.quantity,
        })
        break
      }

      case 'withdraw': {
        PositionRepository.update(position.id, {
          quantity: position.quantity + entry.quantity,
        })
        break
      }

      case 'long':
      case 'short': {
        const newQuantity = position.quantity - entry.quantity
        if (newQuantity < 0) {
          throw new Error('Cannot reverse leveraged entry; position quantity would go negative')
        }
        PositionRepository.update(position.id, {
          quantity: newQuantity,
          closedAt: newQuantity === 0 ? entry.entryTime : undefined,
        })
        break
      }

      default:
        throw new Error(`Unknown action type: ${entry.actionType}`)
    }
  }

  /**
   * Copy relations from an original journal entry to its replacement.
   * Skips auto-derived journal→position relations.
   */
  private copyRelations(originalId: string, replacementId: string): void {
    const originalRef: EntityRef = { type: 'journal', id: originalId }
    const replacementRef: EntityRef = { type: 'journal', id: replacementId }
    const relations = RelationRepository.listForEntity(originalRef, false)

    for (const relation of relations) {
      const derivedFrom = relation.meta && typeof relation.meta === 'object'
        ? (relation.meta as Record<string, unknown>).derivedFrom
        : undefined
      const involvesPosition =
        relation.fromRef.type === 'position' || relation.toRef.type === 'position'

      if (
        involvesPosition &&
        (derivedFrom === 'journalEntry' || derivedFrom === 'portfolioAction')
      ) {
        continue
      }

      const fromRef =
        relation.fromRef.type === 'journal' && relation.fromRef.id === originalId
          ? replacementRef
          : relation.fromRef
      const toRef =
        relation.toRef.type === 'journal' && relation.toRef.id === originalId
          ? replacementRef
          : relation.toRef

      const existing = RelationRepository.findExisting(fromRef, toRef, relation.relationType)
      if (!existing) {
        RelationRepository.create(fromRef, toRef, relation.relationType, relation.meta)
      }
    }
  }

  /**
   * Legacy method: Execute a portfolio action from a journal entry.
   * @deprecated Use create() instead for new entries
   */
  executePortfolioAction(journalId: string, action: PortfolioAction): PortfolioActionResult {
    // Get and validate journal entry
    const entry = JournalRepository.getById(journalId)
    if (!entry) {
      throw new Error(`Journal entry ${journalId} not found`)
    }
    if (entry.archivedAt) {
      throw new Error('Cannot add portfolio action to archived journal entry')
    }

    // Validate action fields
    if (action.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }
    if (action.price < 0) {
      throw new Error('Price cannot be negative')
    }

    let position: Position
    const now = generateTimestamp()
    const executedAt = action.executedAt || now

    switch (action.actionType) {
      case 'set_position': {
        if (!action.ticker) {
          throw new Error('Ticker is required for opening a position')
        }
        position = PositionRepository.create({
          ticker: action.ticker.toUpperCase(),
          quantity: action.quantity,
          avgCost: action.price,
          currency: 'USD',
          openedAt: executedAt,
        })
        break
      }

      case 'buy': {
        if (!action.positionId) {
          throw new Error('Position ID is required for buy action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.closedAt) {
          throw new Error('Cannot buy into closed position')
        }

        const totalCost = existing.quantity * existing.avgCost + action.quantity * action.price
        const newQuantity = existing.quantity + action.quantity
        const newAvgCost = totalCost / newQuantity

        position = PositionRepository.update(action.positionId, {
          quantity: newQuantity,
          avgCost: newAvgCost,
        })
        break
      }

      case 'sell': {
        if (!action.positionId) {
          throw new Error('Position ID is required for sell action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.closedAt) {
          throw new Error('Cannot sell from closed position')
        }
        if (action.quantity > existing.quantity) {
          throw new Error(`Cannot sell ${action.quantity}; only ${existing.quantity} held`)
        }

        const newQuantity = existing.quantity - action.quantity
        position = PositionRepository.update(action.positionId, {
          quantity: newQuantity,
          closedAt: newQuantity === 0 ? executedAt : undefined,
        })
        break
      }

      case 'close_position': {
        if (!action.positionId) {
          throw new Error('Position ID is required for close_position action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.closedAt) {
          throw new Error('Position is already closed')
        }

        position = PositionRepository.update(action.positionId, {
          quantity: 0,
          closedAt: executedAt,
        })
        break
      }

      default:
        throw new Error(`Unknown action type: ${action.actionType}`)
    }

    // Create relation: journal → position
    const journalRef: EntityRef = { type: 'journal', id: journalId }
    const positionRef: EntityRef = { type: 'position', id: position.id }

    const existingRelation = RelationRepository.findExisting(journalRef, positionRef, 'related')
    if (!existingRelation) {
      RelationRepository.create(journalRef, positionRef, 'related', {
        derivedFrom: 'portfolioAction',
        actionType: action.actionType,
      })
    }

    // Emit trade event
    const event = EventRepository.create(
      `trade.${action.actionType}`,
      [journalRef, positionRef],
      {
        ticker: position.ticker,
        quantity: action.quantity,
        price: action.price,
        actionType: action.actionType,
        fees: action.fees,
      },
      executedAt
    )

    return {
      journalEntry: entry,
      position,
      eventId: event.id,
    }
  }
}

export const JournalService = new JournalServiceClass()
