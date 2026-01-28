// RelationRepository: relationship graph management
// Per PTD.md: all cross-entity connections use RelationEdge

import type { RelationEdge, EntityRef } from '@/domain/types/entities'
import { generateUUID, generateTimestamp } from '@/domain/types/entities'
import { loadData, saveData } from '@/lib/storage/storage'

class RelationRepositoryClass {
  listForEntity(
    entityRef: EntityRef,
    includeArchived = false
  ): RelationEdge[] {
    const data = loadData()
    let relations = Object.values(data.relationEdges).filter(
      (rel) =>
        (rel.fromRef.type === entityRef.type &&
          rel.fromRef.id === entityRef.id) ||
        (rel.toRef.type === entityRef.type && rel.toRef.id === entityRef.id)
    )

    if (!includeArchived) {
      relations = relations.filter((rel) => !rel.archivedAt)
    }

    return relations
  }

  // Find existing edge between two entities (for idempotency check)
  // Returns the first non-archived edge matching fromRef, toRef, and relationType
  findExisting(
    fromRef: EntityRef,
    toRef: EntityRef,
    relationType: RelationEdge['relationType']
  ): RelationEdge | null {
    const data = loadData()
    const match = Object.values(data.relationEdges).find(
      (rel) =>
        !rel.archivedAt &&
        rel.fromRef.type === fromRef.type &&
        rel.fromRef.id === fromRef.id &&
        rel.toRef.type === toRef.type &&
        rel.toRef.id === toRef.id &&
        rel.relationType === relationType
    )
    return match || null
  }

  create(
    fromRef: EntityRef,
    toRef: EntityRef,
    relationType: RelationEdge['relationType'],
    meta?: Record<string, unknown>
  ): RelationEdge {
    // Validate required fields
    if (!fromRef.type || !fromRef.id) {
      throw new Error('RelationEdge fromRef must have type and id')
    }
    if (!toRef.type || !toRef.id) {
      throw new Error('RelationEdge toRef must have type and id')
    }
    if (
      !['related', 'supports', 'contradicts', 'context'].includes(relationType)
    ) {
      throw new Error('RelationEdge relationType must be valid')
    }

    const now = generateTimestamp()
    const relation: RelationEdge = {
      id: generateUUID(),
      fromRef,
      toRef,
      relationType,
      createdAt: now,
      updatedAt: now,
      meta,
    }

    const data = loadData()
    data.relationEdges[relation.id] = relation
    saveData(data)

    return relation
  }

  archive(id: string): void {
    const data = loadData()
    const existing = data.relationEdges[id]
    if (!existing) {
      throw new Error(`RelationEdge ${id} not found`)
    }

    const now = generateTimestamp()
    existing.archivedAt = now
    existing.updatedAt = now
    data.relationEdges[id] = existing
    saveData(data)
  }
}

// Export singleton instance
export const RelationRepository = new RelationRepositoryClass()
