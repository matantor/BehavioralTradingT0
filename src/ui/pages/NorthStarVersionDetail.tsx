import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import LinkedItems from '../components/LinkedItems'
import { NorthStarService } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'

export default function NorthStarVersionDetail() {
  const { id } = useParams<{ id: string }>()
  const [version, setVersion] = useState<ThesisVersion | null>(null)
  const [isCurrent, setIsCurrent] = useState(false)
  const [versionNumber, setVersionNumber] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return

    const versions = NorthStarService.listVersions()
    const found = versions.find((v) => v.id === id)
    setVersion(found || null)

    if (found) {
      const index = versions.findIndex((v) => v.id === id)
      setVersionNumber(versions.length - index)
    }

    const current = NorthStarService.getCurrent()
    setIsCurrent(current?.id === id)
  }, [id])

  const header = (
    <PageHeader
      title={versionNumber ? `Version ${versionNumber}` : 'Version Detail'}
      actionButton={
        <Link
          to="/northstar/history"
          className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm no-underline hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Back
        </Link>
      }
    />
  )

  if (!version) {
    return (
      <>
        {header}
        <Card className="p-5 md:p-6">
          <p className="text-zinc-500 dark:text-zinc-400">Version not found.</p>
          <Link
            to="/northstar/history"
            className="text-blue-600 dark:text-blue-400 no-underline mt-2 inline-block hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back to History
          </Link>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      {isCurrent && (
        <Card className="p-5 md:p-6 mb-4">
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">
              CURRENT
            </span>
            <span className="text-sm text-blue-800 dark:text-blue-300">
              This is your active thesis.
            </span>
          </div>
        </Card>
      )}

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Thesis Content
        </h2>
        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">
          {version.content}
        </p>
      </Card>

      {version.changeNote && (
        <Card className="p-5 md:p-6 mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Change Note
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 italic">
            {version.changeNote}
          </p>
        </Card>
      )}

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Metadata
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Created</span>
            <span className="text-zinc-700 dark:text-zinc-300 text-sm">
              {new Date(version.createdAt).toLocaleString()}
            </span>
          </div>
          {version.updatedAt && version.updatedAt !== version.createdAt && (
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-sm">Updated</span>
              <span className="text-zinc-700 dark:text-zinc-300 text-sm">
                {new Date(version.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Version ID</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono">
              {version.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </Card>

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'thesis', id }} />}

      <Card className="p-5 md:p-6">
        <Link
          to="/northstar/history"
          className="block p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md no-underline text-zinc-700 dark:text-zinc-300 text-center font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
        >
          &larr; Back to History
        </Link>
      </Card>
    </>
  )
}
