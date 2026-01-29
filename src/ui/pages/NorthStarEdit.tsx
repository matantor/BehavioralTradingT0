import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import ContextSelector from '../components/ContextSelector'
import { NorthStarService, RelationService } from '@/domain/services'
import type { ContextAnchor } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

export default function NorthStarEdit() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [isNew, setIsNew] = useState(true)
  const [showContext, setShowContext] = useState(false)
  const [contextAnchors, setContextAnchors] = useState<ContextAnchor[]>([])

  useEffect(() => {
    const current = NorthStarService.getCurrent()
    if (current) {
      setContent(current.content)
      setIsNew(false)
    }
  }, [])

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

    // Create thesis version with meta
    const version = NorthStarService.createVersion(
      content.trim(),
      changeNote.trim() || undefined,
      Object.keys(meta).length > 0 ? meta : undefined
    )

    // Derive relations from context anchors
    if (contextAnchors.length > 0) {
      RelationService.deriveFromAnchors(
        { type: 'thesis', id: version.id },
        contextAnchors,
        'supports'
      )
    }

    navigate('/northstar')
  }

  const header = <PageHeader title={isNew ? 'Create Thesis' : 'Edit Thesis'} />

  return (
    <>
      {header}

      <form onSubmit={handleSubmit}>
        <Card className="p-5 md:p-6 mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Your Investment Thesis
          </h2>
          <textarea
            placeholder="Define your guiding investment philosophy..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-base leading-relaxed bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
          />
        </Card>

        {!isNew && (
          <Card className="p-5 md:p-6 mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Change Note
            </h2>
            <input
              type="text"
              placeholder="Why are you updating your thesis? (optional)"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-base bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-xs">
              This helps you track why your thesis evolved over time.
            </p>
          </Card>
        )}

        <Card className="p-5 md:p-6 mb-4">
          <div className="mb-2">
            <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
                className="rounded"
              />
              Link supporting context (positions, thoughts)
            </label>
          </div>

          {showContext && (
            <ContextSelector
              showNorthStar={false}
              showPositions={true}
              showThoughts={true}
              northStarRequired={false}
              onChange={handleContextChange}
            />
          )}
        </Card>

        <Card className="p-5 md:p-6">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!content.trim()}
              className={cn(
                "flex-1 py-3 rounded-md text-base font-medium text-white",
                content.trim()
                  ? "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
              )}
            >
              {isNew ? 'Create Thesis' : 'Save Changes'}
            </button>
            <Link
              to="/northstar"
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-base font-medium no-underline text-center hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              Cancel
            </Link>
          </div>
        </Card>
      </form>
    </>
  )
}
