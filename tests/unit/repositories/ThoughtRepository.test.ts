import { describe, it, expect, beforeEach } from 'vitest'
import { ThoughtRepository } from '@/domain/repositories/ThoughtRepository'
import { resetData } from '@/lib/storage/storage'

describe('ThoughtRepository', () => {
  beforeEach(() => {
    resetData()
  })

  describe('create', () => {
    it('should create a thought with content', () => {
      const thought = ThoughtRepository.create({
        content: 'Interesting market pattern today',
      })

      expect(thought.id).toBeDefined()
      expect(thought.content).toBe('Interesting market pattern today')
      expect(thought.createdAt).toBeDefined()
      expect(thought.updatedAt).toBeDefined()
    })

    it('should throw error for missing content', () => {
      expect(() => {
        ThoughtRepository.create({ content: '' })
      }).toThrow('content is required')
    })
  })

  describe('getById', () => {
    it('should retrieve created thought by id', () => {
      const created = ThoughtRepository.create({
        content: 'Test thought',
      })

      const retrieved = ThoughtRepository.getById(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent id', () => {
      const result = ThoughtRepository.getById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should list all non-archived thoughts', () => {
      ThoughtRepository.create({ content: 'Thought 1' })
      ThoughtRepository.create({ content: 'Thought 2' })

      const list = ThoughtRepository.list()
      expect(list).toHaveLength(2)
    })

    it('should exclude archived thoughts by default', () => {
      const t1 = ThoughtRepository.create({ content: 'Thought 1' })
      ThoughtRepository.create({ content: 'Thought 2' })
      ThoughtRepository.archive(t1.id)

      const list = ThoughtRepository.list()
      expect(list).toHaveLength(1)
      expect(list[0].content).toBe('Thought 2')
    })

    it('should include archived thoughts when requested', () => {
      const t1 = ThoughtRepository.create({ content: 'Thought 1' })
      ThoughtRepository.archive(t1.id)

      const list = ThoughtRepository.list(true)
      expect(list).toHaveLength(1)
      expect(list[0].archivedAt).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update thought content', () => {
      const thought = ThoughtRepository.create({
        content: 'Original content',
      })

      const updated = ThoughtRepository.update(thought.id, {
        content: 'Updated content',
      })

      expect(updated.content).toBe('Updated content')
    })

    it('should update updatedAt timestamp', () => {
      const thought = ThoughtRepository.create({
        content: 'Original',
      })

      const updated = ThoughtRepository.update(thought.id, {
        content: 'Updated',
      })

      // updatedAt should be >= createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(thought.createdAt).getTime()
      )
      expect(updated.updatedAt).toBeDefined()
    })

    it('should not allow changing id or createdAt', () => {
      const thought = ThoughtRepository.create({
        content: 'Test',
      })

      const updated = ThoughtRepository.update(thought.id, {
        id: 'different-id',
        createdAt: '2020-01-01T00:00:00.000Z',
      } as { id: string; createdAt: string })

      expect(updated.id).toBe(thought.id)
      expect(updated.createdAt).toBe(thought.createdAt)
    })

    it('should throw error for non-existent thought', () => {
      expect(() => {
        ThoughtRepository.update('non-existent', { content: 'New' })
      }).toThrow('not found')
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const thought = ThoughtRepository.create({
        content: 'Test thought',
      })

      ThoughtRepository.archive(thought.id)

      const retrieved = ThoughtRepository.getById(thought.id)
      expect(retrieved?.archivedAt).toBeDefined()
    })

    it('should throw error for non-existent thought', () => {
      expect(() => {
        ThoughtRepository.archive('non-existent')
      }).toThrow('not found')
    })
  })
})
