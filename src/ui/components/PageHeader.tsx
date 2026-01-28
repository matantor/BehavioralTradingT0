import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actionButton?: ReactNode
}

export default function PageHeader({ title, actionButton }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: 0
      }}>
        {title}
      </h1>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </div>
  )
}
