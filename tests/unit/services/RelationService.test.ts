// Tests for RelationService
// Covers: listForEntity, findExisting, create, deriveFromAnchors

import { describe, it, expect, beforeEach } from 'vitest'
import { RelationService } from '@/domain/services/RelationService'
import { RelationRepository } from '@/domain/repositories/RelationRepository'
import { EventRepository } from '@/domain/repositories/EventRepository'
import { resetData } from '@/lib/storage/storage'
import type { EntityRef, ContextAnchor } from '@/domain/types/entities'

describe('RelationService', () => {
  beforeEach(() => {
    resetData()
  })

  describe('listForEntity', () => {
    it('returns empty array when no relations exist', () => {
      const ref: EntityRef = { type: 'journal', id: 'j1' }
      const result = RelationService.listForEntity(ref)
      expect(result).toEqual([])
    })

    it('returns relations for entity as source', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      RelationService.create(from, to, 'context')

      const result = RelationService.listForEntity(from)
      expect(result).toHaveLength(1)
      expect(result[0].fromRef).toEqual(from)
    })

    it('returns relations for entity as target', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      RelationService.create(from, to, 'context')

      const result = RelationService.listForEntity(to)
      expect(result).toHaveLength(1)
      expect(result[0].toRef).toEqual(to)
    })
  })

  describe('findExisting', () => {
    it('returns null when no matching relation exists', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      const result = RelationService.findExisting(from, to, 'context')
      expect(result).toBeNull()
    })

    it('returns existing relation when match found', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      const created = RelationService.create(from, to, 'context')

      const result = RelationService.findExisting(from, to, 'context')
      expect(result).not.toBeNull()
      expect(result!.id).toBe(created.id)
    })

    it('returns null for different relation type', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      RelationService.create(from, to, 'context')

      const result = RelationService.findExisting(from, to, 'supports')
      expect(result).toBeNull()
    })

    it('returns null for archived relations', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      const created = RelationService.create(from, to, 'context')
      RelationRepository.archive(created.id)

      const result = RelationService.findExisting(from, to, 'context')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates relation with meta', () => {
      const from: EntityRef = { type: 'journal', id: 'j1' }
      const to: EntityRef = { type: 'position', id: 'p1' }
      const meta = { custom: 'data' }

      const result = RelationService.create(from, to, 'context', meta)
      expect(result.meta).toEqual(meta)
    })
  })

  describe('deriveFromAnchors', () => {
    const sourceRef: EntityRef = { type: 'journal', id: 'j1' }

    it('creates relations for each anchor', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
        { entityType: 'thought', entityId: 't1' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result.created).toHaveLength(2)
      expect(result.skipped).toBe(0)
    })

    it('uses default relationType of context', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result.created[0].relationType).toBe('context')
    })

    it('uses custom relationType when provided', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors, 'supports')
      expect(result.created[0].relationType).toBe('supports')
    })

    it('stores derivedFrom marker in meta', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result.created[0].meta?.derivedFrom).toBe('contextAnchor')
    })

    it('stores anchor role in meta when provided', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1', role: 'subject' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result.created[0].meta?.anchorRole).toBe('subject')
    })

    it('is idempotent - skips existing relations', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      // First call creates the relation
      const result1 = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result1.created).toHaveLength(1)
      expect(result1.skipped).toBe(0)

      // Second call skips (already exists)
      const result2 = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result2.created).toHaveLength(0)
      expect(result2.skipped).toBe(1)
    })

    it('emits relation.derived event for each created relation', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
        { entityType: 'thought', entityId: 't1' },
      ]

      RelationService.deriveFromAnchors(sourceRef, anchors)

      const events = EventRepository.listByType('relation.derived', false)
      expect(events).toHaveLength(2)
    })

    it('event includes relationId and relationType in payload', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1', role: 'subject' },
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      const events = EventRepository.listByType('relation.derived', false)

      expect(events[0].payload?.relationId).toBe(result.created[0].id)
      expect(events[0].payload?.relationType).toBe('context')
      expect(events[0].payload?.anchorRole).toBe('subject')
    })

    it('event refs include source and target entities', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      RelationService.deriveFromAnchors(sourceRef, anchors)
      const events = EventRepository.listByType('relation.derived', false)

      expect(events[0].refs).toHaveLength(2)
      expect(events[0].refs[0]).toEqual(sourceRef)
      expect(events[0].refs[1]).toEqual({ type: 'position', id: 'p1' })
    })

    it('does not emit events for skipped relations', () => {
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' },
      ]

      // First call creates and emits
      RelationService.deriveFromAnchors(sourceRef, anchors)
      const events1 = EventRepository.listByType('relation.derived', false)
      expect(events1).toHaveLength(1)

      // Second call skips - no new events
      RelationService.deriveFromAnchors(sourceRef, anchors)
      const events2 = EventRepository.listByType('relation.derived', false)
      expect(events2).toHaveLength(1) // still 1, not 2
    })

    it('handles empty anchors array', () => {
      const result = RelationService.deriveFromAnchors(sourceRef, [])
      expect(result.created).toHaveLength(0)
      expect(result.skipped).toBe(0)
    })

    it('handles mixed new and existing anchors', () => {
      // Create one relation manually
      RelationService.create(
        sourceRef,
        { type: 'position', id: 'p1' },
        'context'
      )

      // Derive with mix of existing and new
      const anchors: ContextAnchor[] = [
        { entityType: 'position', entityId: 'p1' }, // exists
        { entityType: 'thought', entityId: 't1' },  // new
      ]

      const result = RelationService.deriveFromAnchors(sourceRef, anchors)
      expect(result.created).toHaveLength(1)
      expect(result.skipped).toBe(1)
      expect(result.created[0].toRef.type).toBe('thought')
    })
  })
})
