import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'

export default function NorthStar() {
  const [currentThesis, setCurrentThesis] = useState<ThesisVersion | null>(null)
  const [versionCount, setVersionCount] = useState(0)

  useEffect(() => {
    const current = NorthStarService.getCurrent()
    setCurrentThesis(current)
    setVersionCount(NorthStarService.listVersions().length)
  }, [])

  const header = (
    <PageHeader
      title="North Star"
      actionButton={
        <Link
          to="/northstar/edit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.25rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          {currentThesis ? 'Edit' : 'Create'}
        </Link>
      }
    />
  )

  return (
    <>
      {header}

      {/* Current Thesis */}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Current Thesis
        </h2>
        {currentThesis ? (
          <>
            <p style={{ color: '#1f2937', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {currentThesis.content}
            </p>
            {currentThesis.changeNote && (
              <p style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Note: {currentThesis.changeNote}
              </p>
            )}
            <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
              Last updated: {new Date(currentThesis.createdAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p style={{ color: '#6b7280' }}>
            No thesis defined yet. Your North Star guides your investment decisions.
          </p>
        )}
      </Card>

      {/* Actions */}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/northstar/edit"
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
            <span style={{ fontWeight: '500' }}>
              {currentThesis ? 'Update Thesis' : 'Create Thesis'}
            </span>
            <span style={{ color: '#9ca3af' }}>&rarr;</span>
          </Link>
          <Link
            to="/northstar/history"
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
            <span style={{ fontWeight: '500' }}>View History</span>
            <span style={{ color: '#9ca3af' }}>{versionCount} versions &rarr;</span>
          </Link>
        </div>
      </Card>
    </>
  )
}
