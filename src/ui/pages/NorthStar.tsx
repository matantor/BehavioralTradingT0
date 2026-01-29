import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'

export default function NorthStar() {
  const [currentThesis, setCurrentThesis] = useState<ThesisVersion | null>(null)
  const [versionCount, setVersionCount] = useState(0)

  useEffect(() => {
    const current = NorthStarService.getCurrent()
    setCurrentThesis(current)
    setVersionCount(NorthStarService.listVersions().length)
  }, [])

  const header = (
    <PageHeader
      title="North Star"
      actionButton={
        <Link
          to="/northstar/edit"
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded text-sm no-underline hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {currentThesis ? 'Edit' : 'Create'}
        </Link>
      }
    />
  )

  return (
    <>
      {header}

      {/* Current Thesis */}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Current Thesis
        </h2>
        {currentThesis ? (
          <>
            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">
              {currentThesis.content}
            </p>
            {currentThesis.changeNote && (
              <p className="mt-3 text-zinc-500 dark:text-zinc-400 text-sm italic">
                Note: {currentThesis.changeNote}
              </p>
            )}
            <p className="mt-2 text-zinc-400 dark:text-zinc-500 text-xs font-mono">
              Last updated: {new Date(currentThesis.createdAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            No thesis defined yet. Your North Star guides your investment decisions.
          </p>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Actions
        </h2>
        <div className="flex flex-col gap-2">
          <Link
            to="/northstar/edit"
            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md no-underline text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
          >
            <span className="font-medium">
              {currentThesis ? 'Update Thesis' : 'Create Thesis'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">&rarr;</span>
          </Link>
          <Link
            to="/northstar/history"
            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md no-underline text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
          >
            <span className="font-medium">View History</span>
            <span className="text-zinc-400 dark:text-zinc-500">{versionCount} versions &rarr;</span>
          </Link>
        </div>
      </Card>
    </>
  )
}
