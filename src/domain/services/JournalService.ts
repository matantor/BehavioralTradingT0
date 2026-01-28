// JournalService: domain service for JournalEntry operations
// Services call repositories only, no direct storage access

import type { JournalEntry, PortfolioAction, Position, EntityRef } from '@/domain/types/entities'
import { generateTimestamp } from '@/domain/types/entities'
import { JournalRepository } from '@/domain/repositories/JournalRepository'
import { PositionRepository } from '@/domain/repositories/PositionRepository'
import { RelationRepository } from '@/domain/repositories/RelationRepository'
import { EventRepository } from '@/domain/repositories/EventRepository'

interface JournalFilter {
  type?: JournalEntry['type']
}

// Result of executing a portfolio action
export interface PortfolioActionResult {
  journalEntry: JournalEntry
  position: Position
  eventId: string
}

class JournalServiceClass {
  list(filter?: JournalFilter): JournalEntry[] {
    const entries = JournalRepository.list(false) // excludes archived by default

    if (filter?.type) {
      return entries.filter((entry) => entry.type === filter.type)
    }

    return entries
  }

  get(id: string): JournalEntry | null {
    return JournalRepository.getById(id)
  }

  create(
    payload: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): JournalEntry {
    return JournalRepository.create(payload)
  }

  update(id: string, patch: Partial<JournalEntry>): JournalEntry {
    return JournalRepository.update(id, patch)
  }

  archive(id: string): void {
    JournalRepository.archive(id)
  }

  /**
   * Execute a portfolio action from a journal entry.
   * Per TASKLIST Part B: manual-first portfolio actions embedded in journal entries.
   *
   * Validates action, creates/updates Position, saves portfolioAction to entry,
   * creates RelationEdge linking journal→position, and emits trade Event.
   *
   * @param journalId - ID of the journal entry to attach the action to
   * @param action - The portfolio action to execute
   * @returns Result containing updated entry, position, and event ID
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
    if (entry.type !== 'decision') {
      throw new Error('Portfolio actions can only be added to decision entries')
    }
    if (entry.portfolioAction) {
      throw new Error('Journal entry already has a portfolio action')
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
        // Open new position
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
        // Increase existing position
        if (!action.positionId) {
          throw new Error('Position ID is required for buy action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.archivedAt) {
          throw new Error('Cannot buy into archived position')
        }
        if (existing.closedAt) {
          throw new Error('Cannot buy into closed position')
        }

        // Calculate new average cost: (old_qty * old_cost + new_qty * new_price) / (old_qty + new_qty)
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
        // Decrease existing position
        if (!action.positionId) {
          throw new Error('Position ID is required for sell action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.archivedAt) {
          throw new Error('Cannot sell from archived position')
        }
        if (existing.closedAt) {
          throw new Error('Cannot sell from closed position')
        }
        if (action.quantity > existing.quantity) {
          throw new Error(`Cannot sell ${action.quantity} shares; only ${existing.quantity} held`)
        }

        const newQuantity = existing.quantity - action.quantity
        position = PositionRepository.update(action.positionId, {
          quantity: newQuantity,
          // Close position if quantity reaches 0
          closedAt: newQuantity === 0 ? executedAt : undefined,
        })
        break
      }

      case 'close_position': {
        // Close entire position
        if (!action.positionId) {
          throw new Error('Position ID is required for close_position action')
        }
        const existing = PositionRepository.getById(action.positionId)
        if (!existing) {
          throw new Error(`Position ${action.positionId} not found`)
        }
        if (existing.archivedAt) {
          throw new Error('Cannot close archived position')
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

    // Save portfolio action to journal entry (with position ID for traceability)
    const savedAction: PortfolioAction = {
      ...action,
      positionId: position.id,
      executedAt,
    }
    const updatedEntry = JournalRepository.update(journalId, {
      portfolioAction: savedAction,
    })

    // Create relation: journal → position
    const journalRef: EntityRef = { type: 'journal', id: journalId }
    const positionRef: EntityRef = { type: 'position', id: position.id }

    // Check if relation already exists (idempotency)
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
      journalEntry: updatedEntry,
      position,
      eventId: event.id,
    }
  }
}

export const JournalService = new JournalServiceClass()
