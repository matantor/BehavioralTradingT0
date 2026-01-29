import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import { resetData } from '@/lib/storage/storage'
import { cn } from '@/lib/utils'

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
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Data Management
        </h2>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className={cn(
            "px-4 py-2 rounded-md text-sm text-white",
            isResetting
              ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
              : "bg-red-500 dark:bg-red-600 cursor-pointer hover:bg-red-600 dark:hover:bg-red-700"
          )}
        >
          {isResetting ? 'Resetting...' : 'Reset All Data'}
        </button>
        <p className="mt-2 text-red-500 dark:text-red-400 text-sm">
          Warning: This will permanently delete all your data.
        </p>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Export Data
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Export your data to JSON will appear here.
        </p>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Preferences
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] App preferences and settings will appear here.
        </p>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          About
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Behavioral Trading Companion v0.1.0
        </p>
      </Card>
    </>
  )
}
