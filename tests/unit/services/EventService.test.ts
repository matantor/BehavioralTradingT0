import { describe, it, expect, beforeEach } from 'vitest'
import { EventService } from '@/domain/services/EventService'
import { resetData } from '@/lib/storage/storage'
import type { EntityRef } from '@/domain/types/entities'

describe('EventService', () => {
  beforeEach(() => {
    resetData()
  })

  const positionRef: EntityRef = {
    type: 'position',
    id: 'position-1',
  }

  const thoughtRef: EntityRef = {
    type: 'thought',
    id: 'thought-1',
  }

  describe('create', () => {
    it('should create an event via repository', () => {
      const event = EventService.create('user.action', [positionRef])

      expect(event.id).toBeDefined()
      expect(event.type).toBe('user.action')
      expect(event.refs).toEqual([positionRef])
    })

    it('should create an event with payload', () => {
      const payload = { action: 'decision', confidence: 0.8 }
      const event = EventService.create('ai.suggestion', [positionRef], payload)

      expect(event.payload).toEqual(payload)
    })

    it('should create an event with custom timestamp', () => {
      const customAt = '2024-06-15T12:00:00.000Z'
      const event = EventService.create('historical.event', [], undefined, customAt)

      expect(event.at).toBe(customAt)
    })
  })

  describe('list', () => {
    it('should return all non-archived events', () => {
      EventService.create('event.1', [])
      EventService.create('event.2', [])

      const events = EventService.list()
      expect(events).toHaveLength(2)
    })

    it('should exclude archived events', () => {
      const e1 = EventService.create('event.1', [])
      EventService.create('event.2', [])
      EventService.archive(e1.id)

      const events = EventService.list()
      expect(events).toHaveLength(1)
    })
  })

  describe('listByType', () => {
    it('should filter events by type', () => {
      EventService.create('intent.created', [positionRef])
      EventService.create('trade.executed', [positionRef])
      EventService.create('intent.created', [thoughtRef])

      const intents = EventService.listByType('intent.created')
      expect(intents).toHaveLength(2)
    })
  })

  describe('listForEntity', () => {
    it('should return events referencing entity', () => {
      EventService.create('event.1', [positionRef])
      EventService.create('event.2', [thoughtRef])

      const positionEvents = EventService.listForEntity(positionRef)
      expect(positionEvents).toHaveLength(1)
      expect(positionEvents[0].refs).toContainEqual(positionRef)
    })
  })

  describe('get', () => {
    it('should return event by id', () => {
      const created = EventService.create('test', [])
      const retrieved = EventService.get(created.id)

      expect(retrieved?.id).toBe(created.id)
    })

    it('should return null for non-existent id', () => {
      const event = EventService.get('does-not-exist')
      expect(event).toBeNull()
    })
  })

  describe('archive', () => {
    it('should soft-delete an event', () => {
      const event = EventService.create('to.archive', [])
      EventService.archive(event.id)

      const retrieved = EventService.get(event.id)
      expect(retrieved?.archivedAt).toBeDefined()
    })
  })
})
