import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
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
          className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm no-underline hover:bg-zinc-300 dark:hover:bg-zinc-600"
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
        <Card className="p-5 md:p-6">
          <p className="text-zinc-500 dark:text-zinc-400">Thought not found.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      {/* Promote/Demote action */}
      <Card className="p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMiniThesis ? (
              <>
                <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold">
                  MINI-THESIS
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                  This is a thesis you want to act on or monitor.
                </span>
              </>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                This is an exploratory thought.
              </span>
            )}
          </div>
        </div>
        <div className="mt-3">
          {isMiniThesis ? (
            <button
              onClick={handleDemote}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600"
            >
              Demote to Thought
            </button>
          ) : (
            <button
              onClick={handlePromote}
              className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded text-sm cursor-pointer hover:bg-purple-600 dark:hover:bg-purple-700"
            >
              Promote to Mini-thesis
            </button>
          )}
        </div>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Content
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">
          {thought.content}
        </p>
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono">
            Created: {new Date(thought.createdAt).toLocaleString()}
          </span>
          {thought.updatedAt !== thought.createdAt && (
            <>
              <br />
              <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono">
                Updated: {new Date(thought.updatedAt).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Thread ({messages.length})
        </h2>

        {messages.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 mb-3">
            No messages yet. Add notes, follow-ups, or reflections on this thought.
          </p>
        ) : (
          <div className="mb-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded border-l-2 border-l-violet-500"
              >
                <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-1">
                  {msg.content}
                </p>
                <p className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddMessage}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a note or follow-up..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-violet-500 dark:bg-violet-600 text-white rounded text-sm cursor-pointer hover:bg-violet-600 dark:hover:bg-violet-700"
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
