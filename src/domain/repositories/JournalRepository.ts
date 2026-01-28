// JournalRepository: CRUD operations for JournalEntry entities
// Per TASKLIST Part 1: Journal contains only executed actions with mandatory trading fields

import type { JournalEntry, ActionType, PositionMode } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

const VALID_ACTION_TYPES: ActionType[] = ['buy', 'sell', 'long', 'short', 'deposit', 'withdraw']
const VALID_POSITION_MODES: PositionMode[] = ['new', 'existing']

class JournalRepositoryClass {
  list(includeArchived = false): JournalEntry[] {
    const data = loadData()
    let entries = Object.values(data.journalEntries)

    if (!includeArchived) {
      entries = entries.filter((e) => !e.archivedAt)
    }

    // Sort by entryTime descending (newest first), fallback to createdAt for legacy entries
    return entries.sort((a, b) => {
      const timeA = a.entryTime || a.createdAt
      const timeB = b.entryTime || b.createdAt
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
  }

  getById(id: string): JournalEntry | null {
    const data = loadData()
    return data.journalEntries[id] || null
  }

  create(
    input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): JournalEntry {
    // Validate mandatory fields per TASKLIST Part 1
    if (input.type !== 'decision') {
      throw new Error('JournalEntry type must be decision (reflections belong in Thoughts)')
    }
    if (!input.actionType || !VALID_ACTION_TYPES.includes(input.actionType)) {
      throw new Error(`JournalEntry actionType must be one of: ${VALID_ACTION_TYPES.join(', ')}`)
    }
    if (!input.ticker || typeof input.ticker !== 'string' || !input.ticker.trim()) {
      throw new Error('JournalEntry ticker is required')
    }
    if (typeof input.quantity !== 'number' || input.quantity <= 0) {
      throw new Error('JournalEntry quantity must be a positive number')
    }
    if (typeof input.price !== 'number' || input.price < 0) {
      throw new Error('JournalEntry price must be a non-negative number')
    }
    if (!input.entryTime) {
      throw new Error('JournalEntry entryTime is required')
    }
    if (!input.positionMode || !VALID_POSITION_MODES.includes(input.positionMode)) {
      throw new Error(`JournalEntry positionMode must be one of: ${VALID_POSITION_MODES.join(', ')}`)
    }
    if (input.positionMode === 'existing' && !input.positionId) {
      throw new Error('JournalEntry positionId is required when positionMode is existing')
    }
    // Payment required for buy actions
    if (input.actionType === 'buy' && !input.payment) {
      throw new Error('JournalEntry payment is required for buy actions')
    }
    if (input.payment) {
      if (!input.payment.asset || typeof input.payment.asset !== 'string') {
        throw new Error('JournalEntry payment.asset is required')
      }
      if (typeof input.payment.amount !== 'number' || input.payment.amount < 0) {
        throw new Error('JournalEntry payment.amount must be a non-negative number')
      }
    }

    const now = generateTimestamp()
    const entry: JournalEntry = {
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...input,
      ticker: input.ticker.trim().toUpperCase(),
    }

    const data = loadData()
    data.journalEntries[entry.id] = entry
    saveData(data)

    return entry
  }

  update(id: string, patch: Partial<JournalEntry>): JournalEntry {
    const data = loadData()
    const existing = data.journalEntries[id]
    if (!existing) {
      throw new Error(`JournalEntry ${id} not found`)
    }

    // Validate fields if provided
    if (patch.type && patch.type !== 'decision') {
      throw new Error('JournalEntry type must be decision')
    }
    if (patch.actionType && !VALID_ACTION_TYPES.includes(patch.actionType)) {
      throw new Error(`JournalEntry actionType must be one of: ${VALID_ACTION_TYPES.join(', ')}`)
    }
    if (patch.positionMode && !VALID_POSITION_MODES.includes(patch.positionMode)) {
      throw new Error(`JournalEntry positionMode must be one of: ${VALID_POSITION_MODES.join(', ')}`)
    }

    const updated: JournalEntry = {
      ...existing,
      ...patch,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: generateTimestamp(),
      ticker: patch.ticker ? patch.ticker.trim().toUpperCase() : existing.ticker,
    }

    data.journalEntries[id] = updated
    saveData(data)

    return updated
  }

  archive(id: string): void {
    const data = loadData()
    const existing = data.journalEntries[id]
    if (!existing) {
      throw new Error(`JournalEntry ${id} not found`)
    }

    existing.archivedAt = generateTimestamp()
    existing.updatedAt = generateTimestamp()
    data.journalEntries[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const JournalRepository = new JournalRepositoryClass()
