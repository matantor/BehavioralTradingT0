// ContextSelector: Reusable component for selecting context anchors at entry time
// Per PTD.md Section 10: context is declared at entry time, not retroactively attached

import { useState, useEffect } from 'react'
import type { ContextAnchor } from '@/domain/types/entities'
import { PortfolioService, ThoughtService, NorthStarService, getThoughtKind } from '@/domain/services'
import type { Position, Thought, ThesisVersion } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

export interface ContextSelectorProps {
  // Which entity types to show selectors for
  showNorthStar?: boolean
  showPositions?: boolean
  showThoughts?: boolean
  // Whether NorthStar is required (for decision entries)
  northStarRequired?: boolean
  // Callback when anchors change
  onChange: (anchors: ContextAnchor[], noThesisExplicit: boolean) => void
  // Initial values (for editing)
  initialAnchors?: ContextAnchor[]
  initialNoThesis?: boolean
}

export default function ContextSelector({
  showNorthStar = false,
  showPositions = false,
  showThoughts = false,
  northStarRequired = false,
  onChange,
  initialAnchors = [],
  initialNoThesis = false,
}: ContextSelectorProps) {
  // Available options
  const [positions, setPositions] = useState<Position[]>([])
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [currentThesis, setCurrentThesis] = useState<ThesisVersion | null>(null)

  // Selected values
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedThoughts, setSelectedThoughts] = useState<string[]>([])
  const [linkToThesis, setLinkToThesis] = useState(false)
  const [noThesisExplicit, setNoThesisExplicit] = useState(initialNoThesis)

  // Load available options
  useEffect(() => {
    if (showPositions) {
      setPositions(PortfolioService.list(false))
    }
    if (showThoughts) {
      const all = ThoughtService.list()
      // Sort by createdAt desc
      setThoughts([...all].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    }
    if (showNorthStar) {
      const thesis = NorthStarService.getCurrent()
      setCurrentThesis(thesis)
      // When no thesis exists and northStarRequired, auto-set noThesisExplicit
      // This removes friction: user doesn't need to check a box when there's nothing to link to
      if (!thesis && northStarRequired) {
        setNoThesisExplicit(true)
      }
    }
  }, [showPositions, showThoughts, showNorthStar, northStarRequired])

  // Initialize from initial anchors
  useEffect(() => {
    if (initialAnchors.length > 0) {
      const posIds = initialAnchors
        .filter(a => a.entityType === 'position')
        .map(a => a.entityId)
      const thoughtIds = initialAnchors
        .filter(a => a.entityType === 'thought')
        .map(a => a.entityId)
      const hasThesis = initialAnchors.some(a => a.entityType === 'thesis')

      setSelectedPositions(posIds)
      setSelectedThoughts(thoughtIds)
      setLinkToThesis(hasThesis)
    }
  }, [initialAnchors])

  // Build anchors and notify parent when selection changes
  useEffect(() => {
    const anchors: ContextAnchor[] = []

    // Add thesis anchor
    if (linkToThesis && currentThesis) {
      anchors.push({
        entityType: 'thesis',
        entityId: currentThesis.id,
        role: 'intent',
      })
    }

    // Add position anchors
    selectedPositions.forEach(id => {
      anchors.push({
        entityType: 'position',
        entityId: id,
        role: 'subject',
      })
    })

    // Add thought anchors
    selectedThoughts.forEach(id => {
      anchors.push({
        entityType: 'thought',
        entityId: id,
        role: 'reference',
      })
    })

    onChange(anchors, noThesisExplicit)
  }, [linkToThesis, selectedPositions, selectedThoughts, noThesisExplicit, currentThesis, onChange])

  const togglePosition = (id: string) => {
    setSelectedPositions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleThought = (id: string) => {
    setSelectedThoughts(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleThesisChange = (linked: boolean) => {
    setLinkToThesis(linked)
    if (linked) {
      setNoThesisExplicit(false)
    }
  }

  const handleNoThesisChange = (noThesis: boolean) => {
    setNoThesisExplicit(noThesis)
    if (noThesis) {
      setLinkToThesis(false)
    }
  }

  return (
    <div className="mt-3">
      <div className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
        Context (optional)
      </div>

      {/* NorthStar Section - only show if thesis exists (no friction when no thesis) */}
      {showNorthStar && currentThesis && (
        <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
            Investment Thesis
            {northStarRequired && <span className="text-red-500 ml-1">*</span>}
          </span>

          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={linkToThesis}
                onChange={(e) => handleThesisChange(e.target.checked)}
                className="rounded"
              />
              Link to current thesis
            </label>
            {linkToThesis && (
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-[13px] text-blue-800 dark:text-blue-300">
                "{currentThesis.content.substring(0, 80)}{currentThesis.content.length > 80 ? '...' : ''}"
              </div>
            )}
            {/* Show "No related thesis" option when thesis exists but not linked */}
            {northStarRequired && !linkToThesis && (
              <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={noThesisExplicit}
                  onChange={(e) => handleNoThesisChange(e.target.checked)}
                  className="rounded"
                />
                No related thesis (explicit)
              </label>
            )}
          </div>

          {northStarRequired && !linkToThesis && !noThesisExplicit && (
            <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-300">
              Decision entries require linking to thesis or explicitly marking as unrelated.
            </div>
          )}
        </div>
      )}

      {/* Positions Section */}
      {showPositions && positions.length > 0 && (
        <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Related Positions</span>
          <div className="flex flex-wrap gap-1">
            {positions.map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => togglePosition(pos.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[13px] cursor-pointer",
                  selectedPositions.includes(pos.id)
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                )}
              >
                {pos.ticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thoughts Section */}
      {showThoughts && thoughts.length > 0 && (
        <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Related Thoughts</span>
          <div className="max-h-[120px] overflow-y-auto">
            {thoughts.slice(0, 10).map(thought => {
              const kind = getThoughtKind(thought)
              const preview = thought.content.substring(0, 40) + (thought.content.length > 40 ? '...' : '')
              return (
                <button
                  key={thought.id}
                  type="button"
                  onClick={() => toggleThought(thought.id)}
                  className={cn(
                    "block w-full text-left px-2.5 py-1 rounded-full text-[13px] cursor-pointer mb-1",
                    selectedThoughts.includes(thought.id)
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  )}
                >
                  {kind === 'mini_thesis' && (
                    <span className="text-[10px] bg-purple-500 text-white px-1 py-0.5 rounded-sm mr-1.5">
                      THESIS
                    </span>
                  )}
                  {preview}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
