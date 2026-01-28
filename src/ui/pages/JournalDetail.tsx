import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import LinkedItems from '../components/LinkedItems'
import { JournalService, PortfolioService } from '@/domain/services'
import type { JournalEntry, Position, ActionType } from '@/domain/types/entities'

const ACTION_COLORS: Record<ActionType, string> = {
  buy: '#10b981',
  sell: '#ef4444',
  long: '#3b82f6',
  short: '#f59e0b',
  deposit: '#6366f1',
  withdraw: '#8b5cf6',
}

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  useEffect(() => {
    if (!id) return
    const data = JournalService.get(id)
    setEntry(data)

    // Load related position if available
    if (data?.positionId) {
      const pos = PortfolioService.get(data.positionId)
      setPosition(pos)
    }
  }, [id])

  const handleArchive = () => {
    if (!id) return
    if (!confirm('Are you sure you want to archive this journal entry?')) return

    JournalService.archive(id)
    navigate('/journal')
  }

  const header = (
    <PageHeader
      title="Trade Details"
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

  const value = entry.quantity * entry.price
  const actionColor = ACTION_COLORS[entry.actionType] || '#6b7280'
  const isCashAction = entry.actionType === 'deposit' || entry.actionType === 'withdraw'

  return (
    <>
      {header}

      {/* Main Trade Info */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.625rem',
              backgroundColor: actionColor,
              color: 'white',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              {entry.actionType}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              {entry.ticker}
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
              ${value.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Total Value
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>
              {isCashAction ? 'Amount' : 'Quantity'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {entry.quantity}
            </div>
          </div>
          {!isCashAction && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>Price</div>
              <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                ${entry.price.toFixed(2)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>Entry Time</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {new Date(entry.entryTime || entry.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>Position</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {entry.positionMode === 'new' ? 'New' : 'Existing'}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Info (for buys) */}
      {entry.payment && (
        <Card>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Payment Details
          </h3>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.375rem',
            border: '1px solid #fcd34d',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Paid with</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#78350f' }}>
                  {entry.payment.amount.toFixed(2)} {entry.payment.asset}
                </div>
              </div>
              {entry.payment.isNewMoney && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#fbbf24',
                  color: '#78350f',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}>
                  New Money
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Related Position */}
      {position && (
        <Card>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Related Position
          </h3>
          <Link
            to={`/positions/${position.id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '0.375rem',
              borderLeft: '3px solid #10b981',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#166534' }}>{position.ticker}</div>
                  <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                    {position.quantity} shares @ ${position.avgCost.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '500', color: '#166534' }}>
                    ${(position.quantity * position.avgCost).toFixed(2)}
                  </div>
                  {position.closedAt && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.375rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '0.125rem',
                    }}>
                      Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </Card>
      )}

      {/* Optional Fields / Meta */}
      {entry.meta && Object.keys(entry.meta).length > 0 && (
        <Card>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Additional Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {typeof entry.meta.rationale === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rationale</div>
                <div style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {entry.meta.rationale}
                </div>
              </div>
            )}
            {typeof entry.meta.fees === 'number' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fees</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  ${entry.meta.fees.toFixed(2)}
                </div>
              </div>
            )}
            {typeof entry.meta.venue === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Venue / Exchange</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.venue}
                </div>
              </div>
            )}
            {typeof entry.meta.sector === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sector</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.sector}
                </div>
              </div>
            )}
            {typeof entry.meta.assetClass === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Asset Class</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.assetClass}
                </div>
              </div>
            )}
            {typeof entry.meta.timeHorizon === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Time Horizon</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.timeHorizon}
                </div>
              </div>
            )}
            {typeof entry.meta.priceTargets === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Price Targets</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.priceTargets}
                </div>
              </div>
            )}
            {typeof entry.meta.invalidation === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Invalidation Conditions</div>
                <div style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {entry.meta.invalidation}
                </div>
              </div>
            )}
            {typeof entry.meta.emotions === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Emotions</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.emotions}
                </div>
              </div>
            )}
            {(typeof entry.meta.confidence === 'string' || typeof entry.meta.confidence === 'number') && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Confidence / Conviction</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {String(entry.meta.confidence)}
                </div>
              </div>
            )}
            {typeof entry.meta.status === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Status</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {entry.meta.status}
                </div>
              </div>
            )}
            {typeof entry.meta.reminders === 'string' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Reminders / Notes</div>
                <div style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {entry.meta.reminders}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Linked Journal Entries */}
      {entry.meta && Array.isArray(entry.meta.relatedEntryIds) && entry.meta.relatedEntryIds.length > 0 && (
        <Card>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Linked Journal Entries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(entry.meta.relatedEntryIds as string[]).map(relatedId => {
              const relatedEntry = JournalService.get(relatedId)
              if (!relatedEntry) return null
              const relatedValue = relatedEntry.quantity * relatedEntry.price
              return (
                <Link
                  key={relatedId}
                  to={`/journal/${relatedId}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.25rem',
                    borderLeft: '3px solid #3b82f6',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.25rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '0.125rem',
                          marginRight: '0.375rem',
                          textTransform: 'uppercase',
                        }}>
                          {relatedEntry.actionType}
                        </span>
                        <span style={{ fontWeight: '500', color: '#1e40af' }}>{relatedEntry.ticker}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                        ${relatedValue.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {relatedEntry.quantity} @ ${relatedEntry.price.toFixed(2)} • {new Date(relatedEntry.entryTime || relatedEntry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'journal', id }} />}

      {/* Timestamps */}
      <Card>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          <div>Created: {new Date(entry.createdAt).toLocaleString()}</div>
          {entry.updatedAt !== entry.createdAt && (
            <div>Updated: {new Date(entry.updatedAt).toLocaleString()}</div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {!entry.archivedAt && (
        <Card>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Actions
          </h3>
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

      {/* Archived Warning */}
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
