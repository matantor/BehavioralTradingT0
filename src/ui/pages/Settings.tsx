import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { resetData } from '@/lib/storage/storage'

export default function Settings() {
  const navigate = useNavigate()
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all data? This will permanently delete all your positions, journal entries, thoughts, and settings.'
    )
    
    if (confirmed) {
      setIsResetting(true)
      resetData()
      navigate('/')
    }
  }

  const header = <PageHeader title="Settings" />

  return (
    <>
      {header}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Data Management
        </h2>
        <button
          onClick={handleReset}
          disabled={isResetting}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isResetting ? '#9ca3af' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {isResetting ? 'Resetting...' : 'Reset All Data'}
        </button>
        <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          Warning: This will permanently delete all your data.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Export Data
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Export your data to JSON will appear here.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Preferences
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] App preferences and settings will appear here.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          About
        </h2>
        <p style={{ color: '#6b7280' }}>
          Behavioral Trading Companion v0.1.0
        </p>
        </Card>
    </>
  )
}
