// JournalRepository: CRUD operations for JournalEntry entities
// Per Task 1: list() returns entries sorted by createdAt desc

import type { JournalEntry } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class JournalRepositoryClass {
  list(includeArchived = false): JournalEntry[] {
    const data = loadData()
    let entries = Object.values(data.journalEntries)

    if (!includeArchived) {
      entries = entries.filter((e) => !e.archivedAt)
    }

    // Sort by createdAt descending (newest first)
    return entries.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  getById(id: string): JournalEntry | null {
    const data = loadData()
    return data.journalEntries[id] || null
  }

  create(
    input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): JournalEntry {
    // Validate required fields
    if (!input.title) {
      throw new Error('JournalEntry title is required')
    }
    if (!input.content) {
      throw new Error('JournalEntry content is required')
    }
    if (!['decision', 'reflection', 'note'].includes(input.type)) {
      throw new Error('JournalEntry type must be decision, reflection, or note')
    }

    const now = generateTimestamp()
    const entry: JournalEntry = {
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...input,
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

    // Validate type if provided
    if (patch.type && !['decision', 'reflection', 'note'].includes(patch.type)) {
      throw new Error('JournalEntry type must be decision, reflection, or note')
    }

    const updated: JournalEntry = {
      ...existing,
      ...patch,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: generateTimestamp(),
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
