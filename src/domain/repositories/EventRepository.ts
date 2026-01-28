// EventRepository: append-only event log management
// Per PTD.md: events are immutable history, no overwrites

import type { Event, EntityRef } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class EventRepositoryClass {
  list(includeArchived = false): Event[] {
    const data = loadData()
    let events = Object.values(data.events)

    if (!includeArchived) {
      events = events.filter((e) => !e.archivedAt)
    }

    // Sort by at (event time) descending (newest first)
    return events.sort((a, b) => {
      return new Date(b.at).getTime() - new Date(a.at).getTime()
    })
  }

  listByType(type: string, includeArchived = false): Event[] {
    const data = loadData()
    let events = Object.values(data.events).filter((e) => e.type === type)

    if (!includeArchived) {
      events = events.filter((e) => !e.archivedAt)
    }

    return events.sort((a, b) => {
      return new Date(b.at).getTime() - new Date(a.at).getTime()
    })
  }

  listForEntity(entityRef: EntityRef, includeArchived = false): Event[] {
    const data = loadData()
    let events = Object.values(data.events).filter((e) =>
      e.refs.some((ref) => ref.type === entityRef.type && ref.id === entityRef.id)
    )

    if (!includeArchived) {
      events = events.filter((e) => !e.archivedAt)
    }

    return events.sort((a, b) => {
      return new Date(b.at).getTime() - new Date(a.at).getTime()
    })
  }

  get(id: string): Event | null {
    const data = loadData()
    return data.events[id] || null
  }

  create(
    type: string,
    refs: EntityRef[],
    payload?: Record<string, unknown>,
    at?: string
  ): Event {
    // Validate required fields
    if (!type) {
      throw new Error('Event type is required')
    }
    if (!refs || !Array.isArray(refs)) {
      throw new Error('Event refs must be an array')
    }

    const now = generateTimestamp()
    const event: Event = {
      id: generateUUID(),
      type,
      at: at || now,
      refs,
      payload,
      createdAt: now,
      updatedAt: now,
    }

    const data = loadData()
    data.events[event.id] = event
    saveData(data)

    return event
  }

  // Archive (soft delete) - events are append-only, no hard deletes
  archive(id: string): void {
    const data = loadData()
    const existing = data.events[id]
    if (!existing) {
      throw new Error(`Event ${id} not found`)
    }

    existing.archivedAt = generateTimestamp()
    existing.updatedAt = generateTimestamp()
    data.events[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const EventRepository = new EventRepositoryClass()
