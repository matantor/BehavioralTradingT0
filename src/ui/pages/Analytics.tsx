import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Analytics() {
  const header = <PageHeader title="Analytics" />

  return (
    <>
      {header}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Behavioral Analytics
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Deterministic behavioral metrics will appear here.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Decision Patterns
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Analysis of your decision patterns will appear here.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Performance Metrics
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Portfolio performance and outcomes will appear here.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Explainability
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] How metrics were calculated will appear here.
        </p>
        </Card>
    </>
  )
}
