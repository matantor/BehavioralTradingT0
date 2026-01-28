// PositionRepository: CRUD operations for Position entities
// Per PTD.md: repositories own persistence, no business logic

import type { Position } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class PositionRepositoryClass {
  list(includeArchived = false): Position[] {
    const data = loadData()
    const positions = Object.values(data.positions)
    if (includeArchived) {
      return positions
    }
    return positions.filter((p) => !p.archivedAt)
  }

  getById(id: string): Position | null {
    const data = loadData()
    return data.positions[id] || null
  }

  create(
    input: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>
  ): Position {
    // Validate required fields
    if (!input.ticker) {
      throw new Error('Position ticker is required')
    }
    if (input.quantity < 0) {
      throw new Error('Position quantity must be >= 0')
    }

    const now = generateTimestamp()
    const position: Position = {
      ...input,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      currency: input.currency || 'USD',
    }

    const data = loadData()
    data.positions[position.id] = position
    saveData(data)

    return position
  }

  update(id: string, patch: Partial<Position>): Position {
    const data = loadData()
    const existing = data.positions[id]
    if (!existing) {
      throw new Error(`Position ${id} not found`)
    }

    // Validate quantity if provided
    if (patch.quantity !== undefined && patch.quantity < 0) {
      throw new Error('Position quantity must be >= 0')
    }

    const updated: Position = {
      ...existing,
      ...patch,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: generateTimestamp(),
    }

    data.positions[id] = updated
    saveData(data)

    return updated
  }

  archive(id: string): void {
    const data = loadData()
    const existing = data.positions[id]
    if (!existing) {
      throw new Error(`Position ${id} not found`)
    }

    existing.archivedAt = generateTimestamp()
    existing.updatedAt = generateTimestamp()
    data.positions[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const PositionRepository = new PositionRepositoryClass()
