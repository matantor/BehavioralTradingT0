import { describe, it, expect, beforeEach } from 'vitest'
import { JournalRepository } from '@/domain/repositories/JournalRepository'
import { resetData } from '@/lib/storage/storage'

describe('JournalRepository', () => {
  beforeEach(() => {
    resetData()
  })

  describe('create', () => {
    it('should create a journal entry with all required fields', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        title: 'Bought AAPL',
        content: 'Decided to buy Apple stock based on earnings.',
      })

      expect(entry.id).toBeDefined()
      expect(entry.type).toBe('decision')
      expect(entry.title).toBe('Bought AAPL')
      expect(entry.createdAt).toBeDefined()
      expect(entry.updatedAt).toBeDefined()
    })

    it('should create entry with portfolioAction', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        title: 'Bought AAPL',
        content: 'Bought 10 shares',
        portfolioAction: {
          actionType: 'buy',
          quantity: 10,
          price: 150,
        },
      })

      expect(entry.portfolioAction).toBeDefined()
      expect(entry.portfolioAction?.actionType).toBe('buy')
    })

    it('should throw error for missing title', () => {
      expect(() => {
        JournalRepository.create({
          type: 'decision',
          title: '',
          content: 'Test',
        })
      }).toThrow('title is required')
    })

    it('should throw error for missing content', () => {
      expect(() => {
        JournalRepository.create({
          type: 'decision',
          title: 'Test',
          content: '',
        })
      }).toThrow('content is required')
    })

    it('should throw error for invalid type', () => {
      expect(() => {
        JournalRepository.create({
          type: 'invalid' as 'decision',
          title: 'Test',
          content: 'Test',
        })
      }).toThrow('type must be')
    })
  })

  describe('getById', () => {
    it('should retrieve created entry by id', () => {
      const created = JournalRepository.create({
        type: 'reflection',
        title: 'Market thoughts',
        content: 'Interesting day',
      })

      const retrieved = JournalRepository.getById(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent id', () => {
      const result = JournalRepository.getById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return entries sorted by createdAt descending', () => {
      JournalRepository.create({
        type: 'note',
        title: 'First',
        content: 'First entry',
      })

      JournalRepository.create({
        type: 'note',
        title: 'Second',
        content: 'Second entry',
      })

      const list = JournalRepository.list()
      expect(list).toHaveLength(2)
      // Newer entries should come first
      expect(new Date(list[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(list[1].createdAt).getTime()
      )
    })

    it('should exclude archived entries by default', () => {
      const e1 = JournalRepository.create({
        type: 'note',
        title: 'First',
        content: 'First',
      })
      JournalRepository.create({
        type: 'note',
        title: 'Second',
        content: 'Second',
      })
      JournalRepository.archive(e1.id)

      const list = JournalRepository.list()
      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('Second')
    })

    it('should include archived entries when requested', () => {
      const e1 = JournalRepository.create({
        type: 'note',
        title: 'First',
        content: 'First',
      })
      JournalRepository.archive(e1.id)

      const list = JournalRepository.list(true)
      expect(list).toHaveLength(1)
      expect(list[0].archivedAt).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update entry fields', () => {
      const entry = JournalRepository.create({
        type: 'note',
        title: 'Original',
        content: 'Original content',
      })

      const updated = JournalRepository.update(entry.id, {
        title: 'Updated',
        content: 'Updated content',
      })

      expect(updated.title).toBe('Updated')
      expect(updated.content).toBe('Updated content')
    })

    it('should update updatedAt timestamp', () => {
      const entry = JournalRepository.create({
        type: 'note',
        title: 'Test',
        content: 'Test',
      })

      const updated = JournalRepository.update(entry.id, {
        title: 'New Title',
      })

      // updatedAt should be >= createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(entry.createdAt).getTime()
      )
      expect(updated.updatedAt).toBeDefined()
    })

    it('should not allow invalid type in update', () => {
      const entry = JournalRepository.create({
        type: 'note',
        title: 'Test',
        content: 'Test',
      })

      expect(() => {
        JournalRepository.update(entry.id, { type: 'invalid' as 'decision' })
      }).toThrow('type must be')
    })

    it('should throw error for non-existent entry', () => {
      expect(() => {
        JournalRepository.update('non-existent', { title: 'New' })
      }).toThrow('not found')
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const entry = JournalRepository.create({
        type: 'note',
        title: 'Test',
        content: 'Test',
      })

      JournalRepository.archive(entry.id)

      const retrieved = JournalRepository.getById(entry.id)
      expect(retrieved?.archivedAt).toBeDefined()
    })

    it('should throw error for non-existent entry', () => {
      expect(() => {
        JournalRepository.archive('non-existent')
      }).toThrow('not found')
    })
  })
})
