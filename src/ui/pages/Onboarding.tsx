import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
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
    <div className="max-w-[600px] mx-auto p-4">
      <PageHeader title="Welcome" />
      <Card className="p-5 md:p-6">
        <p className="mb-4 text-zinc-700 dark:text-zinc-300">
          Welcome to Behavioral Trading Companion.
        </p>
        <p className="mb-4 text-zinc-700 dark:text-zinc-300">
          This app helps you define a long-term thesis, track your portfolio, log decisions, and observe your behavioral patterns over time.
        </p>
        <ul className="mb-4 pl-6 list-disc text-zinc-700 dark:text-zinc-300">
          <li>Track portfolio positions</li>
          <li>Journal your decisions and reflections</li>
          <li>Define and evolve your NorthStar thesis</li>
          <li>Connect thoughts, actions, and assets</li>
          <li>Review deterministic analytics</li>
        </ul>
        <p className="mb-4 font-medium text-zinc-900 dark:text-zinc-100">
          Would you like to define your investing thesis now?
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCreateThesis}
            className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md cursor-pointer text-base hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Create Thesis Now
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md cursor-pointer text-base hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Skip for Now
          </button>
        </div>
      </Card>
    </div>
  )
}
