// LinkedItems: Read-only display of linked entities derived from RelationEdges
// Per PTD.md Section 10: relations are derived, purely reflective, not constructive

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RelationService, PortfolioService, JournalService, ThoughtService, NorthStarService, getThoughtKind } from '@/domain/services'
import type { EntityRef, RelationEdge } from '@/domain/types/entities'
import { Card } from '@/components/ui/card'

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
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Linked Items
        </h2>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">Loading...</p>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Linked Items
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No linked items. Add context when creating entries to see connections here.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5 md:p-6 mb-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        Linked Items ({items.length})
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <Link
            key={`${item.ref.type}-${item.ref.id}-${idx}`}
            to={item.link}
            className="block px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-md no-underline border-l-[3px] hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
            style={{ borderLeftColor: getTypeColor(item.ref.type) }}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: getTypeColor(item.ref.type) }}
              >
                {item.label}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                {item.relationType}
              </span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm m-0">
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
      // New journal schema: use actionType + ticker for preview
      const preview = `${entry.actionType.toUpperCase()} ${entry.ticker} - ${entry.quantity} @ $${entry.price.toFixed(2)}`
      return {
        ref,
        relationType,
        direction,
        label: `Trade (${entry.actionType})`,
        preview,
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
