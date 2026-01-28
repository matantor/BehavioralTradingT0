import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import ContextSelector from '../components/ContextSelector'
import { NorthStarService, RelationService } from '@/domain/services'
import type { ContextAnchor } from '@/domain/types/entities'

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
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Your Investment Thesis
          </h2>
          <textarea
            placeholder="Define your guiding investment philosophy..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              lineHeight: '1.5',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </Card>

        {!isNew && (
          <Card>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Change Note
            </h2>
            <input
              type="text"
              placeholder="Why are you updating your thesis? (optional)"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
              This helps you track why your thesis evolved over time.
            </p>
          </Card>
        )}

        <Card>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
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

        <Card>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={!content.trim()}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: content.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: content.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {isNew ? 'Create Thesis' : 'Save Changes'}
            </button>
            <Link
              to="/northstar"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: '500',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Cancel
            </Link>
          </div>
        </Card>
      </form>
    </>
  )
}
