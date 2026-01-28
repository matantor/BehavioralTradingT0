import { describe, it, expect, beforeEach } from 'vitest'
import { JournalRepository } from '@/domain/repositories/JournalRepository'
import { resetData } from '@/lib/storage/storage'
import type { JournalEntry } from '@/domain/types/entities'

// Helper to create valid journal entry input
const createValidEntry = (overrides: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>> = {}) => ({
  type: 'decision' as const,
  actionType: 'buy' as const,
  ticker: 'AAPL',
  quantity: 10,
  price: 150,
  entryTime: new Date().toISOString(),
  positionMode: 'new' as const,
  payment: { asset: 'USD', amount: 1500 },
  ...overrides,
})

describe('JournalRepository', () => {
  beforeEach(() => {
    resetData()
  })

  describe('create', () => {
    it('should create a journal entry with all required fields', () => {
      const entry = JournalRepository.create(createValidEntry())

      expect(entry.id).toBeDefined()
      expect(entry.type).toBe('decision')
      expect(entry.actionType).toBe('buy')
      expect(entry.ticker).toBe('AAPL')
      expect(entry.quantity).toBe(10)
      expect(entry.price).toBe(150)
      expect(entry.createdAt).toBeDefined()
      expect(entry.updatedAt).toBeDefined()
    })

    it('should create entry with payment info for buy action', () => {
      const entry = JournalRepository.create(createValidEntry({
        payment: { asset: 'USD', amount: 1500, isNewMoney: true },
      }))

      expect(entry.payment).toBeDefined()
      expect(entry.payment?.asset).toBe('USD')
      expect(entry.payment?.amount).toBe(1500)
      expect(entry.payment?.isNewMoney).toBe(true)
    })

    it('should create sell entry without payment', () => {
      const entry = JournalRepository.create(createValidEntry({
        actionType: 'sell',
        positionMode: 'existing',
        positionId: 'some-position-id',
        payment: undefined,
      }))

      expect(entry.actionType).toBe('sell')
      expect(entry.payment).toBeUndefined()
    })

    it('should throw error for missing ticker', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({ ticker: '' }))
      }).toThrow('ticker is required')
    })

    it('should throw error for missing quantity', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({ quantity: 0 }))
      }).toThrow('quantity must be a positive number')
    })

    it('should throw error for negative price', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({ price: -10 }))
      }).toThrow('price must be a non-negative number')
    })

    it('should throw error for invalid actionType', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({ actionType: 'invalid' as 'buy' }))
      }).toThrow('actionType must be one of')
    })

    it('should throw error for invalid type (not decision)', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({ type: 'reflection' as 'decision' }))
      }).toThrow('type must be decision')
    })

    it('should throw error when positionMode=existing but no positionId', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({
          positionMode: 'existing',
          positionId: undefined,
        }))
      }).toThrow('positionId is required')
    })

    it('should throw error for buy without payment', () => {
      expect(() => {
        JournalRepository.create(createValidEntry({
          actionType: 'buy',
          payment: undefined,
        }))
      }).toThrow('payment is required for buy')
    })

    it('should uppercase ticker on create', () => {
      const entry = JournalRepository.create(createValidEntry({ ticker: 'aapl' }))
      expect(entry.ticker).toBe('AAPL')
    })
  })

  describe('getById', () => {
    it('should retrieve created entry by id', () => {
      const created = JournalRepository.create(createValidEntry())
      const retrieved = JournalRepository.getById(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent id', () => {
      const result = JournalRepository.getById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return entries sorted by entryTime descending', () => {
      const earlier = new Date('2024-01-01T10:00:00Z').toISOString()
      const later = new Date('2024-01-02T10:00:00Z').toISOString()

      JournalRepository.create(createValidEntry({ entryTime: earlier, ticker: 'FIRST' }))
      JournalRepository.create(createValidEntry({ entryTime: later, ticker: 'SECOND' }))

      const list = JournalRepository.list()
      expect(list).toHaveLength(2)
      // Newer entries should come first
      expect(list[0].ticker).toBe('SECOND')
      expect(list[1].ticker).toBe('FIRST')
    })

    it('should exclude archived entries by default', () => {
      const e1 = JournalRepository.create(createValidEntry({ ticker: 'FIRST' }))
      JournalRepository.create(createValidEntry({ ticker: 'SECOND' }))
      JournalRepository.archive(e1.id)

      const list = JournalRepository.list()
      expect(list).toHaveLength(1)
      expect(list[0].ticker).toBe('SECOND')
    })

    it('should include archived entries when requested', () => {
      const e1 = JournalRepository.create(createValidEntry())
      JournalRepository.archive(e1.id)

      const list = JournalRepository.list(true)
      expect(list).toHaveLength(1)
      expect(list[0].archivedAt).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update entry fields', () => {
      const entry = JournalRepository.create(createValidEntry())

      const updated = JournalRepository.update(entry.id, {
        quantity: 20,
        price: 160,
      })

      expect(updated.quantity).toBe(20)
      expect(updated.price).toBe(160)
    })

    it('should update updatedAt timestamp', () => {
      const entry = JournalRepository.create(createValidEntry())

      const updated = JournalRepository.update(entry.id, {
        quantity: 15,
      })

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(entry.createdAt).getTime()
      )
    })

    it('should not allow invalid actionType in update', () => {
      const entry = JournalRepository.create(createValidEntry())

      expect(() => {
        JournalRepository.update(entry.id, { actionType: 'invalid' as 'buy' })
      }).toThrow('actionType must be one of')
    })

    it('should throw error for non-existent entry', () => {
      expect(() => {
        JournalRepository.update('non-existent', { quantity: 5 })
      }).toThrow('not found')
    })

    it('should uppercase ticker on update', () => {
      const entry = JournalRepository.create(createValidEntry())
      const updated = JournalRepository.update(entry.id, { ticker: 'goog' })
      expect(updated.ticker).toBe('GOOG')
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const entry = JournalRepository.create(createValidEntry())

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

  describe('deposit/withdraw actions', () => {
    it('should create deposit entry', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(entry.actionType).toBe('deposit')
      expect(entry.quantity).toBe(5000)
    })

    it('should create withdraw entry', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        actionType: 'withdraw',
        ticker: 'USD',
        quantity: 1000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(entry.actionType).toBe('withdraw')
      expect(entry.quantity).toBe(1000)
    })
  })

  describe('long/short actions', () => {
    it('should create long entry', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        actionType: 'long',
        ticker: 'BTC',
        quantity: 0.5,
        price: 50000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(entry.actionType).toBe('long')
    })

    it('should create short entry', () => {
      const entry = JournalRepository.create({
        type: 'decision',
        actionType: 'short',
        ticker: 'ETH',
        quantity: 2,
        price: 3000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(entry.actionType).toBe('short')
    })
  })
})
