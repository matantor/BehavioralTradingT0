import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'

export default function About() {
  const header = <PageHeader title="About" />

  return (
    <>
      {header}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Behavioral Trading Companion
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          A mobile-first behavioral investing companion.
        </p>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Methodology
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-2">
          This app is designed to help you:
        </p>
        <ul className="pl-6 list-disc text-zinc-500 dark:text-zinc-400">
          <li>Define and track your long-term investment thesis</li>
          <li>Document your decisions and rationale</li>
          <li>Reflect on outcomes and patterns</li>
          <li>Connect thoughts, actions, and assets</li>
          <li>Observe your behavioral patterns over time</li>
        </ul>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Principles
        </h2>
        <ul className="pl-6 list-disc text-zinc-500 dark:text-zinc-400">
          <li>Deterministic analytics</li>
          <li>Explicit relationships</li>
          <li>No silent inference</li>
          <li>Explainability preserved</li>
          <li>Offline-first architecture</li>
        </ul>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Version
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          v0.1.0
        </p>
      </Card>
    </>
  )
}
