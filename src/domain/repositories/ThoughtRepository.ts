// ThoughtRepository: CRUD operations for Thought entities

import type { Thought } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class ThoughtRepositoryClass {
  list(includeArchived = false): Thought[] {
    const data = loadData()
    const thoughts = Object.values(data.thoughts)
    if (includeArchived) {
      return thoughts
    }
    return thoughts.filter((t) => !t.archivedAt)
  }

  getById(id: string): Thought | null {
    const data = loadData()
    return data.thoughts[id] || null
  }

  create(input: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>): Thought {
    // Validate required fields
    if (!input.content) {
      throw new Error('Thought content is required')
    }

    const now = generateTimestamp()
    const thought: Thought = {
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...input,
    }

    const data = loadData()
    data.thoughts[thought.id] = thought
    saveData(data)

    return thought
  }

  update(id: string, patch: Partial<Thought>): Thought {
    const data = loadData()
    const existing = data.thoughts[id]
    if (!existing) {
      throw new Error(`Thought ${id} not found`)
    }

    const updated: Thought = {
      ...existing,
      ...patch,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: generateTimestamp(),
    }

    data.thoughts[id] = updated
    saveData(data)

    return updated
  }

  archive(id: string): void {
    const data = loadData()
    const existing = data.thoughts[id]
    if (!existing) {
      throw new Error(`Thought ${id} not found`)
    }

    existing.archivedAt = generateTimestamp()
    existing.updatedAt = generateTimestamp()
    data.thoughts[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const ThoughtRepository = new ThoughtRepositoryClass()
