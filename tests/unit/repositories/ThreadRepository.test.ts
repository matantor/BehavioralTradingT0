import { describe, it, expect, beforeEach } from 'vitest'
import { ThreadRepository } from '@/domain/repositories/ThreadRepository'
import { resetData } from '@/lib/storage/storage'
import type { EntityRef } from '@/domain/types/entities'

describe('ThreadRepository', () => {
  beforeEach(() => {
    resetData()
  })

  const testEntityRef: EntityRef = {
    type: 'position',
    id: 'test-position-id',
  }

  const anotherEntityRef: EntityRef = {
    type: 'thought',
    id: 'test-thought-id',
  }

  describe('addMessage', () => {
    it('should add a message to entity thread', () => {
      const message = ThreadRepository.addMessage(
        testEntityRef,
        'First message'
      )

      expect(message.id).toBeDefined()
      expect(message.content).toBe('First message')
      expect(message.entityRef).toEqual(testEntityRef)
      expect(message.createdAt).toBeDefined()
    })

    it('should throw error for empty content', () => {
      expect(() => {
        ThreadRepository.addMessage(testEntityRef, '')
      }).toThrow('content is required')
    })

    it('should throw error for invalid entityRef', () => {
      expect(() => {
        ThreadRepository.addMessage({ type: 'position', id: '' }, 'Test')
      }).toThrow('entityRef must have type and id')
    })
  })

  describe('getMessages', () => {
    it('should return empty array for entity with no messages', () => {
      const messages = ThreadRepository.getMessages(testEntityRef)
      expect(messages).toEqual([])
    })

    it('should return messages for specific entity', () => {
      ThreadRepository.addMessage(testEntityRef, 'Message 1')
      ThreadRepository.addMessage(testEntityRef, 'Message 2')
      ThreadRepository.addMessage(anotherEntityRef, 'Other message')

      const messages = ThreadRepository.getMessages(testEntityRef)
      expect(messages).toHaveLength(2)
      expect(messages.every((m) => m.entityRef.id === testEntityRef.id)).toBe(
        true
      )
    })

    it('should return messages in chronological order', () => {
      ThreadRepository.addMessage(testEntityRef, 'First')
      ThreadRepository.addMessage(testEntityRef, 'Second')
      ThreadRepository.addMessage(testEntityRef, 'Third')

      const messages = ThreadRepository.getMessages(testEntityRef)
      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
      expect(messages[2].content).toBe('Third')
    })

    it('should exclude archived messages by default', () => {
      const m1 = ThreadRepository.addMessage(testEntityRef, 'Message 1')
      ThreadRepository.addMessage(testEntityRef, 'Message 2')
      ThreadRepository.archiveMessage(m1.id)

      const messages = ThreadRepository.getMessages(testEntityRef)
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Message 2')
    })

    it('should include archived messages when requested', () => {
      const m1 = ThreadRepository.addMessage(testEntityRef, 'Message 1')
      ThreadRepository.archiveMessage(m1.id)

      const messages = ThreadRepository.getMessages(testEntityRef, true)
      expect(messages).toHaveLength(1)
      expect(messages[0].archivedAt).toBeDefined()
    })
  })

  describe('archiveMessage', () => {
    it('should set archivedAt timestamp', () => {
      const message = ThreadRepository.addMessage(testEntityRef, 'Test')
      ThreadRepository.archiveMessage(message.id)

      const messages = ThreadRepository.getMessages(testEntityRef, true)
      expect(messages[0].archivedAt).toBeDefined()
    })

    it('should throw error for non-existent message', () => {
      expect(() => {
        ThreadRepository.archiveMessage('non-existent')
      }).toThrow('not found')
    })
  })

  describe('thread isolation', () => {
    it('should isolate threads by entity', () => {
      ThreadRepository.addMessage(testEntityRef, 'Position message')
      ThreadRepository.addMessage(anotherEntityRef, 'Thought message')

      const positionMessages = ThreadRepository.getMessages(testEntityRef)
      const thoughtMessages = ThreadRepository.getMessages(anotherEntityRef)

      expect(positionMessages).toHaveLength(1)
      expect(thoughtMessages).toHaveLength(1)
      expect(positionMessages[0].content).toBe('Position message')
      expect(thoughtMessages[0].content).toBe('Thought message')
    })
  })
})
