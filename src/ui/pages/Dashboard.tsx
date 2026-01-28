import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { PortfolioService, NorthStarService } from '@/domain/services'
import type { Position, ThesisVersion } from '@/domain/types/entities'

export default function Dashboard() {
  const [positions, setPositions] = useState<Position[]>([])
  const [thesis, setThesis] = useState<ThesisVersion | null>(null)

  const loadData = useCallback(() => {
    // Load active positions
    const positionData = PortfolioService.list(false)
    setPositions(positionData)

    // Load current thesis
    const thesisData = NorthStarService.getCurrent()
    setThesis(thesisData)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const header = <PageHeader title="Dashboard" />

  // Calculate portfolio summary
  const totalCostBasis = positions.reduce((sum, p) => sum + p.quantity * p.avgCost, 0)
  const recentPositions = positions.slice(0, 3)

  // Preview helper
  const preview = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.substring(0, maxLen) + '...'
  }

  // Quick Access items
  const quickAccessItems = [
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/journal', label: 'Trading Journal' },
    { path: '/thoughts', label: 'Thoughts & Theses' },
    { path: '/analytics', label: 'Analytics & Patterns' },
    { path: '/settings', label: 'Settings' },
  ]

  return (
    <>
      {header}

      {/* Portfolio Summary */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Portfolio Summary
          </h2>
          <Link to="/portfolio" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        {positions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No positions yet. Start building your portfolio.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Positions</span>
                <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>{positions.length}</p>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Total Cost Basis</span>
                <p style={{ fontWeight: '600', fontSize: '1.25rem', color: '#10b981' }}>
                  ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {recentPositions.length > 0 && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Recent Positions</span>
                {recentPositions.map((p) => (
                  <Link
                    key={p.id}
                    to={`/positions/${p.id}`}
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                      <span style={{ fontWeight: '500' }}>{p.ticker}</span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {p.quantity} @ ${p.avgCost.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* North Star */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            North Star
          </h2>
          <Link to="/northstar" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>
            {thesis ? 'Update' : 'Create'}
          </Link>
        </div>
        {thesis ? (
          <>
            <p style={{ color: '#374151', lineHeight: '1.5' }}>
              {preview(thesis.content, 200)}
            </p>
            <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
              Last updated: {new Date(thesis.createdAt).toLocaleDateString()}
            </p>
          </>
        ) : (
          <p style={{ color: '#6b7280' }}>
            No thesis defined yet. Define your investment thesis to guide your decisions.
          </p>
        )}
      </Card>

      {/* Quick Access */}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Quick Access
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {quickAccessItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                color: '#374151',
              }}
            >
              <span style={{ fontWeight: '500' }}>{item.label}</span>
              <span style={{ color: '#9ca3af' }}>&rarr;</span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
