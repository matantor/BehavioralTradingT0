import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import LinkedItems from '../components/LinkedItems'
import { ThoughtService, ThreadService, getThoughtKind } from '@/domain/services'
import type { Thought, ThreadMessage } from '@/domain/types/entities'

export default function ThoughtDetail() {
  const { id } = useParams<{ id: string }>()
  const [thought, setThought] = useState<Thought | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  const loadThought = useCallback(() => {
    if (!id) return
    const data = ThoughtService.get(id)
    setThought(data)
  }, [id])

  const loadMessages = useCallback(() => {
    if (!id) return
    const data = ThreadService.getMessages({ type: 'thought', id })
    setMessages(data)
  }, [id])

  useEffect(() => {
    loadThought()
    loadMessages()
  }, [loadThought, loadMessages])

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newMessage.trim()) return

    ThreadService.addMessage({ type: 'thought', id }, newMessage.trim())
    setNewMessage('')
    loadMessages()
  }

  const handlePromote = () => {
    if (!id) return
    ThoughtService.updateKind(id, 'mini_thesis')
    loadThought()
  }

  const handleDemote = () => {
    if (!id) return
    ThoughtService.updateKind(id, 'thought')
    loadThought()
  }

  const kind = thought ? getThoughtKind(thought) : 'thought'
  const isMiniThesis = kind === 'mini_thesis'

  const header = (
    <PageHeader
      title={isMiniThesis ? 'Mini-thesis' : 'Thought'}
      actionButton={
        <Link
          to="/thoughts"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            borderRadius: '0.25rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          Back
        </Link>
      }
    />
  )

  if (!thought) {
    return (
      <>
        {header}
        <Card>
          <p style={{ color: '#6b7280' }}>Thought not found.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      {/* Promote/Demote action */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isMiniThesis ? (
              <>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#a855f7',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  MINI-THESIS
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  This is a thesis you want to act on or monitor.
                </span>
              </>
            ) : (
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                This is an exploratory thought.
              </span>
            )}
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          {isMiniThesis ? (
            <button
              onClick={handleDemote}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Demote to Thought
            </button>
          ) : (
            <button
              onClick={handlePromote}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#a855f7',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Promote to Mini-thesis
            </button>
          )}
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Content
        </h2>
        <p style={{ color: '#374151', fontSize: '1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
          {thought.content}
        </p>
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Created: {new Date(thought.createdAt).toLocaleString()}
          </span>
          {thought.updatedAt !== thought.createdAt && (
            <>
              <br />
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Updated: {new Date(thought.updatedAt).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Thread ({messages.length})
        </h2>

        {messages.length === 0 ? (
          <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
            No messages yet. Add notes, follow-ups, or reflections on this thought.
          </p>
        ) : (
          <div style={{ marginBottom: '0.75rem' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.25rem',
                  borderLeft: '2px solid #8b5cf6',
                }}
              >
                <p style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {msg.content}
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddMessage}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Add a note or follow-up..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
        </form>
      </Card>

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'thought', id }} />}
    </>
  )
}
