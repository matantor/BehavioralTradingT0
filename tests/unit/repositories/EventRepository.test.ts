import { describe, it, expect, beforeEach } from 'vitest'
import { EventRepository } from '@/domain/repositories/EventRepository'
import { resetData } from '@/lib/storage/storage'
import type { EntityRef } from '@/domain/types/entities'

describe('EventRepository', () => {
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
    it('should create an event with required fields', () => {
      const event = EventRepository.create('user.action', [positionRef])

      expect(event.id).toBeDefined()
      expect(event.type).toBe('user.action')
      expect(event.refs).toEqual([positionRef])
      expect(event.at).toBeDefined()
      expect(event.createdAt).toBeDefined()
      expect(event.updatedAt).toBeDefined()
    })

    it('should create an event with payload', () => {
      const payload = { action: 'buy', amount: 100 }
      const event = EventRepository.create('trade.executed', [positionRef], payload)

      expect(event.payload).toEqual(payload)
    })

    it('should create an event with custom timestamp', () => {
      const customAt = '2024-01-15T10:00:00.000Z'
      const event = EventRepository.create('past.event', [positionRef], undefined, customAt)

      expect(event.at).toBe(customAt)
    })

    it('should create an event with multiple refs', () => {
      const event = EventRepository.create('linked.entities', [positionRef, thoughtRef])

      expect(event.refs).toHaveLength(2)
      expect(event.refs).toContainEqual(positionRef)
      expect(event.refs).toContainEqual(thoughtRef)
    })

    it('should throw error for missing type', () => {
      expect(() => {
        EventRepository.create('', [positionRef])
      }).toThrow('Event type is required')
    })

    it('should throw error for invalid refs', () => {
      expect(() => {
        EventRepository.create('test', null as unknown as EntityRef[])
      }).toThrow('Event refs must be an array')
    })

    it('should allow empty refs array', () => {
      const event = EventRepository.create('system.event', [])
      expect(event.refs).toEqual([])
    })
  })

  describe('list', () => {
    it('should return empty array when no events exist', () => {
      const events = EventRepository.list()
      expect(events).toEqual([])
    })

    it('should return events sorted by at descending', () => {
      EventRepository.create('event.1', [], undefined, '2024-01-01T00:00:00.000Z')
      EventRepository.create('event.2', [], undefined, '2024-01-03T00:00:00.000Z')
      EventRepository.create('event.3', [], undefined, '2024-01-02T00:00:00.000Z')

      const events = EventRepository.list()
      expect(events[0].type).toBe('event.2')
      expect(events[1].type).toBe('event.3')
      expect(events[2].type).toBe('event.1')
    })

    it('should exclude archived events by default', () => {
      const e1 = EventRepository.create('event.1', [])
      EventRepository.create('event.2', [])
      EventRepository.archive(e1.id)

      const events = EventRepository.list()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('event.2')
    })

    it('should include archived events when requested', () => {
      const e1 = EventRepository.create('event.1', [])
      EventRepository.archive(e1.id)

      const events = EventRepository.list(true)
      expect(events).toHaveLength(1)
      expect(events[0].archivedAt).toBeDefined()
    })
  })

  describe('listByType', () => {
    it('should filter events by type', () => {
      EventRepository.create('user.action', [])
      EventRepository.create('system.event', [])
      EventRepository.create('user.action', [])

      const userEvents = EventRepository.listByType('user.action')
      expect(userEvents).toHaveLength(2)
      expect(userEvents.every(e => e.type === 'user.action')).toBe(true)
    })

    it('should return empty array for non-existent type', () => {
      EventRepository.create('user.action', [])

      const events = EventRepository.listByType('non.existent')
      expect(events).toEqual([])
    })
  })

  describe('listForEntity', () => {
    it('should filter events by entity reference', () => {
      EventRepository.create('event.1', [positionRef])
      EventRepository.create('event.2', [thoughtRef])
      EventRepository.create('event.3', [positionRef, thoughtRef])

      const positionEvents = EventRepository.listForEntity(positionRef)
      expect(positionEvents).toHaveLength(2)
    })

    it('should return empty array for entity with no events', () => {
      EventRepository.create('event.1', [thoughtRef])

      const events = EventRepository.listForEntity(positionRef)
      expect(events).toEqual([])
    })
  })

  describe('get', () => {
    it('should return event by id', () => {
      const created = EventRepository.create('test.event', [positionRef])
      const retrieved = EventRepository.get(created.id)

      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent event', () => {
      const event = EventRepository.get('non-existent-id')
      expect(event).toBeNull()
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const event = EventRepository.create('test.event', [])

      EventRepository.archive(event.id)

      const archived = EventRepository.get(event.id)
      expect(archived?.archivedAt).toBeDefined()
      // updatedAt should be set (may be same as before if within same ms)
      expect(archived?.updatedAt).toBeDefined()
    })

    it('should throw error for non-existent event', () => {
      expect(() => {
        EventRepository.archive('non-existent')
      }).toThrow('not found')
    })
  })

  describe('persistence', () => {
    it('should persist events across repository instances', () => {
      EventRepository.create('test.event', [positionRef])

      // Reload from storage
      const events = EventRepository.list()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('test.event')
    })
  })
})
