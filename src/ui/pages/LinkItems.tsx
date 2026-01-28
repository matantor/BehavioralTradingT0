import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function LinkItems() {
  const header = <PageHeader title="Link Items" />

  return (
    <>
      {header}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Create Relationship
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Link items form will appear here.
        </p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#6b7280' }}>
          <li>Select source item</li>
          <li>Select target item</li>
          <li>Choose relationship type</li>
          <li>Add context</li>
        </ul>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Relationship Types
        </h2>
        <div style={{ color: '#6b7280' }}>
          <p>• Related</p>
          <p>• Supports</p>
          <p>• Contradicts</p>
          <p>• Context</p>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Existing Relationships
        </h2>
        <p style={{ color: '#6b7280' }}>
          [Placeholder] Your current item relationships will appear here.
        </p>
        </Card>
    </>
  )
}
