import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { OnboardingService } from '@/domain/services'

export default function Onboarding() {
  const navigate = useNavigate()

  // If already completed/skipped, redirect to dashboard
  useEffect(() => {
    if (OnboardingService.isCompleted()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleCreateThesis = () => {
    // Mark onboarding as complete, then navigate to thesis creation
    OnboardingService.complete()
    navigate('/northstar/edit')
  }

  const handleSkip = () => {
    // Mark onboarding as skipped, then navigate to dashboard
    OnboardingService.skip()
    navigate('/dashboard')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <PageHeader title="Welcome" />
      <Card>
        <p style={{ marginBottom: '1rem' }}>
          Welcome to Behavioral Trading Companion.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          This app helps you define a long-term thesis, track your portfolio, log decisions, and observe your behavioral patterns over time.
        </p>
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li>Track portfolio positions</li>
          <li>Journal your decisions and reflections</li>
          <li>Define and evolve your NorthStar thesis</li>
          <li>Connect thoughts, actions, and assets</li>
          <li>Review deterministic analytics</li>
        </ul>
        <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
          Would you like to define your investing thesis now?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleCreateThesis}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Create Thesis Now
          </button>
          <button
            onClick={handleSkip}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Skip for Now
          </button>
        </div>
      </Card>
    </div>
  )
}
