import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actionButton?: ReactNode
}

export default function PageHeader({ title, actionButton }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
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
