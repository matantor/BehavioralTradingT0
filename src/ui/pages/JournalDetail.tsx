import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import LinkedItems from '../components/LinkedItems'
import { JournalService, PortfolioService } from '@/domain/services'
import type { JournalEntry, Position, PortfolioAction } from '@/domain/types/entities'

type ActionType = PortfolioAction['actionType']

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [positions, setPositions] = useState<Position[]>([])

  // Portfolio action form state
  const [showActionForm, setShowActionForm] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('set_position')
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!id) return
    const data = JournalService.get(id)
    setEntry(data)
    setPositions(PortfolioService.list(false)) // active positions only
  }, [id])

  const loadData = () => {
    if (!id) return
    const data = JournalService.get(id)
    setEntry(data)
    setPositions(PortfolioService.list(false)) // active positions only
  }

  // Determine if this is a new-position action
  const needsNewPosition = actionType === 'set_position'
  const needsExistingPosition = actionType === 'buy' || actionType === 'sell' || actionType === 'close_position'

  const resetActionForm = () => {
    setShowActionForm(false)
    setActionType('set_position')
    setSelectedPositionId('')
    setTicker('')
    setQuantity('')
    setPrice('')
    setActionError('')
  }

  const handleExecuteAction = () => {
    if (!id || !entry) return
    setActionError('')

    try {
      const action: PortfolioAction = {
        actionType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
      }

      if (needsNewPosition) {
        action.ticker = ticker.trim().toUpperCase()
      } else if (needsExistingPosition) {
        action.positionId = selectedPositionId
      }

      JournalService.executePortfolioAction(id, action)
      resetActionForm()
      loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to execute action')
    }
  }

  const handleArchive = () => {
    if (!id) return
    if (!confirm('Are you sure you want to archive this journal entry?')) return

    JournalService.archive(id)
    navigate('/journal')
  }

  // Get max sellable quantity for sell action
  const getMaxSellQuantity = (): number => {
    if (actionType !== 'sell' || !selectedPositionId) return 0
    const pos = positions.find(p => p.id === selectedPositionId)
    return pos?.quantity || 0
  }

  const isActionFormValid = (): boolean => {
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    if (isNaN(qty) || qty <= 0) return false
    if (isNaN(prc) || prc < 0) return false

    if (needsNewPosition && !ticker.trim()) return false
    if (needsExistingPosition && !selectedPositionId) return false

    // For sell, check quantity doesn't exceed held
    if (actionType === 'sell') {
      const maxQty = getMaxSellQuantity()
      if (qty > maxQty) return false
    }

    return true
  }

  const header = (
    <PageHeader
      title="Journal Entry"
      actionButton={
        <Link
          to="/journal"
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

  if (!entry) {
    return (
      <>
        {header}
        <Card>
          <p style={{ color: '#6b7280' }}>Journal entry not found.</p>
        </Card>
      </>
    )
  }

  const typeBadgeColor = {
    decision: '#3b82f6',
    reflection: '#8b5cf6',
    note: '#6b7280',
  }[entry.type]

  return (
    <>
      {header}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            {entry.title}
          </h2>
          <span style={{
            padding: '0.25rem 0.625rem',
            backgroundColor: typeBadgeColor,
            color: 'white',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'capitalize',
          }}>
            {entry.type}
          </span>
        </div>
        <p style={{ color: '#374151', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </p>
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Created: {new Date(entry.createdAt).toLocaleString()}
          </span>
          {entry.updatedAt !== entry.createdAt && (
            <>
              <br />
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Updated: {new Date(entry.updatedAt).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </Card>

      {entry.portfolioAction && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Portfolio Action
          </h2>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '0.375rem',
            borderLeft: '3px solid #10b981',
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Action</span>
                <p style={{ fontWeight: '500', textTransform: 'uppercase' }}>
                  {entry.portfolioAction.actionType.replace('_', ' ')}
                </p>
              </div>
              {entry.portfolioAction.ticker && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Ticker</span>
                  <p style={{ fontWeight: '500' }}>{entry.portfolioAction.ticker}</p>
                </div>
              )}
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Quantity</span>
                <p style={{ fontWeight: '500' }}>{entry.portfolioAction.quantity}</p>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Price</span>
                <p style={{ fontWeight: '500' }}>${entry.portfolioAction.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Context indicators */}
      {entry.meta && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Context Captured
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Boolean(entry.meta.noThesisExplicit) && (
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
              }}>
                No related thesis (explicit)
              </span>
            )}
            {Array.isArray(entry.meta.contextAnchors) && (entry.meta.contextAnchors as unknown[]).length > 0 && (
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
              }}>
                {(entry.meta.contextAnchors as unknown[]).length} context anchor(s)
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Portfolio Action Form - only for decision entries without existing action */}
      {entry.type === 'decision' && !entry.portfolioAction && !entry.archivedAt && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Add Portfolio Action
          </h2>
          {!showActionForm ? (
            <button
              onClick={() => setShowActionForm(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Add Action
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Action Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value as ActionType)
                    setSelectedPositionId('')
                    setTicker('')
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="set_position">Open New Position</option>
                  <option value="buy">Increase Position (Buy)</option>
                  <option value="sell">Decrease Position (Sell)</option>
                  <option value="close_position">Close Position</option>
                </select>
              </div>

              {/* Ticker (for new position) */}
              {needsNewPosition && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                    Ticker
                  </label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              )}

              {/* Position selector (for existing position) */}
              {needsExistingPosition && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                    Select Position
                  </label>
                  {positions.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      No active positions available. Open a new position first.
                    </p>
                  ) : (
                    <select
                      value={selectedPositionId}
                      onChange={(e) => setSelectedPositionId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      <option value="">Select a position...</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.ticker} ({pos.quantity} shares @ ${pos.avgCost.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Quantity */}
              {actionType !== 'close_position' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                    Quantity
                    {actionType === 'sell' && selectedPositionId && (
                      <span style={{ color: '#6b7280' }}> (max: {getMaxSellQuantity()})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0"
                    step="any"
                    placeholder="Number of shares"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                  Price per Share
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Price in USD"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Error message */}
              {actionError && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
                  {actionError}
                </p>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleExecuteAction}
                  disabled={!isActionFormValid()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isActionFormValid() ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: isActionFormValid() ? 'pointer' : 'not-allowed',
                    fontSize: '0.875rem',
                  }}
                >
                  Execute Action
                </button>
                <button
                  onClick={resetActionForm}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'journal', id }} />}

      {/* Actions section - archive */}
      {!entry.archivedAt && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Actions
          </h2>
          <button
            onClick={handleArchive}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Archive Entry
          </button>
        </Card>
      )}

      {/* Archived warning */}
      {entry.archivedAt && (
        <Card>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            borderRadius: '0.375rem',
            borderLeft: '3px solid #ef4444',
          }}>
            <p style={{ color: '#b91c1c', fontWeight: '500', margin: 0 }}>
              This entry was archived on {new Date(entry.archivedAt).toLocaleString()}
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
