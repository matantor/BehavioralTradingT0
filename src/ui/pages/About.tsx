import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function About() {
  const header = <PageHeader title="About" />

  return (
    <>
      {header}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Behavioral Trading Companion
        </h2>
        <p style={{ color: '#6b7280' }}>
          A mobile-first behavioral investing companion.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Methodology
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
          This app is designed to help you:
        </p>
        <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
          <li>Define and track your long-term investment thesis</li>
          <li>Document your decisions and rationale</li>
          <li>Reflect on outcomes and patterns</li>
          <li>Connect thoughts, actions, and assets</li>
          <li>Observe your behavioral patterns over time</li>
        </ul>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Principles
        </h2>
        <ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
          <li>Deterministic analytics</li>
          <li>Explicit relationships</li>
          <li>No silent inference</li>
          <li>Explainability preserved</li>
          <li>Offline-first architecture</li>
        </ul>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Version
        </h2>
        <p style={{ color: '#6b7280' }}>
          v0.1.0
        </p>
        </Card>
    </>
  )
}
