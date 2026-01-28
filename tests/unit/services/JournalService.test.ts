import { describe, it, expect, beforeEach } from 'vitest'
import { JournalService, RelationService, EventService } from '@/domain/services'
import { resetData } from '@/lib/storage/storage'
import type { JournalCreateInput } from '@/domain/services'

// Helper to create valid journal entry input
const createValidInput = (overrides: Partial<JournalCreateInput> = {}): JournalCreateInput => ({
  actionType: 'buy',
  ticker: 'AAPL',
  quantity: 10,
  price: 150,
  entryTime: new Date().toISOString(),
  positionMode: 'new',
  payment: { asset: 'USD', amount: 1500 },
  ...overrides,
})

describe('JournalService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('list', () => {
    it('returns empty array when no entries exist', () => {
      const entries = JournalService.list()
      expect(entries).toEqual([])
    })

    it('returns all created entries', () => {
      JournalService.create(createValidInput({ ticker: 'AAPL' }))
      JournalService.create(createValidInput({ ticker: 'GOOG' }))
      JournalService.create(createValidInput({ ticker: 'MSFT' }))

      const entries = JournalService.list()
      expect(entries).toHaveLength(3)

      const tickers = entries.map(e => e.ticker)
      expect(tickers).toContain('AAPL')
      expect(tickers).toContain('GOOG')
      expect(tickers).toContain('MSFT')
    })

    it('filters by actionType when filter provided', () => {
      const buy1 = JournalService.create(createValidInput({ actionType: 'buy', ticker: 'BUY1' }))
      // Sell from the buy1 position
      JournalService.create({
        actionType: 'sell',
        ticker: 'BUY1',
        quantity: 5,
        price: 160,
        entryTime: new Date().toISOString(),
        positionMode: 'existing',
        positionId: buy1.position.id,
      })
      JournalService.create(createValidInput({ actionType: 'buy', ticker: 'BUY2' }))

      const buys = JournalService.list({ actionType: 'buy' })
      expect(buys).toHaveLength(2)
      expect(buys.every(e => e.actionType === 'buy')).toBe(true)
    })
  })

  describe('get', () => {
    it('returns null for non-existent id', () => {
      const entry = JournalService.get('non-existent-id')
      expect(entry).toBeNull()
    })

    it('returns entry by id', () => {
      const result = JournalService.create(createValidInput({ ticker: 'TEST' }))

      const retrieved = JournalService.get(result.journalEntry.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(result.journalEntry.id)
      expect(retrieved?.ticker).toBe('TEST')
    })
  })

  describe('create', () => {
    it('creates entry with all mandatory fields', () => {
      const result = JournalService.create(createValidInput())

      expect(result.journalEntry.id).toBeDefined()
      expect(result.journalEntry.createdAt).toBeDefined()
      expect(result.journalEntry.updatedAt).toBeDefined()
      expect(result.journalEntry.type).toBe('decision')
      expect(result.journalEntry.actionType).toBe('buy')
      expect(result.journalEntry.ticker).toBe('AAPL')
      expect(result.journalEntry.quantity).toBe(10)
      expect(result.journalEntry.price).toBe(150)
    })

    it('creates position for new buy action', () => {
      const result = JournalService.create(createValidInput({
        ticker: 'AAPL',
        quantity: 100,
        price: 150,
      }))

      expect(result.position).toBeDefined()
      expect(result.position.ticker).toBe('AAPL')
      expect(result.position.quantity).toBe(100)
      expect(result.position.avgCost).toBe(150)
    })

    it('creates relation between journal and position', () => {
      const result = JournalService.create(createValidInput())

      const relations = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relations).toHaveLength(1)
      expect(relations[0].toRef.type).toBe('position')
      expect(relations[0].toRef.id).toBe(result.position.id)
    })

    it('emits trade event', () => {
      const result = JournalService.create(createValidInput())

      const events = EventService.listByType('trade.buy')
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe(result.eventId)
    })

    it('persists entry to storage', () => {
      const result = JournalService.create(createValidInput({ ticker: 'PERSISTED' }))

      const retrieved = JournalService.get(result.journalEntry.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.ticker).toBe('PERSISTED')
    })

    it('stores payment info for buys', () => {
      const result = JournalService.create(createValidInput({
        payment: { asset: 'USD', amount: 1500, isNewMoney: false },
      }))

      expect(result.journalEntry.payment).toBeDefined()
      expect(result.journalEntry.payment?.asset).toBe('USD')
      expect(result.journalEntry.payment?.amount).toBe(1500)
    })

    it('stores optional meta fields', () => {
      const result = JournalService.create(createValidInput({
        meta: {
          rationale: 'Good value',
          fees: 5.99,
          venue: 'Robinhood',
        },
      }))

      expect(result.journalEntry.meta?.rationale).toBe('Good value')
      expect(result.journalEntry.meta?.fees).toBe(5.99)
      expect(result.journalEntry.meta?.venue).toBe('Robinhood')
    })
  })

  describe('buy action', () => {
    it('creates new position when positionMode is new', () => {
      const result = JournalService.create(createValidInput({
        positionMode: 'new',
        ticker: 'NEWPOS',
        quantity: 50,
        price: 100,
      }))

      expect(result.position.ticker).toBe('NEWPOS')
      expect(result.position.quantity).toBe(50)
      expect(result.position.avgCost).toBe(100)
    })

    it('increases existing position when positionMode is existing', () => {
      // Create initial position via a buy
      const first = JournalService.create(createValidInput({
        ticker: 'AAPL',
        quantity: 100,
        price: 100,
      }))

      // Buy more of the same position
      const result = JournalService.create(createValidInput({
        positionMode: 'existing',
        positionId: first.position.id,
        ticker: 'AAPL',
        quantity: 100,
        price: 150,
      }))

      // New avg cost: (100*100 + 100*150) / 200 = 25000/200 = 125
      expect(result.position.quantity).toBe(200)
      expect(result.position.avgCost).toBe(125)
    })

    it('rejects buy into closed position', () => {
      const first = JournalService.create(createValidInput({ ticker: 'CLOSED' }))

      // Sell all to close
      JournalService.create({
        actionType: 'sell',
        ticker: 'CLOSED',
        quantity: 10,
        price: 160,
        entryTime: new Date().toISOString(),
        positionMode: 'existing',
        positionId: first.position.id,
      })

      expect(() => {
        JournalService.create(createValidInput({
          positionMode: 'existing',
          positionId: first.position.id,
        }))
      }).toThrow('Cannot buy into closed position')
    })
  })

  describe('sell action', () => {
    it('decreases position quantity', () => {
      const first = JournalService.create(createValidInput({
        quantity: 100,
        price: 100,
      }))

      const result = JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 30,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'existing',
        positionId: first.position.id,
      })

      expect(result.position.quantity).toBe(70)
    })

    it('closes position when selling all shares', () => {
      const first = JournalService.create(createValidInput({
        quantity: 100,
        price: 100,
      }))

      const result = JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 100,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'existing',
        positionId: first.position.id,
      })

      expect(result.position.quantity).toBe(0)
      expect(result.position.closedAt).toBeDefined()
    })

    it('rejects sell exceeding held quantity', () => {
      const first = JournalService.create(createValidInput({
        quantity: 50,
        price: 100,
      }))

      expect(() => {
        JournalService.create({
          actionType: 'sell',
          ticker: 'AAPL',
          quantity: 100,
          price: 150,
          entryTime: new Date().toISOString(),
          positionMode: 'existing',
          positionId: first.position.id,
        })
      }).toThrow('Cannot sell 100; only 50 held')
    })

    it('rejects sell with positionMode=new', () => {
      expect(() => {
        JournalService.create({
          actionType: 'sell',
          ticker: 'AAPL',
          quantity: 10,
          price: 150,
          entryTime: new Date().toISOString(),
          positionMode: 'new',
        })
      }).toThrow('Cannot sell a new position')
    })
  })

  describe('deposit/withdraw actions', () => {
    it('creates cash position on deposit', () => {
      const result = JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(result.position.ticker).toBe('USD')
      expect(result.position.quantity).toBe(5000)
    })

    it('increases cash on subsequent deposit', () => {
      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      const result = JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 3000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(result.position.quantity).toBe(8000)
    })

    it('decreases cash on withdraw', () => {
      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      const result = JournalService.create({
        actionType: 'withdraw',
        ticker: 'USD',
        quantity: 2000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(result.position.quantity).toBe(3000)
    })

    it('rejects withdraw exceeding available cash', () => {
      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 1000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(() => {
        JournalService.create({
          actionType: 'withdraw',
          ticker: 'USD',
          quantity: 5000,
          price: 1,
          entryTime: new Date().toISOString(),
          positionMode: 'new',
        })
      }).toThrow('Cannot withdraw 5000; only 1000 available')
    })
  })

  describe('long/short actions', () => {
    it('creates long position', () => {
      const result = JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 0.5,
        price: 50000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(result.position.ticker).toBe('BTC')
      expect(result.position.quantity).toBe(0.5)
    })

    it('creates short position', () => {
      const result = JournalService.create({
        actionType: 'short',
        ticker: 'ETH',
        quantity: 2,
        price: 3000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(result.position.ticker).toBe('ETH')
      expect(result.position.quantity).toBe(2)
    })
  })

  describe('update', () => {
    it('updates entry fields', () => {
      const result = JournalService.create(createValidInput())

      const updated = JournalService.update(result.journalEntry.id, {
        quantity: 20,
        price: 160,
      })

      expect(updated.quantity).toBe(20)
      expect(updated.price).toBe(160)
    })

    it('preserves createdAt on update', () => {
      const result = JournalService.create(createValidInput())
      const originalCreatedAt = result.journalEntry.createdAt

      const updated = JournalService.update(result.journalEntry.id, { quantity: 15 })
      expect(updated.createdAt).toBe(originalCreatedAt)
    })
  })

  describe('archive', () => {
    it('sets archivedAt timestamp', () => {
      const result = JournalService.create(createValidInput())

      JournalService.archive(result.journalEntry.id)

      const archived = JournalService.get(result.journalEntry.id)
      expect(archived?.archivedAt).toBeDefined()
    })

    it('excludes archived entries from list', () => {
      const result1 = JournalService.create(createValidInput({ ticker: 'KEEP' }))
      const result2 = JournalService.create(createValidInput({ ticker: 'ARCHIVE' }))

      JournalService.archive(result2.journalEntry.id)

      const entries = JournalService.list()
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe(result1.journalEntry.id)
    })
  })

  describe('bidirectional linking', () => {
    it('journal links show on position detail via relations', () => {
      const result = JournalService.create(createValidInput({ ticker: 'MSFT' }))

      // Check relations from position's perspective
      const positionRelations = RelationService.listForEntity({
        type: 'position',
        id: result.position.id,
      })

      expect(positionRelations).toHaveLength(1)
      expect(positionRelations[0].fromRef.type).toBe('journal')
      expect(positionRelations[0].fromRef.id).toBe(result.journalEntry.id)
    })
  })

  describe('context anchors in meta', () => {
    it('preserves context anchors', () => {
      const result = JournalService.create(createValidInput({
        meta: {
          contextAnchors: [
            { entityType: 'thesis', entityId: 'thesis-1', role: 'intent' },
            { entityType: 'thought', entityId: 'thought-1', role: 'reference' }
          ]
        }
      }))

      const anchors = result.journalEntry.meta?.contextAnchors as Array<{ entityType: string }>
      expect(anchors).toHaveLength(2)
      expect(anchors.map(a => a.entityType)).toContain('thesis')
      expect(anchors.map(a => a.entityType)).toContain('thought')
    })

    it('allows entry without thesis context', () => {
      // Thesis is optional per user clarification
      const result = JournalService.create(createValidInput())

      expect(result.journalEntry.id).toBeDefined()
      expect(result.journalEntry.meta?.contextAnchors).toBeUndefined()
    })
  })
})
