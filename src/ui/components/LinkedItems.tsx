// LinkedItems: Read-only display of linked entities derived from RelationEdges
// Per PTD.md Section 10: relations are derived, purely reflective, not constructive

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RelationService, PortfolioService, JournalService, ThoughtService, NorthStarService, getThoughtKind } from '@/domain/services'
import type { EntityRef, RelationEdge } from '@/domain/types/entities'
import Card from './Card'

interface LinkedItemsProps {
  entityRef: EntityRef
}

interface LinkedItem {
  ref: EntityRef
  relationType: RelationEdge['relationType']
  label: string
  preview: string
  link: string
  direction: 'from' | 'to' // whether this entity is the source or target
}

export default function LinkedItems({ entityRef }: LinkedItemsProps) {
  const [items, setItems] = useState<LinkedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const relations = RelationService.listForEntity(entityRef)
    const linkedItems: LinkedItem[] = []

    for (const rel of relations) {
      // Determine which end of the relation is the "other" entity
      const isFrom = rel.fromRef.type === entityRef.type && rel.fromRef.id === entityRef.id
      const otherRef = isFrom ? rel.toRef : rel.fromRef

      // Fetch entity details based on type
      const item = resolveEntity(otherRef, rel.relationType, isFrom ? 'to' : 'from')
      if (item) {
        linkedItems.push(item)
      }
    }

    setItems(linkedItems)
    setLoading(false)
  }, [entityRef])

  if (loading) {
    return (
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Linked Items
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading...</p>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Linked Items
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          No linked items. Add context when creating entries to see connections here.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
        Linked Items ({items.length})
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <Link
            key={`${item.ref.type}-${item.ref.id}-${idx}`}
            to={item.link}
            style={{
              display: 'block',
              padding: '0.625rem 0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              borderLeft: `3px solid ${getTypeColor(item.ref.type)}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{
                fontSize: '0.75rem',
                color: getTypeColor(item.ref.type),
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '0.6875rem',
                color: '#9ca3af',
                backgroundColor: '#e5e7eb',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
              }}>
                {item.relationType}
              </span>
            </div>
            <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>
              {item.preview}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function resolveEntity(
  ref: EntityRef,
  relationType: RelationEdge['relationType'],
  direction: 'from' | 'to'
): LinkedItem | null {
  switch (ref.type) {
    case 'position': {
      const pos = PortfolioService.get(ref.id)
      if (!pos) return null
      return {
        ref,
        relationType,
        direction,
        label: 'Position',
        preview: `${pos.ticker} - ${pos.quantity} shares @ $${pos.avgCost.toFixed(2)}`,
        link: `/positions/${ref.id}`,
      }
    }
    case 'journal': {
      const entry = JournalService.get(ref.id)
      if (!entry) return null
      return {
        ref,
        relationType,
        direction,
        label: `Journal (${entry.type})`,
        preview: entry.title,
        link: `/journal/${ref.id}`,
      }
    }
    case 'thought': {
      const thought = ThoughtService.get(ref.id)
      if (!thought) return null
      const kind = getThoughtKind(thought)
      const preview = thought.content.length > 60
        ? thought.content.substring(0, 60) + '...'
        : thought.content
      return {
        ref,
        relationType,
        direction,
        label: kind === 'mini_thesis' ? 'Mini-thesis' : 'Thought',
        preview,
        link: `/thoughts/${ref.id}`,
      }
    }
    case 'thesis': {
      const versions = NorthStarService.listVersions()
      const version = versions.find(v => v.id === ref.id)
      if (!version) return null
      const preview = version.content.length > 60
        ? version.content.substring(0, 60) + '...'
        : version.content
      return {
        ref,
        relationType,
        direction,
        label: 'Thesis',
        preview,
        link: `/northstar/versions/${ref.id}`,
      }
    }
    default:
      return null
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'position': return '#10b981' // green
    case 'journal': return '#3b82f6' // blue
    case 'thought': return '#8b5cf6' // purple
    case 'thesis': return '#f59e0b' // amber
    default: return '#6b7280' // gray
  }
}
