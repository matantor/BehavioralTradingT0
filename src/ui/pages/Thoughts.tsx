import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import ContextSelector from '../components/ContextSelector'
import { ThoughtService, RelationService, getThoughtKind } from '@/domain/services'
import type { Thought, ContextAnchor } from '@/domain/types/entities'

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

  const filterButtonStyle = (active: boolean) => ({
    padding: '0.375rem 0.75rem',
    backgroundColor: active ? '#8b5cf6' : '#f3f4f6',
    color: active ? 'white' : '#4b5563',
    border: 'none',
    borderRadius: '1rem',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    fontWeight: active ? '500' : '400',
  })

  return (
    <>
      {header}

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Capture a Thought
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <textarea
              placeholder="What's on your mind? Capture ideas, observations, or investment hypotheses..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
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
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: showContext ? '0.5rem' : '0',
            }}
          >
            Add Thought
          </button>
        </form>
      </Card>

      <Card>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={filterButtonStyle(filter === 'all')}
          >
            All ({thoughts.length})
          </button>
          <button
            onClick={() => setFilter('thought')}
            style={filterButtonStyle(filter === 'thought')}
          >
            Thoughts ({thoughtCount})
          </button>
          <button
            onClick={() => setFilter('mini_thesis')}
            style={filterButtonStyle(filter === 'mini_thesis')}
          >
            Mini-theses ({miniThesisCount})
          </button>
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {filter === 'all' && `All (${filteredThoughts.length})`}
          {filter === 'thought' && `Thoughts (${filteredThoughts.length})`}
          {filter === 'mini_thesis' && `Mini-theses (${filteredThoughts.length})`}
        </h2>

        {filteredThoughts.length === 0 ? (
          <p style={{ color: '#6b7280' }}>
            {filter === 'all' && 'No thoughts yet. Capture your first thought above.'}
            {filter === 'thought' && 'No regular thoughts. All thoughts have been promoted to mini-theses.'}
            {filter === 'mini_thesis' && 'No mini-theses yet. Promote a thought to create one.'}
          </p>
        ) : (
          <div>
            {filteredThoughts.map((thought) => {
              const kind = getThoughtKind(thought)
              const isMiniThesis = kind === 'mini_thesis'

              return (
                <Link
                  key={thought.id}
                  to={`/thoughts/${thought.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: isMiniThesis ? '#faf5ff' : '#f9fafb',
                      borderRadius: '0.25rem',
                      borderLeft: isMiniThesis ? '3px solid #a855f7' : '3px solid #8b5cf6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <p style={{ color: '#374151', fontSize: '0.9375rem', flex: 1, marginRight: '0.5rem' }}>
                        {preview(thought.content)}
                      </p>
                      {isMiniThesis && (
                        <span
                          style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#a855f7',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          THESIS
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
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
