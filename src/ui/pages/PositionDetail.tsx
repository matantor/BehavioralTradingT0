import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import LinkedItems from '../components/LinkedItems'
import { PortfolioService } from '@/domain/services'
import type { Position } from '@/domain/types/entities'

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [position, setPosition] = useState<Position | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [notes, setNotes] = useState('')

  const loadPosition = useCallback(() => {
    if (!id) return
    const data = PortfolioService.get(id)
    setPosition(data)
    if (data) {
      setTicker(data.ticker)
      setName(data.name || '')
      setQuantity(data.quantity.toString())
      setAvgCost(data.avgCost.toString())
      setNotes(data.notes || '')
    }
  }, [id])

  useEffect(() => {
    loadPosition()
  }, [loadPosition])

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !position) return

    const qty = parseFloat(quantity) || 0
    const cost = parseFloat(avgCost) || 0

    if (qty < 0) {
      alert('Quantity must be >= 0')
      return
    }

    PortfolioService.update(id, {
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || undefined,
      quantity: qty,
      avgCost: cost,
      notes: notes.trim() || undefined,
    })

    setIsEditing(false)
    loadPosition()
  }

  const handleArchive = () => {
    if (!id || !position) return
    if (!confirm(`Archive position ${position.ticker}? This will hide it from the main list.`)) return

    PortfolioService.archive(id)
    navigate('/portfolio')
  }

  const header = <PageHeader title={position ? position.ticker : 'Position'} />

  if (!position) {
    return (
      <>
        {header}
        <Card>
          <p style={{ color: '#6b7280' }}>Position not found.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      {position.archivedAt && (
        <Card>
          <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.25rem', color: '#92400e' }}>
            This position was archived on {new Date(position.archivedAt).toLocaleDateString()}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Position Details
          </h2>
          {!isEditing && !position.archivedAt && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Ticker
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple Inc."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="any"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Avg Cost
                </label>
                <input
                  type="number"
                  value={avgCost}
                  onChange={(e) => setAvgCost(e.target.value)}
                  min="0"
                  step="any"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  loadPosition()
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ticker</span>
              <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>{position.ticker}</p>
            </div>
            {position.name && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Name</span>
                <p>{position.name}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Quantity</span>
                <p style={{ fontWeight: '500' }}>{position.quantity}</p>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Cost</span>
                <p style={{ fontWeight: '500' }}>${position.avgCost.toFixed(2)}</p>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Value</span>
                <p style={{ fontWeight: '500' }}>
                  ${(position.quantity * position.avgCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {position.closedAt && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Status</span>
                  <p style={{ fontWeight: '500', color: '#dc2626' }}>Closed</p>
                </div>
              )}
            </div>
            {position.notes && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Notes</span>
                <p style={{ color: '#4b5563' }}>{position.notes}</p>
              </div>
            )}
            {position.closedAt && (
              <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.25rem' }}>
                <span style={{ color: '#92400e', fontSize: '0.875rem' }}>
                  Closed on {new Date(position.closedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Created: {new Date(position.createdAt).toLocaleString()}
              </span>
              <br />
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Updated: {new Date(position.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Card>

      {!position.archivedAt && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Actions
          </h2>
          <button
            onClick={handleArchive}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Archive Position
          </button>
          <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
            Archiving hides the position from the main list. You can view archived positions using the toggle.
          </p>
        </Card>
      )}

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'position', id }} />}
    </>
  )
}
