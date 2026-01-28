import { describe, it, expect, beforeEach } from 'vitest'
import { JournalService, PortfolioService, RelationService, EventService } from '@/domain/services'
import { resetData } from '@/lib/storage/storage'

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
      JournalService.create({ title: 'First', content: 'Content 1', type: 'note' })
      JournalService.create({ title: 'Second', content: 'Content 2', type: 'decision' })
      JournalService.create({ title: 'Third', content: 'Content 3', type: 'reflection' })

      const entries = JournalService.list()
      expect(entries).toHaveLength(3)

      const titles = entries.map(e => e.title)
      expect(titles).toContain('First')
      expect(titles).toContain('Second')
      expect(titles).toContain('Third')
    })

    it('filters by type when filter provided', () => {
      JournalService.create({ title: 'Note 1', content: 'Content', type: 'note' })
      JournalService.create({ title: 'Decision 1', content: 'Content', type: 'decision' })
      JournalService.create({ title: 'Note 2', content: 'Content', type: 'note' })

      const notes = JournalService.list({ type: 'note' })
      expect(notes).toHaveLength(2)
      expect(notes.every(e => e.type === 'note')).toBe(true)

      const decisions = JournalService.list({ type: 'decision' })
      expect(decisions).toHaveLength(1)
      expect(decisions[0].type).toBe('decision')
    })
  })

  describe('get', () => {
    it('returns null for non-existent id', () => {
      const entry = JournalService.get('non-existent-id')
      expect(entry).toBeNull()
    })

    it('returns entry by id', () => {
      const created = JournalService.create({
        title: 'Test Entry',
        content: 'Test content',
        type: 'note',
      })

      const retrieved = JournalService.get(created.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.title).toBe('Test Entry')
    })
  })

  describe('create', () => {
    it('creates entry with timestamps', () => {
      const entry = JournalService.create({
        title: 'New Entry',
        content: 'New content',
        type: 'decision',
      })

      expect(entry.id).toBeDefined()
      expect(entry.createdAt).toBeDefined()
      expect(entry.updatedAt).toBeDefined()
      expect(entry.title).toBe('New Entry')
      expect(entry.content).toBe('New content')
      expect(entry.type).toBe('decision')
    })

    it('validates required title', () => {
      expect(() => {
        JournalService.create({
          title: '',
          content: 'Content',
          type: 'note',
        })
      }).toThrow('JournalEntry title is required')
    })

    it('validates required content', () => {
      expect(() => {
        JournalService.create({
          title: 'Title',
          content: '',
          type: 'note',
        })
      }).toThrow('JournalEntry content is required')
    })

    it('validates type enum', () => {
      expect(() => {
        JournalService.create({
          title: 'Title',
          content: 'Content',
          type: 'invalid' as 'note',
        })
      }).toThrow('JournalEntry type must be decision, reflection, or note')
    })

    it('persists entry to storage', () => {
      const created = JournalService.create({
        title: 'Persisted',
        content: 'Content',
        type: 'note',
      })

      const retrieved = JournalService.get(created.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.title).toBe('Persisted')
    })
  })

  describe('update', () => {
    it('updates entry fields', () => {
      const entry = JournalService.create({
        title: 'Original',
        content: 'Original content',
        type: 'note',
      })

      const updated = JournalService.update(entry.id, {
        title: 'Updated',
        content: 'Updated content',
      })

      expect(updated.title).toBe('Updated')
      expect(updated.content).toBe('Updated content')
      // updatedAt should be set (may be same or newer depending on timing)
      expect(updated.updatedAt).toBeDefined()
    })

    it('preserves createdAt on update', () => {
      const entry = JournalService.create({
        title: 'Test',
        content: 'Content',
        type: 'note',
      })
      const originalCreatedAt = entry.createdAt

      const updated = JournalService.update(entry.id, { title: 'New Title' })
      expect(updated.createdAt).toBe(originalCreatedAt)
    })
  })

  describe('archive', () => {
    it('sets archivedAt timestamp', () => {
      const entry = JournalService.create({
        title: 'To Archive',
        content: 'Content',
        type: 'note',
      })

      JournalService.archive(entry.id)

      const archived = JournalService.get(entry.id)
      expect(archived?.archivedAt).toBeDefined()
    })

    it('excludes archived entries from list', () => {
      const entry1 = JournalService.create({ title: 'Keep', content: 'Content', type: 'note' })
      const entry2 = JournalService.create({ title: 'Archive', content: 'Content', type: 'note' })

      JournalService.archive(entry2.id)

      const entries = JournalService.list()
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe(entry1.id)
    })
  })

  describe('executePortfolioAction', () => {
    describe('set_position (open new position)', () => {
      it('creates new position from journal entry', () => {
        const entry = JournalService.create({
          title: 'Buy AAPL',
          content: 'Opening new position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'set_position',
          ticker: 'AAPL',
          quantity: 100,
          price: 150.00,
        })

        expect(result.position.ticker).toBe('AAPL')
        expect(result.position.quantity).toBe(100)
        expect(result.position.avgCost).toBe(150)
        expect(result.journalEntry.portfolioAction).toBeDefined()
        expect(result.journalEntry.portfolioAction?.positionId).toBe(result.position.id)
      })

      it('creates relation between journal and position', () => {
        const entry = JournalService.create({
          title: 'Buy TSLA',
          content: 'Opening TSLA position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'set_position',
          ticker: 'TSLA',
          quantity: 50,
          price: 200.00,
        })

        const relations = RelationService.listForEntity({ type: 'journal', id: entry.id })
        expect(relations).toHaveLength(1)
        expect(relations[0].toRef.type).toBe('position')
        expect(relations[0].toRef.id).toBe(result.position.id)
        expect(relations[0].relationType).toBe('related')
      })

      it('emits trade event', () => {
        const entry = JournalService.create({
          title: 'Buy GOOGL',
          content: 'Opening Google position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'set_position',
          ticker: 'GOOGL',
          quantity: 10,
          price: 140.00,
        })

        const events = EventService.listByType('trade.set_position')
        expect(events).toHaveLength(1)
        expect(events[0].id).toBe(result.eventId)
        expect(events[0].payload?.ticker).toBe('GOOGL')
      })

      it('requires ticker for set_position', () => {
        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            quantity: 100,
            price: 100,
          })
        }).toThrow('Ticker is required')
      })
    })

    describe('buy (increase position)', () => {
      it('increases position quantity and adjusts avg cost', () => {
        // Create initial position
        const position = PortfolioService.create({
          ticker: 'AAPL',
          quantity: 100,
          avgCost: 100.00,
          currency: 'USD',
        })

        const entry = JournalService.create({
          title: 'Buy more AAPL',
          content: 'Increasing position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'buy',
          positionId: position.id,
          quantity: 100,
          price: 150.00,
        })

        // New avg cost: (100*100 + 100*150) / 200 = 25000/200 = 125
        expect(result.position.quantity).toBe(200)
        expect(result.position.avgCost).toBe(125)
      })

      it('requires positionId for buy action', () => {
        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'buy',
            quantity: 100,
            price: 100,
          })
        }).toThrow('Position ID is required')
      })

      it('rejects buy into closed position', () => {
        const position = PortfolioService.create({
          ticker: 'CLOSED',
          quantity: 0,
          avgCost: 100.00,
          currency: 'USD',
          closedAt: new Date().toISOString(),
        })

        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'buy',
            positionId: position.id,
            quantity: 100,
            price: 100,
          })
        }).toThrow('Cannot buy into closed position')
      })
    })

    describe('sell (decrease position)', () => {
      it('decreases position quantity', () => {
        const position = PortfolioService.create({
          ticker: 'AAPL',
          quantity: 100,
          avgCost: 100.00,
          currency: 'USD',
        })

        const entry = JournalService.create({
          title: 'Sell AAPL',
          content: 'Partial sale',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'sell',
          positionId: position.id,
          quantity: 30,
          price: 150.00,
        })

        expect(result.position.quantity).toBe(70)
        expect(result.position.avgCost).toBe(100) // avg cost unchanged on sell
      })

      it('rejects sell exceeding held quantity', () => {
        const position = PortfolioService.create({
          ticker: 'AAPL',
          quantity: 50,
          avgCost: 100.00,
          currency: 'USD',
        })

        const entry = JournalService.create({
          title: 'Sell too much',
          content: 'Trying to sell more than held',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'sell',
            positionId: position.id,
            quantity: 100,
            price: 150.00,
          })
        }).toThrow('Cannot sell 100 shares; only 50 held')
      })

      it('closes position when selling all shares', () => {
        const position = PortfolioService.create({
          ticker: 'AAPL',
          quantity: 100,
          avgCost: 100.00,
          currency: 'USD',
        })

        const entry = JournalService.create({
          title: 'Sell all',
          content: 'Liquidating position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'sell',
          positionId: position.id,
          quantity: 100,
          price: 150.00,
        })

        expect(result.position.quantity).toBe(0)
        expect(result.position.closedAt).toBeDefined()
      })
    })

    describe('close_position', () => {
      it('closes position setting quantity to 0', () => {
        const position = PortfolioService.create({
          ticker: 'AAPL',
          quantity: 100,
          avgCost: 100.00,
          currency: 'USD',
        })

        const entry = JournalService.create({
          title: 'Close AAPL',
          content: 'Closing position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'close_position',
          positionId: position.id,
          quantity: 100, // quantity in action is for record, position sets to 0
          price: 150.00,
        })

        expect(result.position.quantity).toBe(0)
        expect(result.position.closedAt).toBeDefined()
      })

      it('rejects closing already closed position', () => {
        const position = PortfolioService.create({
          ticker: 'CLOSED',
          quantity: 0,
          avgCost: 100.00,
          currency: 'USD',
          closedAt: new Date().toISOString(),
        })

        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'close_position',
            positionId: position.id,
            quantity: 1,
            price: 100,
          })
        }).toThrow('Position is already closed')
      })
    })

    describe('validation', () => {
      it('rejects action on non-decision entry', () => {
        const entry = JournalService.create({
          title: 'Note',
          content: 'Just a note',
          type: 'note',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            ticker: 'AAPL',
            quantity: 100,
            price: 100,
          })
        }).toThrow('Portfolio actions can only be added to decision entries')
      })

      it('rejects action on archived entry', () => {
        const entry = JournalService.create({
          title: 'Archived decision',
          content: 'Content',
          type: 'decision',
        })
        JournalService.archive(entry.id)

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            ticker: 'AAPL',
            quantity: 100,
            price: 100,
          })
        }).toThrow('Cannot add portfolio action to archived journal entry')
      })

      it('rejects action on entry that already has one', () => {
        const entry = JournalService.create({
          title: 'Already actioned',
          content: 'Content',
          type: 'decision',
        })

        JournalService.executePortfolioAction(entry.id, {
          actionType: 'set_position',
          ticker: 'AAPL',
          quantity: 100,
          price: 100,
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            ticker: 'GOOGL',
            quantity: 50,
            price: 140,
          })
        }).toThrow('Journal entry already has a portfolio action')
      })

      it('rejects zero quantity', () => {
        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            ticker: 'AAPL',
            quantity: 0,
            price: 100,
          })
        }).toThrow('Quantity must be greater than 0')
      })

      it('rejects negative price', () => {
        const entry = JournalService.create({
          title: 'Test',
          content: 'Content',
          type: 'decision',
        })

        expect(() => {
          JournalService.executePortfolioAction(entry.id, {
            actionType: 'set_position',
            ticker: 'AAPL',
            quantity: 100,
            price: -50,
          })
        }).toThrow('Price cannot be negative')
      })
    })

    describe('bidirectional linking', () => {
      it('journal links show on position detail via relations', () => {
        const entry = JournalService.create({
          title: 'Buy MSFT',
          content: 'Opening position',
          type: 'decision',
        })

        const result = JournalService.executePortfolioAction(entry.id, {
          actionType: 'set_position',
          ticker: 'MSFT',
          quantity: 50,
          price: 380.00,
        })

        // Check relations from position's perspective
        const positionRelations = RelationService.listForEntity({
          type: 'position',
          id: result.position.id,
        })

        expect(positionRelations).toHaveLength(1)
        expect(positionRelations[0].fromRef.type).toBe('journal')
        expect(positionRelations[0].fromRef.id).toBe(entry.id)
      })
    })
  })

  describe('decision entry thesis context', () => {
    it('creates decision entry with thesis context anchor', () => {
      // Simulates a decision entry linked to a thesis
      const entry = JournalService.create({
        title: 'Buy based on thesis',
        content: 'Buying AAPL aligned with my growth thesis',
        type: 'decision',
        meta: {
          contextAnchors: [
            { entityType: 'thesis', entityId: 'thesis-123', role: 'intent' }
          ]
        }
      })

      expect(entry.type).toBe('decision')
      expect(entry.meta?.contextAnchors).toHaveLength(1)
      const anchors = entry.meta?.contextAnchors as Array<{ entityType: string }>
      expect(anchors[0].entityType).toBe('thesis')
    })

    it('creates decision entry with explicit no-thesis flag', () => {
      // Simulates a decision entry explicitly marked as unrelated to thesis
      const entry = JournalService.create({
        title: 'Opportunistic buy',
        content: 'Quick trade not related to main thesis',
        type: 'decision',
        meta: {
          noThesisExplicit: true
        }
      })

      expect(entry.type).toBe('decision')
      expect(entry.meta?.noThesisExplicit).toBe(true)
    })

    it('persists decision entry with explicit no-thesis flag to storage', () => {
      const entry = JournalService.create({
        title: 'No thesis trade',
        content: 'Independent decision',
        type: 'decision',
        meta: {
          noThesisExplicit: true
        }
      })

      // Retrieve from storage to verify persistence
      const retrieved = JournalService.get(entry.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.meta?.noThesisExplicit).toBe(true)
    })

    it('allows decision entry creation when no thesis exists in storage with explicit flag', () => {
      // This test verifies the service layer accepts entries with noThesisExplicit
      // regardless of whether a thesis exists (service doesn't validate thesis existence)
      const entry = JournalService.create({
        title: 'Fresh install decision',
        content: 'Making a decision before defining thesis',
        type: 'decision',
        meta: {
          noThesisExplicit: true
        }
      })

      expect(entry.id).toBeDefined()
      expect(entry.type).toBe('decision')
      expect(entry.meta?.noThesisExplicit).toBe(true)

      // Can be retrieved successfully
      const retrieved = JournalService.get(entry.id)
      expect(retrieved?.title).toBe('Fresh install decision')
    })

    it('allows decision entry without thesis context or explicit flag (service layer)', () => {
      // Note: UI should enforce thesis requirement, but service layer accepts it
      // This documents current behavior - service doesn't validate thesis requirement
      const entry = JournalService.create({
        title: 'No context decision',
        content: 'Decision without any thesis context',
        type: 'decision',
      })

      expect(entry.id).toBeDefined()
      expect(entry.type).toBe('decision')
      // meta is undefined when not provided
      expect(entry.meta).toBeUndefined()
    })

    it('preserves both thesis anchor and other context anchors', () => {
      const entry = JournalService.create({
        title: 'Multi-context decision',
        content: 'Decision with multiple context anchors',
        type: 'decision',
        meta: {
          contextAnchors: [
            { entityType: 'thesis', entityId: 'thesis-1', role: 'intent' },
            { entityType: 'position', entityId: 'pos-1', role: 'subject' },
            { entityType: 'thought', entityId: 'thought-1', role: 'reference' }
          ]
        }
      })

      const anchors = entry.meta?.contextAnchors as Array<{ entityType: string }>
      expect(anchors).toHaveLength(3)
      expect(anchors.map(a => a.entityType)).toContain('thesis')
      expect(anchors.map(a => a.entityType)).toContain('position')
      expect(anchors.map(a => a.entityType)).toContain('thought')
    })
  })
})
