import { describe, it, expect, beforeEach } from 'vitest'
import { PortfolioService, JournalService, RelationService } from '@/domain/services'
import { resetData } from '@/lib/storage/storage'

describe('PortfolioService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('list', () => {
    it('should return empty array when no positions exist', () => {
      const positions = PortfolioService.list()
      expect(positions).toEqual([])
    })

    it('should return only active positions by default', () => {
      const active1 = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const active2 = PortfolioService.create({
        ticker: 'MSFT',
        quantity: 5,
        avgCost: 250,
      })

      PortfolioService.create({
        ticker: 'GOOGL',
        quantity: 20,
        avgCost: 100,
      })

      PortfolioService.archive(active2.id)

      const positions = PortfolioService.list(false)
      expect(positions).toHaveLength(2)
      expect(positions.map(p => p.id)).toContain(active1.id)
      expect(positions.map(p => p.id)).not.toContain(active2.id)
    })

    it('should return archived positions when includeArchived is true', () => {
      const active = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const archived = PortfolioService.create({
        ticker: 'MSFT',
        quantity: 5,
        avgCost: 250,
      })

      PortfolioService.archive(archived.id)

      const all = PortfolioService.list(true)
      expect(all).toHaveLength(2)
      expect(all.map(p => p.id)).toContain(active.id)
      expect(all.map(p => p.id)).toContain(archived.id)
    })
  })

  describe('listOpen', () => {
    it('returns positions with quantity > 0', () => {
      const open = PortfolioService.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })
      PortfolioService.create({ ticker: 'MSFT', quantity: 0, avgCost: 100 }) // closed position

      const openPositions = PortfolioService.listOpen()
      expect(openPositions).toHaveLength(1)
      expect(openPositions[0].id).toBe(open.id)
    })

    it('excludes archived positions by default', () => {
      const open = PortfolioService.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })
      PortfolioService.archive(open.id)

      const openPositions = PortfolioService.listOpen()
      expect(openPositions).toHaveLength(0)
    })
  })

  describe('listClosed', () => {
    it('returns positions with quantity === 0', () => {
      PortfolioService.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })
      const closed = PortfolioService.create({ ticker: 'MSFT', quantity: 0, avgCost: 100 })

      const closedPositions = PortfolioService.listClosed()
      expect(closedPositions).toHaveLength(1)
      expect(closedPositions[0].id).toBe(closed.id)
    })
  })

  describe('get', () => {
    it('should return position by id', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const found = PortfolioService.get(created.id)
      expect(found).toBeTruthy()
      expect(found?.id).toBe(created.id)
      expect(found?.ticker).toBe('AAPL')
    })

    it('should return null for non-existent id', () => {
      const found = PortfolioService.get('non-existent-id')
      expect(found).toBeNull()
    })

    it('should return archived position', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      PortfolioService.archive(created.id)

      const found = PortfolioService.get(created.id)
      expect(found).toBeTruthy()
      expect(found?.archivedAt).toBeDefined()
    })
  })

  describe('create', () => {
    it('should create position with minimal fields', () => {
      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(position.id).toBeDefined()
      expect(position.ticker).toBe('AAPL')
      expect(position.quantity).toBe(10)
      expect(position.avgCost).toBe(150)
      expect(position.currency).toBe('USD')
      expect(position.createdAt).toBeDefined()
      expect(position.updatedAt).toBeDefined()
    })

    it('should create position with all optional fields', () => {
      const position = PortfolioService.create({
        ticker: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'equity',
        quantity: 10,
        avgCost: 150,
        currency: 'USD',
        openedAt: '2024-01-01T00:00:00.000Z',
        notes: 'Test position',
      })

      expect(position.name).toBe('Apple Inc.')
      expect(position.assetType).toBe('equity')
      expect(position.openedAt).toBe('2024-01-01T00:00:00.000Z')
      expect(position.notes).toBe('Test position')
    })

    it('should default currency to USD', () => {
      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(position.currency).toBe('USD')
    })

    it('should set initial closedAt to undefined', () => {
      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(position.closedAt).toBeUndefined()
    })
  })

  describe('update', () => {
    it('should update position fields', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PortfolioService.update(created.id, {
        ticker: 'MSFT',
        name: 'Microsoft Corp.',
        quantity: 15,
        avgCost: 200,
      })

      expect(updated.id).toBe(created.id)
      expect(updated.ticker).toBe('MSFT')
      expect(updated.name).toBe('Microsoft Corp.')
      expect(updated.quantity).toBe(15)
      expect(updated.avgCost).toBe(200)
    })

    it('should update closedAt', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const closedAt = '2024-06-15T00:00:00.000Z'
      const updated = PortfolioService.update(created.id, {
        closedAt,
      })

      expect(updated.closedAt).toBe(closedAt)
    })

    it('should preserve createdAt on update', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      const updated = PortfolioService.update(created.id, {
        quantity: 15,
      })

      expect(updated.createdAt).toBe(created.createdAt)
      expect(updated.updatedAt).toBeDefined()
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      PortfolioService.archive(created.id)

      const archived = PortfolioService.get(created.id)
      expect(archived?.archivedAt).toBeDefined()
      expect(new Date(archived!.archivedAt!).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should remove archived position from default list', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      expect(PortfolioService.list(false)).toHaveLength(1)

      PortfolioService.archive(created.id)

      expect(PortfolioService.list(false)).toHaveLength(0)
    })

    it('should include archived position when includeArchived is true', () => {
      const created = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      PortfolioService.archive(created.id)

      const all = PortfolioService.list(true)
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(created.id)
      expect(all[0].archivedAt).toBeDefined()
    })
  })

  describe('setCurrentPrice', () => {
    it('sets the current price on a position', () => {
      const pos = PortfolioService.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })

      const updated = PortfolioService.setCurrentPrice(pos.id, 175)

      expect(updated.currentPrice).toBe(175)
    })

    it('rejects negative prices', () => {
      const pos = PortfolioService.create({ ticker: 'AAPL', quantity: 10, avgCost: 150 })

      expect(() => PortfolioService.setCurrentPrice(pos.id, -10)).toThrow('Price cannot be negative')
    })
  })

  describe('isLeveraged', () => {
    it('returns true for positions with meta.leveraged = true', () => {
      const result = JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 1,
        price: 50000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(PortfolioService.isLeveraged(result.position)).toBe(true)
    })

    it('returns false for spot positions', () => {
      const result = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      expect(PortfolioService.isLeveraged(result.position)).toBe(false)
    })
  })

  describe('isCash', () => {
    it('returns true for cash positions', () => {
      const result = JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(PortfolioService.isCash(result.position)).toBe(true)
    })

    it('returns false for non-cash positions', () => {
      const result = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      expect(PortfolioService.isCash(result.position)).toBe(false)
    })
  })

  describe('getUnrealizedPnL', () => {
    it('returns null if no currentPrice set', () => {
      const result = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      expect(PortfolioService.getUnrealizedPnL(result.position)).toBeNull()
    })

    it('returns null for leveraged positions', () => {
      const result = JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 1,
        price: 50000,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      PortfolioService.setCurrentPrice(result.position.id, 55000)
      const pos = PortfolioService.get(result.position.id)!

      expect(PortfolioService.getUnrealizedPnL(pos)).toBeNull()
    })

    it('returns null for cash positions', () => {
      const result = JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
      })

      expect(PortfolioService.getUnrealizedPnL(result.position)).toBeNull()
    })

    it('calculates unrealized P&L correctly', () => {
      const result = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      PortfolioService.setCurrentPrice(result.position.id, 175)
      const pos = PortfolioService.get(result.position.id)!

      // (175 - 150) * 10 = 250
      expect(PortfolioService.getUnrealizedPnL(pos)).toBe(250)
    })

    it('handles negative unrealized P&L', () => {
      const result = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      PortfolioService.setCurrentPrice(result.position.id, 140)
      const pos = PortfolioService.get(result.position.id)!

      // (140 - 150) * 10 = -100
      expect(PortfolioService.getUnrealizedPnL(pos)).toBe(-100)
    })
  })

  describe('getRealizedPnL', () => {
    it('returns 0 for positions with no sells', () => {
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      expect(PortfolioService.getRealizedPnL('AAPL')).toBe(0)
    })

    it('calculates realized P&L from sell at profit', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 5,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      // Sold 5 @ $150, cost was $100 each
      // Realized = (150 - 100) * 5 = 250
      expect(PortfolioService.getRealizedPnL('AAPL')).toBe(250)
    })

    it('calculates realized P&L from sell at loss', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })

      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 5,
        price: 100,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      // Sold 5 @ $100, cost was $150 each
      // Realized = (100 - 150) * 5 = -250
      expect(PortfolioService.getRealizedPnL('AAPL')).toBe(-250)
    })

    it('handles multiple buys and sells with avg cost', () => {
      // Buy 10 @ $100
      const buy1 = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      // Buy 10 more @ $200 (avg cost now = (1000 + 2000) / 20 = 150)
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 200,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy1.position.id,
        payment: { asset: 'USD', amount: 2000 },
      })

      // Sell 10 @ $175
      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 10,
        price: 175,
        entryTime: '2024-03-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy1.position.id,
      })

      // Realized = (175 - 150) * 10 = 250
      expect(PortfolioService.getRealizedPnL('AAPL')).toBe(250)
    })

    it('handles complete position close', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      // Sold all 10 @ $150, cost $100 = (150-100)*10 = 500
      expect(PortfolioService.getRealizedPnL('AAPL')).toBe(500)
    })

    it('is case-insensitive for ticker', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      expect(PortfolioService.getRealizedPnL('aapl')).toBe(500)
    })

    it('ignores deposit/withdraw entries', () => {
      // Deposit some cash
      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      expect(PortfolioService.getRealizedPnL('USD')).toBe(0)
    })

    it('ignores long/short entries', () => {
      JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 1,
        price: 50000,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      expect(PortfolioService.getRealizedPnL('BTC')).toBe(0)
    })
  })

  describe('getCombinedPnL', () => {
    it('returns realized and unrealized P&L', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 20,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 2000 },
      })

      // Sell half at profit
      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      // Set current price for unrealized
      PortfolioService.setCurrentPrice(buy.position.id, 175)
      const pos = PortfolioService.get(buy.position.id)!

      const pnl = PortfolioService.getCombinedPnL(pos)

      // Realized = (150-100)*10 = 500
      // Unrealized = (175-100)*10 = 750
      // Combined = 1250
      expect(pnl.realized).toBe(500)
      expect(pnl.unrealized).toBe(750)
      expect(pnl.combined).toBe(1250)
    })

    it('returns null combined if no current price', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      const pnl = PortfolioService.getCombinedPnL(buy.position)

      expect(pnl.realized).toBe(0)
      expect(pnl.unrealized).toBeNull()
      expect(pnl.combined).toBeNull()
    })
  })

  describe('getPortfolioTotals', () => {
    it('returns zeros for empty portfolio', () => {
      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.totalValue).toBe(0)
      expect(totals.totalCostBasis).toBe(0)
      expect(totals.unrealizedPnL).toBe(0)
      expect(totals.realizedPnL).toBe(0)
      expect(totals.combinedPnL).toBe(0)
      expect(totals.positionCount).toBe(0)
    })

    it('calculates totals for single position', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      PortfolioService.setCurrentPrice(buy.position.id, 150)

      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.totalCostBasis).toBe(1000)  // 10 * 100
      expect(totals.totalValue).toBe(1500)      // 10 * 150
      expect(totals.unrealizedPnL).toBe(500)    // 10 * (150-100)
      expect(totals.realizedPnL).toBe(0)
      expect(totals.combinedPnL).toBe(500)
      expect(totals.positionCount).toBe(1)
    })

    it('excludes leveraged positions', () => {
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 1,
        price: 50000,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.positionCount).toBe(1)
      expect(totals.totalCostBasis).toBe(1000) // Only AAPL
    })

    it('excludes cash positions', () => {
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.positionCount).toBe(1)
      expect(totals.totalCostBasis).toBe(1000)
    })

    it('returns null unrealized if any position missing price', () => {
      const buy1 = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'buy',
        ticker: 'MSFT',
        quantity: 5,
        price: 200,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      // Only set price for AAPL
      PortfolioService.setCurrentPrice(buy1.position.id, 150)

      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.unrealizedPnL).toBeNull()
      expect(totals.combinedPnL).toBeNull()
      expect(totals.positionCount).toBe(2)
    })

    it('includes realized P&L from closed positions', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      // Sell all to close
      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      const totals = PortfolioService.getPortfolioTotals()

      expect(totals.positionCount).toBe(0) // No open positions
      expect(totals.realizedPnL).toBe(500) // But realized P&L is counted
    })
  })

  describe('getHistoricalSnapshots', () => {
    it('returns empty array when no journal entries', () => {
      const snapshots = PortfolioService.getHistoricalSnapshots()
      expect(snapshots).toEqual([])
    })

    it('tracks portfolio value over time', () => {
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      const snapshots = PortfolioService.getHistoricalSnapshots()

      expect(snapshots).toHaveLength(1)
      expect(snapshots[0].portfolioValue).toBe(1000) // 10 * 100
      expect(snapshots[0].cumulativePnL).toBe(0)
    })

    it('tracks cumulative P&L from sells', () => {
      const buy = JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'sell',
        ticker: 'AAPL',
        quantity: 5,
        price: 150,
        entryTime: '2024-02-01T00:00:00Z',
        positionMode: 'existing',
        positionId: buy.position.id,
      })

      const snapshots = PortfolioService.getHistoricalSnapshots()

      expect(snapshots).toHaveLength(2)
      expect(snapshots[1].cumulativePnL).toBe(250) // (150-100)*5
    })

    it('ignores deposit/withdraw entries', () => {
      JournalService.create({
        actionType: 'deposit',
        ticker: 'USD',
        quantity: 5000,
        price: 1,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      const snapshots = PortfolioService.getHistoricalSnapshots()
      expect(snapshots).toEqual([])
    })

    it('ignores long/short entries', () => {
      JournalService.create({
        actionType: 'long',
        ticker: 'BTC',
        quantity: 1,
        price: 50000,
        entryTime: '2024-01-01T00:00:00Z',
        positionMode: 'new',
      })

      const snapshots = PortfolioService.getHistoricalSnapshots()
      expect(snapshots).toEqual([])
    })

    it('orders snapshots by entry time', () => {
      JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 100,
        entryTime: '2024-01-15T00:00:00Z', // Second chronologically
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      JournalService.create({
        actionType: 'buy',
        ticker: 'MSFT',
        quantity: 5,
        price: 200,
        entryTime: '2024-01-01T00:00:00Z', // First chronologically
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1000 },
      })

      const snapshots = PortfolioService.getHistoricalSnapshots()

      expect(snapshots[0].date).toBe('2024-01-01T00:00:00Z')
      expect(snapshots[1].date).toBe('2024-01-15T00:00:00Z')
    })
  })

  describe('Linkage Integrity', () => {
    // Helper to create a journal entry with the new schema
    const createJournalEntry = () => {
      return JournalService.create({
        actionType: 'buy',
        ticker: 'AAPL',
        quantity: 10,
        price: 150,
        entryTime: new Date().toISOString(),
        positionMode: 'new',
        payment: { asset: 'USD', amount: 1500 },
      })
    }

    it('position update should preserve journal relations', () => {
      // Create journal entry which now also creates a position
      const result = createJournalEntry()

      const relationsBefore = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relationsBefore).toHaveLength(1)

      PortfolioService.update(result.position.id, {
        quantity: 15,
      })

      const relationsAfter = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relationsAfter).toHaveLength(1)
      expect(relationsAfter[0].toRef.id).toBe(result.position.id)
    })

    it('position archive should preserve journal relations', () => {
      const result = createJournalEntry()

      const relationsBefore = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relationsBefore).toHaveLength(1)

      PortfolioService.archive(result.position.id)

      const relationsAfter = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relationsAfter).toHaveLength(1)
      expect(relationsAfter[0].toRef.id).toBe(result.position.id)
    })

    it('position archive should preserve relations from journal side', () => {
      const result = createJournalEntry()

      PortfolioService.archive(result.position.id)

      const relationsFromPosition = RelationService.listForEntity({ type: 'position', id: result.position.id })
      expect(relationsFromPosition).toHaveLength(1)
      expect(relationsFromPosition[0].fromRef.id).toBe(result.journalEntry.id)
    })

    it('position update with closedAt should preserve relations', () => {
      const result = createJournalEntry()

      PortfolioService.update(result.position.id, {
        closedAt: '2024-06-15T00:00:00.000Z',
      })

      const relations = RelationService.listForEntity({ type: 'journal', id: result.journalEntry.id })
      expect(relations).toHaveLength(1)

      const updatedPosition = PortfolioService.get(result.position.id)
      expect(updatedPosition?.closedAt).toBe('2024-06-15T00:00:00.000Z')
    })
  })
})
