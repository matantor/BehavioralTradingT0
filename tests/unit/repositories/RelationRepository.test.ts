import { describe, it, expect, beforeEach } from 'vitest'
import { RelationRepository } from '@/domain/repositories/RelationRepository'
import { resetData } from '@/lib/storage/storage'
import type { EntityRef } from '@/domain/types/entities'

describe('RelationRepository', () => {
  beforeEach(() => {
    resetData()
  })

  const positionRef: EntityRef = {
    type: 'position',
    id: 'position-1',
  }

  const thoughtRef: EntityRef = {
    type: 'thought',
    id: 'thought-1',
  }

  const journalRef: EntityRef = {
    type: 'journal',
    id: 'journal-1',
  }

  describe('create', () => {
    it('should create a relation between entities', () => {
      const relation = RelationRepository.create(
        positionRef,
        thoughtRef,
        'supports'
      )

      expect(relation.id).toBeDefined()
      expect(relation.fromRef).toEqual(positionRef)
      expect(relation.toRef).toEqual(thoughtRef)
      expect(relation.relationType).toBe('supports')
      expect(relation.createdAt).toBeDefined()
    })

    it('should throw error for invalid fromRef', () => {
      expect(() => {
        RelationRepository.create(
          { type: 'position', id: '' },
          thoughtRef,
          'related'
        )
      }).toThrow('fromRef must have type and id')
    })

    it('should throw error for invalid toRef', () => {
      expect(() => {
        RelationRepository.create(
          positionRef,
          { type: 'thought', id: '' },
          'related'
        )
      }).toThrow('toRef must have type and id')
    })

    it('should throw error for invalid relationType', () => {
      expect(() => {
        RelationRepository.create(
          positionRef,
          thoughtRef,
          'invalid' as 'related'
        )
      }).toThrow('relationType must be valid')
    })

    it('should support all valid relation types', () => {
      const types: Array<'related' | 'supports' | 'contradicts' | 'context'> = [
        'related',
        'supports',
        'contradicts',
        'context',
      ]

      types.forEach((type, index) => {
        const ref = { type: 'thought' as const, id: `thought-${index}` }
        const relation = RelationRepository.create(positionRef, ref, type)
        expect(relation.relationType).toBe(type)
      })
    })
  })

  describe('listForEntity', () => {
    it('should return empty array for entity with no relations', () => {
      const relations = RelationRepository.listForEntity(positionRef)
      expect(relations).toEqual([])
    })

    it('should return relations where entity is source', () => {
      RelationRepository.create(positionRef, thoughtRef, 'supports')

      const relations = RelationRepository.listForEntity(positionRef)
      expect(relations).toHaveLength(1)
      expect(relations[0].fromRef).toEqual(positionRef)
    })

    it('should return relations where entity is target', () => {
      RelationRepository.create(thoughtRef, positionRef, 'related')

      const relations = RelationRepository.listForEntity(positionRef)
      expect(relations).toHaveLength(1)
      expect(relations[0].toRef).toEqual(positionRef)
    })

    it('should return both incoming and outgoing relations', () => {
      RelationRepository.create(positionRef, thoughtRef, 'supports')
      RelationRepository.create(journalRef, positionRef, 'context')

      const relations = RelationRepository.listForEntity(positionRef)
      expect(relations).toHaveLength(2)
    })

    it('should exclude archived relations by default', () => {
      const r1 = RelationRepository.create(
        positionRef,
        thoughtRef,
        'supports'
      )
      RelationRepository.create(positionRef, journalRef, 'related')
      RelationRepository.archive(r1.id)

      const relations = RelationRepository.listForEntity(positionRef)
      expect(relations).toHaveLength(1)
      expect(relations[0].toRef).toEqual(journalRef)
    })

    it('should include archived relations when requested', () => {
      const r1 = RelationRepository.create(
        positionRef,
        thoughtRef,
        'supports'
      )
      RelationRepository.archive(r1.id)

      const relations = RelationRepository.listForEntity(positionRef, true)
      expect(relations).toHaveLength(1)
      expect(relations[0].archivedAt).toBeDefined()
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', () => {
      const relation = RelationRepository.create(
        positionRef,
        thoughtRef,
        'supports'
      )
      RelationRepository.archive(relation.id)

      const relations = RelationRepository.listForEntity(positionRef, true)
      expect(relations[0].archivedAt).toBeDefined()
    })

    it('should throw error for non-existent relation', () => {
      expect(() => {
        RelationRepository.archive('non-existent')
      }).toThrow('not found')
    })
  })

  describe('findExisting', () => {
    it('should return null when no matching relation exists', () => {
      const result = RelationRepository.findExisting(
        positionRef,
        thoughtRef,
        'context'
      )
      expect(result).toBeNull()
    })

    it('should return relation when exact match exists', () => {
      const created = RelationRepository.create(
        positionRef,
        thoughtRef,
        'context'
      )

      const result = RelationRepository.findExisting(
        positionRef,
        thoughtRef,
        'context'
      )
      expect(result).not.toBeNull()
      expect(result!.id).toBe(created.id)
    })

    it('should return null for different relation type', () => {
      RelationRepository.create(positionRef, thoughtRef, 'context')

      const result = RelationRepository.findExisting(
        positionRef,
        thoughtRef,
        'supports'
      )
      expect(result).toBeNull()
    })

    it('should return null for different from entity', () => {
      RelationRepository.create(positionRef, thoughtRef, 'context')

      const result = RelationRepository.findExisting(
        journalRef,
        thoughtRef,
        'context'
      )
      expect(result).toBeNull()
    })

    it('should return null for different to entity', () => {
      RelationRepository.create(positionRef, thoughtRef, 'context')

      const result = RelationRepository.findExisting(
        positionRef,
        journalRef,
        'context'
      )
      expect(result).toBeNull()
    })

    it('should return null for archived relations', () => {
      const created = RelationRepository.create(
        positionRef,
        thoughtRef,
        'context'
      )
      RelationRepository.archive(created.id)

      const result = RelationRepository.findExisting(
        positionRef,
        thoughtRef,
        'context'
      )
      expect(result).toBeNull()
    })
  })

  describe('relationship graph', () => {
    it('should support complex relationship networks', () => {
      // Create a network: position -> thought -> journal
      RelationRepository.create(positionRef, thoughtRef, 'supports')
      RelationRepository.create(thoughtRef, journalRef, 'context')

      const positionRels = RelationRepository.listForEntity(positionRef)
      const thoughtRels = RelationRepository.listForEntity(thoughtRef)

      expect(positionRels).toHaveLength(1)
      expect(thoughtRels).toHaveLength(2) // Both as source and target
    })

    it('should isolate relations by entity', () => {
      RelationRepository.create(positionRef, thoughtRef, 'supports')

      const positionRels = RelationRepository.listForEntity(positionRef)
      const journalRels = RelationRepository.listForEntity(journalRef)

      expect(positionRels).toHaveLength(1)
      expect(journalRels).toHaveLength(0)
    })
  })
})
