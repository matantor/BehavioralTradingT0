import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import ContextSelector from '../components/ContextSelector'
import { ThoughtService, RelationService, getThoughtKind } from '@/domain/services'
import type { Thought, ContextAnchor } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

type FilterKind = 'all' | 'thought' | 'mini_thesis'

export default function Thoughts() {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [content, setContent] = useState('')
  const [filter, setFilter] = useState<FilterKind>('all')
  const [showContext, setShowContext] = useState(false)
  const [contextAnchors, setContextAnchors] = useState<ContextAnchor[]>([])

  const loadThoughts = useCallback(() => {
    const data = ThoughtService.list()
    // Sort by createdAt desc (newest first)
    const sorted = [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setThoughts(sorted)
  }, [])

  useEffect(() => {
    loadThoughts()
  }, [loadThoughts])

  const handleContextChange = useCallback((anchors: ContextAnchor[]) => {
    setContextAnchors(anchors)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    // Build meta with context anchors
    const meta: Record<string, unknown> = {}
    if (contextAnchors.length > 0) {
      meta.contextAnchors = contextAnchors
    }

    // Create thought
    const thought = ThoughtService.create({
      content: content.trim(),
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    })

    // Derive relations from context anchors
    if (contextAnchors.length > 0) {
      RelationService.deriveFromAnchors(
        { type: 'thought', id: thought.id },
        contextAnchors,
        'context'
      )
    }

    // Reset form
    setContent('')
    setShowContext(false)
    setContextAnchors([])
    loadThoughts()
  }

  // Filter thoughts based on selected filter
  const filteredThoughts = thoughts.filter((thought) => {
    if (filter === 'all') return true
    return getThoughtKind(thought) === filter
  })

  // Count for each type
  const thoughtCount = thoughts.filter((t) => getThoughtKind(t) === 'thought').length
  const miniThesisCount = thoughts.filter((t) => getThoughtKind(t) === 'mini_thesis').length

  const header = <PageHeader title="Thoughts & Theses" />

  // Preview first 100 chars of content
  const preview = (text: string) => {
    if (text.length <= 100) return text
    return text.substring(0, 100) + '...'
  }

  return (
    <>
      {header}

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Capture a Thought
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              placeholder="What's on your mind? Capture ideas, observations, or investment hypotheses..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-base bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
            />
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
                className="rounded"
              />
              Add context (positions, thesis)
            </label>
          </div>

          {showContext && (
            <ContextSelector
              showNorthStar={true}
              showPositions={true}
              showThoughts={false}
              northStarRequired={false}
              onChange={handleContextChange}
            />
          )}

          <button
            type="submit"
            className={cn(
              "px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded text-base cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200",
              showContext && "mt-2"
            )}
          >
            Add Thought
          </button>
        </form>
      </Card>

      <Card className="p-5 md:p-6">
        {/* Filter chips */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] cursor-pointer",
              filter === 'all'
                ? "bg-violet-500 text-white font-medium"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            )}
          >
            All ({thoughts.length})
          </button>
          <button
            onClick={() => setFilter('thought')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] cursor-pointer",
              filter === 'thought'
                ? "bg-violet-500 text-white font-medium"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            )}
          >
            Thoughts ({thoughtCount})
          </button>
          <button
            onClick={() => setFilter('mini_thesis')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] cursor-pointer",
              filter === 'mini_thesis'
                ? "bg-violet-500 text-white font-medium"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            )}
          >
            Mini-theses ({miniThesisCount})
          </button>
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {filter === 'all' && `All (${filteredThoughts.length})`}
          {filter === 'thought' && `Thoughts (${filteredThoughts.length})`}
          {filter === 'mini_thesis' && `Mini-theses (${filteredThoughts.length})`}
        </h2>

        {filteredThoughts.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            {filter === 'all' && 'No thoughts yet. Capture your first thought above.'}
            {filter === 'thought' && 'No regular thoughts. All thoughts have been promoted to mini-theses.'}
            {filter === 'mini_thesis' && 'No mini-theses yet. Promote a thought to create one.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredThoughts.map((thought) => {
              const kind = getThoughtKind(thought)
              const isMiniThesis = kind === 'mini_thesis'

              return (
                <Link
                  key={thought.id}
                  to={`/thoughts/${thought.id}`}
                  className="block no-underline"
                >
                  <div
                    className={cn(
                      "p-3 rounded border-l-[3px]",
                      isMiniThesis
                        ? "bg-purple-50 dark:bg-purple-900/20 border-l-purple-400"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-l-violet-500",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-[15px] text-zinc-700 dark:text-zinc-300 flex-1">
                        {preview(thought.content)}
                      </p>
                      {isMiniThesis && (
                        <span className="px-2 py-0.5 bg-purple-400 dark:bg-purple-600 text-white rounded text-[11px] font-semibold whitespace-nowrap">
                          THESIS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(thought.createdAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
