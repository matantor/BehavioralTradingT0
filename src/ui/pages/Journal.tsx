import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import ContextSelector from '../components/ContextSelector'
import { JournalService, RelationService } from '@/domain/services'
import type { JournalEntry, ContextAnchor } from '@/domain/types/entities'

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<JournalEntry['type']>('note')
  const [showContext, setShowContext] = useState(false)
  const [contextAnchors, setContextAnchors] = useState<ContextAnchor[]>([])
  const [noThesisExplicit, setNoThesisExplicit] = useState(false)

  const loadEntries = () => {
    const data = JournalService.list()
    setEntries(data)
  }

  useEffect(() => {
    loadEntries()
  }, [])

  // Show context section when type is 'decision'
  useEffect(() => {
    if (type === 'decision') {
      setShowContext(true)
    }
  }, [type])

  const handleContextChange = useCallback((anchors: ContextAnchor[], noThesis: boolean) => {
    setContextAnchors(anchors)
    setNoThesisExplicit(noThesis)
  }, [])

  // Validate decision entries have intent context
  const isValidDecision = () => {
    if (type !== 'decision') return true
    // Must either link to thesis or explicitly mark as no thesis
    const hasThesisAnchor = contextAnchors.some(a => a.entityType === 'thesis')
    return hasThesisAnchor || noThesisExplicit
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    if (!isValidDecision()) return

    // Build meta with context anchors
    const meta: Record<string, unknown> = {}
    if (contextAnchors.length > 0) {
      meta.contextAnchors = contextAnchors
    }
    if (noThesisExplicit) {
      meta.noThesisExplicit = true
    }

    // Create journal entry
    const entry = JournalService.create({
      title: title.trim(),
      content: content.trim(),
      type,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    })

    // Derive relations from context anchors
    if (contextAnchors.length > 0) {
      RelationService.deriveFromAnchors(
        { type: 'journal', id: entry.id },
        contextAnchors,
        'context'
      )
    }

    // Reset form
    setTitle('')
    setContent('')
    setType('note')
    setShowContext(false)
    setContextAnchors([])
    setNoThesisExplicit(false)
    loadEntries()
  }

  const header = <PageHeader title="Journal" />

  return (
    <>
      {header}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Add Entry
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as JournalEntry['type'])}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
              }}
            >
              <option value="note">Note</option>
              <option value="decision">Decision</option>
              <option value="reflection">Reflection</option>
            </select>
            {type !== 'decision' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showContext}
                  onChange={(e) => setShowContext(e.target.checked)}
                />
                Add context
              </label>
            )}
          </div>

          {showContext && (
            <ContextSelector
              showNorthStar={true}
              showPositions={true}
              showThoughts={true}
              northStarRequired={type === 'decision'}
              onChange={handleContextChange}
            />
          )}

          <button
            type="submit"
            disabled={!isValidDecision()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isValidDecision() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '1rem',
              cursor: isValidDecision() ? 'pointer' : 'not-allowed',
              marginTop: '0.5rem',
            }}
          >
            Add Entry
          </button>
        </form>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Journal Entries ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No entries yet. Add your first entry above.</p>
        ) : (
          <div>
            {entries.map((entry) => (
              <Link
                key={entry.id}
                to={`/journal/${entry.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.25rem',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{entry.title}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '0.25rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {entry.type}
                    </span>
                  </div>
                  <p style={{ marginTop: '0.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                    {entry.content.length > 100 ? entry.content.substring(0, 100) + '...' : entry.content}
                  </p>
                  <p style={{ marginTop: '0.25rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
