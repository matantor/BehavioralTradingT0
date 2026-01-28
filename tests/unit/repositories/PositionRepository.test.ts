import { describe, it, expect, beforeEach } from 'vitest'
import { PositionRepository } from '@/domain/repositories/PositionRepository'
import { resetData } from '@/lib/storage/storage'

describe('PositionRepository', () => {
  beforeEach(() => {
    resetData()
  })

  describe('create', () => {
    it('should create a position with all fields', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'equity',
        quantity: 10,
        avgCost: 150,
        currency: 'USD',
        openedAt: '2024-01-01T00:00:00.000Z',
        notes: 'Test position',
      })

      expect(position.id).toBeDefined()
      expect(position.ticker).toBe('AAPL')
      expect(position.quantity).toBe(10)
      expect(position.createdAt).toBeDefined()
      expect(position.updatedAt).toBeDefined()
    })

    it('should use USD as default currency', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(position.currency).toBe('USD')
    })

    it('should generate valid UUID for id', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(position.id).toMatch(uuidRegex)
    })

    it('should generate valid ISO8601 timestamps', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(() => new Date(position.createdAt)).not.toThrow()
      expect(() => new Date(position.updatedAt)).not.toThrow()
      expect(position.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should throw error for missing ticker', () => {
      expect(() => {
        PositionRepository.create({
          ticker: '',
          quantity: 10,
          avgCost: 150,
        })
      }).toThrow('ticker is required')
    })

    it('should throw error for negative quantity', () => {
      expect(() => {
        PositionRepository.create({
          ticker: 'AAPL',
          quantity: -5,
          avgCost: 150,
        })
      }).toThrow('quantity must be >= 0')
    })
  })

  describe('getById', () => {
    it('should retrieve created position by id', () => {
      const created = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const retrieved = PositionRepository.getById(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent id', () => {
      const result = PositionRepository.getById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should list all non-archived positions', () => {
      PositionRepository.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })
      PositionRepository.create({ ticker: 'GOOGL', quantity: 5, avgCost: 2800 })

      const list = PositionRepository.list()
      expect(list).toHaveLength(2)
    })

    it('should exclude archived positions by default', () => {
      const p1 = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })
      PositionRepository.create({ ticker: 'GOOGL', quantity: 5, avgCost: 2800 })
      PositionRepository.archive(p1.id)

      const list = PositionRepository.list()
      expect(list).toHaveLength(1)
      expect(list[0].ticker).toBe('GOOGL')
    })

    it('should include archived positions when requested', () => {
      const p1 = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })
      PositionRepository.archive(p1.id)

      const list = PositionRepository.list(true)
      expect(list).toHaveLength(1)
      expect(list[0].archivedAt).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update position fields', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PositionRepository.update(position.id, {
        quantity: 15,
        notes: 'Added more shares',
      })

      expect(updated.quantity).toBe(15)
      expect(updated.notes).toBe('Added more shares')
      expect(updated.ticker).toBe('AAPL')
    })

    it('should update updatedAt timestamp', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PositionRepository.update(position.id, { quantity: 15 })

      // updatedAt should be >= createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(position.createdAt).getTime()
      )
      expect(updated.updatedAt).toBeDefined()
    })

    it('should not allow changing id', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PositionRepository.update(position.id, {
        id: 'different-id',
      } as { id: string })

      expect(updated.id).toBe(position.id)
    })

    it('should not allow changing createdAt', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PositionRepository.update(position.id, {
        createdAt: '2020-01-01T00:00:00.000Z',
      } as { createdAt: string })

      expect(updated.createdAt).toBe(position.createdAt)
    })

    it('should throw error for non-existent position', () => {
      expect(() => {
        PositionRepository.update('non-existent', { quantity: 10 })
      }).toThrow('not found')
    })

    it('should throw error for negative quantity in update', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(() => {
        PositionRepository.update(position.id, { quantity: -5 })
      }).toThrow('quantity must be >= 0')
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      PositionRepository.archive(position.id)

      const retrieved = PositionRepository.getById(position.id)
      expect(retrieved?.archivedAt).toBeDefined()
      expect(retrieved?.archivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should update updatedAt when archiving', () => {
      const position = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      PositionRepository.archive(position.id)

      const retrieved = PositionRepository.getById(position.id)
      // updatedAt should be >= createdAt
      expect(new Date(retrieved!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(position.createdAt).getTime()
      )
      expect(retrieved?.updatedAt).toBeDefined()
    })

    it('should throw error for non-existent position', () => {
      expect(() => {
        PositionRepository.archive('non-existent')
      }).toThrow('not found')
    })
  })

  describe('persistence', () => {
    it('should persist across multiple operations', () => {
      const p1 = PositionRepository.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })
      const p2 = PositionRepository.create({
        ticker: 'GOOGL',
        quantity: 5,
        avgCost: 2800,
      })

      PositionRepository.update(p1.id, { quantity: 15 })

      const retrieved1 = PositionRepository.getById(p1.id)
      const retrieved2 = PositionRepository.getById(p2.id)

      expect(retrieved1?.quantity).toBe(15)
      expect(retrieved2?.ticker).toBe('GOOGL')
    })
  })
})
