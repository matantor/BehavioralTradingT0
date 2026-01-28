// EventService: domain service for Event operations
// Services call repositories only, no direct storage access

import type { Event, EntityRef } from '@/domain/types/entities'
import { EventRepository } from '@/domain/repositories/EventRepository'

class EventServiceClass {
  list(): Event[] {
    return EventRepository.list(false) // excludes archived by default
  }

  listByType(type: string): Event[] {
    return EventRepository.listByType(type, false)
  }

  listForEntity(entityRef: EntityRef): Event[] {
    return EventRepository.listForEntity(entityRef, false)
  }

  get(id: string): Event | null {
    return EventRepository.get(id)
  }

  create(
    type: string,
    refs: EntityRef[],
    payload?: Record<string, unknown>,
    at?: string
  ): Event {
    return EventRepository.create(type, refs, payload, at)
  }

  archive(id: string): void {
    EventRepository.archive(id)
  }
}

export const EventService = new EventServiceClass()
