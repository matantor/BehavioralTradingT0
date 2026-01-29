import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

export default function NorthStarHistory() {
  const [versions, setVersions] = useState<ThesisVersion[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)

  useEffect(() => {
    const allVersions = NorthStarService.listVersions()
    setVersions(allVersions)
    const current = NorthStarService.getCurrent()
    if (current) {
      setCurrentId(current.id)
    }
  }, [])

  const header = (
    <PageHeader
      title="Thesis History"
      actionButton={
        <Link
          to="/northstar"
          className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm no-underline hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Back
        </Link>
      }
    />
  )

  const preview = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text
    return text.substring(0, maxLen) + '...'
  }

  return (
    <>
      {header}

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          All Versions ({versions.length})
        </h2>

        {versions.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No thesis versions yet. Create your first thesis to start tracking changes.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {versions.map((version, index) => (
              <Link
                key={version.id}
                to={`/northstar/versions/${version.id}`}
                className={cn(
                  "block p-3 rounded-md no-underline border-l-[3px]",
                  version.id === currentId
                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-blue-500"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-l-transparent",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                    Version {versions.length - index}
                    {version.id === currentId && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px] font-semibold">
                        CURRENT
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs">&rarr;</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  {preview(version.content, 100)}
                </p>
                {version.changeNote && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mb-1">
                    Note: {version.changeNote}
                  </p>
                )}
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
