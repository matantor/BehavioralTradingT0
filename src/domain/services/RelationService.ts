// RelationService: domain service for RelationEdge operations
// Services call repositories only, no direct storage access

import type { RelationEdge, EntityRef, ContextAnchor } from '@/domain/types/entities'
import { RelationRepository } from '@/domain/repositories/RelationRepository'
import { EventRepository } from '@/domain/repositories/EventRepository'

// Result of deriving relations from context anchors
export interface DeriveResult {
  created: RelationEdge[]
  skipped: number // count of anchors that already had relations
}

class RelationServiceClass {
  listForEntity(entityRef: EntityRef): RelationEdge[] {
    return RelationRepository.listForEntity(entityRef, false) // excludes archived by default
  }

  findExisting(
    fromRef: EntityRef,
    toRef: EntityRef,
    relationType: RelationEdge['relationType']
  ): RelationEdge | null {
    return RelationRepository.findExisting(fromRef, toRef, relationType)
  }

  create(
    fromRef: EntityRef,
    toRef: EntityRef,
    relationType: RelationEdge['relationType'],
    meta?: Record<string, unknown>
  ): RelationEdge {
    return RelationRepository.create(fromRef, toRef, relationType, meta)
  }

  /**
   * Derive RelationEdges from context anchors declared on an entity.
   * Per PTD.md Section 10: relations are derived, not manually constructed.
   *
   * - Idempotent: skips anchors that already have a relation
   * - Emits 'relation.derived' event for each created edge
   * - Returns created edges and count of skipped (already existing)
   */
  deriveFromAnchors(
    sourceRef: EntityRef,
    anchors: ContextAnchor[],
    relationType: RelationEdge['relationType'] = 'context'
  ): DeriveResult {
    const created: RelationEdge[] = []
    let skipped = 0

    for (const anchor of anchors) {
      const toRef: EntityRef = {
        type: anchor.entityType,
        id: anchor.entityId,
      }

      // Idempotency check: skip if relation already exists
      const existing = RelationRepository.findExisting(sourceRef, toRef, relationType)
      if (existing) {
        skipped++
        continue
      }

      // Create relation edge with anchor role stored in meta
      const meta: Record<string, unknown> = {
        derivedFrom: 'contextAnchor',
      }
      if (anchor.role) {
        meta.anchorRole = anchor.role
      }

      const edge = RelationRepository.create(sourceRef, toRef, relationType, meta)
      created.push(edge)

      // Emit event for derived relation
      EventRepository.create(
        'relation.derived',
        [sourceRef, toRef],
        {
          relationId: edge.id,
          relationType,
          anchorRole: anchor.role,
        }
      )
    }

    return { created, skipped }
  }
}

export const RelationService = new RelationServiceClass()
