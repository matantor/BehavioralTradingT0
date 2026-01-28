import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { PortfolioService } from '@/domain/services'
import type { Position } from '@/domain/types/entities'

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([])
  const [includeArchived, setIncludeArchived] = useState(false)

  // Form state (minimal required fields)
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')

  const loadPositions = useCallback(() => {
    const data = PortfolioService.list(includeArchived)
    setPositions(data)
  }, [includeArchived])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim()) return

    const qty = parseFloat(quantity) || 0
    const cost = parseFloat(avgCost) || 0

    if (qty < 0) {
      alert('Quantity must be >= 0')
      return
    }

    PortfolioService.create({
      ticker: ticker.trim().toUpperCase(),
      quantity: qty,
      avgCost: cost,
      currency: 'USD',
    })

    setTicker('')
    setQuantity('')
    setAvgCost('')
    loadPositions()
  }

  const header = <PageHeader title="Portfolio" />

  // Calculate simple totals
  const activePositions = positions.filter((p) => !p.archivedAt)
  const totalValue = activePositions.reduce((sum, p) => sum + p.quantity * p.avgCost, 0)

  return (
    <>
      {header}

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Add Position
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ticker (e.g., AAPL)"
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
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="any"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
              }}
            />
            <input
              type="number"
              placeholder="Avg Cost"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              min="0"
              step="any"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
              }}
            />
          </div>
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
            Add Position
          </button>
        </form>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Positions ({positions.length})
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            Include archived
          </label>
        </div>

        {!includeArchived && activePositions.length > 0 && (
          <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.25rem' }}>
            <span style={{ color: '#166534', fontSize: '0.875rem' }}>
              Total Cost Basis: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {positions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No positions yet. Add your first position above.</p>
        ) : (
          <div>
            {positions.map((position) => (
              <Link
                key={position.id}
                to={`/positions/${position.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: position.archivedAt ? '#f3f4f6' : '#f9fafb',
                    borderRadius: '0.25rem',
                    borderLeft: `3px solid ${position.archivedAt ? '#9ca3af' : '#10b981'}`,
                    opacity: position.archivedAt ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1rem' }}>{position.ticker}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {position.archivedAt && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '0.25rem',
                            color: '#6b7280',
                          }}
                        >
                          Archived
                        </span>
                      )}
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {position.quantity} @ ${position.avgCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {position.name && (
                    <p style={{ marginTop: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {position.name}
                    </p>
                  )}
                  <p style={{ marginTop: '0.25rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                    Value: ${(position.quantity * position.avgCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
