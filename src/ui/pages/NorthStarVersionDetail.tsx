import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import LinkedItems from '../components/LinkedItems'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'

export default function NorthStarVersionDetail() {
  const { id } = useParams<{ id: string }>()
  const [version, setVersion] = useState<ThesisVersion | null>(null)
  const [isCurrent, setIsCurrent] = useState(false)
  const [versionNumber, setVersionNumber] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return

    const versions = NorthStarService.listVersions()
    const found = versions.find((v) => v.id === id)
    setVersion(found || null)

    if (found) {
      const index = versions.findIndex((v) => v.id === id)
      setVersionNumber(versions.length - index)
    }

    const current = NorthStarService.getCurrent()
    setIsCurrent(current?.id === id)
  }, [id])

  const header = (
    <PageHeader
      title={versionNumber ? `Version ${versionNumber}` : 'Version Detail'}
      actionButton={
        <Link
          to="/northstar/history"
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

  if (!version) {
    return (
      <>
        {header}
        <Card>
          <p style={{ color: '#6b7280' }}>Version not found.</p>
          <Link
            to="/northstar/history"
            style={{ color: '#3b82f6', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}
          >
            &larr; Back to History
          </Link>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      {isCurrent && (
        <Card>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.375rem',
            border: '1px solid #bfdbfe',
          }}>
            <span style={{
              padding: '0.125rem 0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              CURRENT
            </span>
            <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>
              This is your active thesis.
            </span>
          </div>
        </Card>
      )}

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Thesis Content
        </h2>
        <p style={{ color: '#1f2937', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {version.content}
        </p>
      </Card>

      {version.changeNote && (
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Change Note
          </h2>
          <p style={{ color: '#4b5563', fontStyle: 'italic' }}>
            {version.changeNote}
          </p>
        </Card>
      )}

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Metadata
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Created</span>
            <span style={{ color: '#374151', fontSize: '0.875rem' }}>
              {new Date(version.createdAt).toLocaleString()}
            </span>
          </div>
          {version.updatedAt && version.updatedAt !== version.createdAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Updated</span>
              <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                {new Date(version.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Version ID</span>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {version.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </Card>

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'thesis', id }} />}

      <Card>
        <Link
          to="/northstar/history"
          style={{
            display: 'block',
            padding: '0.75rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            color: '#374151',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          &larr; Back to History
        </Link>
      </Card>
    </>
  )
}
