import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'

export default function Analytics() {
  const header = <PageHeader title="Analytics" />

  return (
    <>
      {header}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Behavioral Analytics
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Deterministic behavioral metrics will appear here.
        </p>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Decision Patterns
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Analysis of your decision patterns will appear here.
        </p>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Performance Metrics
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Portfolio performance and outcomes will appear here.
        </p>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Explainability
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] How metrics were calculated will appear here.
        </p>
      </Card>
    </>
  )
}
