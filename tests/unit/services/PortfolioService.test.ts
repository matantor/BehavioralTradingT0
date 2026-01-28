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

  describe('Linkage Integrity', () => {
    it('position update should preserve journal relations', () => {
      const journal = JournalService.create({
        type: 'decision',
        title: 'Buy AAPL',
        content: 'Adding AAPL to portfolio',
      })

      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      RelationService.create(
        { type: 'journal', id: journal.id },
        { type: 'position', id: position.id },
        'related'
      )

      const relationsBefore = RelationService.listForEntity({ type: 'journal', id: journal.id })
      expect(relationsBefore).toHaveLength(1)

      PortfolioService.update(position.id, {
        ticker: 'MSFT',
        quantity: 15,
      })

      const relationsAfter = RelationService.listForEntity({ type: 'journal', id: journal.id })
      expect(relationsAfter).toHaveLength(1)
      expect(relationsAfter[0].toRef.id).toBe(position.id)
    })

    it('position archive should preserve journal relations', () => {
      const journal = JournalService.create({
        type: 'decision',
        title: 'Buy AAPL',
        content: 'Adding AAPL to portfolio',
      })

      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      RelationService.create(
        { type: 'journal', id: journal.id },
        { type: 'position', id: position.id },
        'related'
      )

      const relationsBefore = RelationService.listForEntity({ type: 'journal', id: journal.id })
      expect(relationsBefore).toHaveLength(1)

      PortfolioService.archive(position.id)

      const relationsAfter = RelationService.listForEntity({ type: 'journal', id: journal.id })
      expect(relationsAfter).toHaveLength(1)
      expect(relationsAfter[0].toRef.id).toBe(position.id)
    })

    it('position archive should preserve relations from journal side', () => {
      const journal = JournalService.create({
        type: 'decision',
        title: 'Buy AAPL',
        content: 'Adding AAPL to portfolio',
      })

      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      RelationService.create(
        { type: 'journal', id: journal.id },
        { type: 'position', id: position.id },
        'related'
      )

      PortfolioService.archive(position.id)

      const relationsFromPosition = RelationService.listForEntity({ type: 'position', id: position.id })
      expect(relationsFromPosition).toHaveLength(1)
      expect(relationsFromPosition[0].fromRef.id).toBe(journal.id)
    })

    it('position update with closedAt should preserve relations', () => {
      const journal = JournalService.create({
        type: 'decision',
        title: 'Buy AAPL',
        content: 'Adding AAPL to portfolio',
      })

      const position = PortfolioService.create({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
      })

      RelationService.create(
        { type: 'journal', id: journal.id },
        { type: 'position', id: position.id },
        'related'
      )

      PortfolioService.update(position.id, {
        closedAt: '2024-06-15T00:00:00.000Z',
      })

      const relations = RelationService.listForEntity({ type: 'journal', id: journal.id })
      expect(relations).toHaveLength(1)

      const updatedPosition = PortfolioService.get(position.id)
      expect(updatedPosition?.closedAt).toBe('2024-06-15T00:00:00.000Z')
    })
  })
})
