import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'

export default function NorthStarHistory() {
  const [versions, setVersions] = useState<ThesisVersion[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)

  useEffect(() => {
    const allVersions = NorthStarService.listVersions()
    setVersions(allVersions)
    const current = NorthStarService.getCurrent()
    if (current) {
      setCurrentId(current.id)
    }
  }, [])

  const header = (
    <PageHeader
      title="Thesis History"
      actionButton={
        <Link
          to="/northstar"
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

  const preview = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.substring(0, maxLen) + '...'
  }

  return (
    <>
      {header}

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          All Versions ({versions.length})
        </h2>

        {versions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>
            No thesis versions yet. Create your first thesis to start tracking changes.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {versions.map((version, index) => (
              <Link
                key={version.id}
                to={`/northstar/versions/${version.id}`}
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  backgroundColor: version.id === currentId ? '#eff6ff' : '#f9fafb',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderLeft: version.id === currentId ? '3px solid #3b82f6' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.875rem', color: '#374151' }}>
                    Version {versions.length - index}
                    {version.id === currentId && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                      }}>
                        CURRENT
                      </span>
                    )}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>&rarr;</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                  {preview(version.content, 100)}
                </p>
                {version.changeNote && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                    Note: {version.changeNote}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
