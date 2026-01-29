import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import LinkedItems from '../components/LinkedItems'
import { JournalService, PortfolioService } from '@/domain/services'
import type { JournalEntry, Position, ActionType } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

const ACTION_COLOR_CLASSES: Record<ActionType, { bg: string; text?: string }> = {
  buy: { bg: 'bg-emerald-500' },
  sell: { bg: 'bg-red-500' },
  long: { bg: 'bg-blue-500' },
  short: { bg: 'bg-amber-500' },
  deposit: { bg: 'bg-indigo-500' },
  withdraw: { bg: 'bg-violet-500' },
}

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  useEffect(() => {
    if (!id) return
    const data = JournalService.get(id)
    setEntry(data)

    // Load related position if available
    if (data?.positionId) {
      const pos = PortfolioService.get(data.positionId)
      setPosition(pos)
    }
  }, [id])

  const handleArchive = () => {
    if (!id) return
    if (!confirm('Are you sure you want to archive this journal entry?')) return

    JournalService.archive(id)
    navigate('/journal')
  }

  const header = (
    <PageHeader
      title="Trade Details"
      actionButton={
        <Link
          to="/journal"
          className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm no-underline hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Back
        </Link>
      }
    />
  )

  if (!entry) {
    return (
      <>
        {header}
        <Card className="p-5 md:p-6">
          <p className="text-zinc-500 dark:text-zinc-400">Journal entry not found.</p>
        </Card>
      </>
    )
  }

  const value = entry.quantity * entry.price
  const actionColors = ACTION_COLOR_CLASSES[entry.actionType] || { bg: 'bg-zinc-500' }
  const isCashAction = entry.actionType === 'deposit' || entry.actionType === 'withdraw'

  return (
    <>
      {header}

      {/* Main Trade Info */}
      <Card className="p-5 md:p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={cn(
              "inline-block px-2.5 py-1 text-white rounded text-xs font-semibold uppercase mb-2",
              actionColors.bg
            )}>
              {entry.actionType}
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono uppercase">
              {entry.ticker}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              ${value.toFixed(2)}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Value
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              {isCashAction ? 'Amount' : 'Quantity'}
            </div>
            <div className="text-base font-medium text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {entry.quantity}
            </div>
          </div>
          {!isCashAction && (
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Price</div>
              <div className="text-base font-medium text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                ${entry.price.toFixed(2)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Entry Time</div>
            <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              {new Date(entry.entryTime || entry.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Position</div>
            <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              {entry.positionMode === 'new' ? 'New' : 'Existing'}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Info (for buys) */}
      {entry.payment && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Payment Details
          </h3>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md border border-amber-300 dark:border-amber-700">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-amber-700 dark:text-amber-300">Paid with</div>
                <div className="text-base font-medium text-amber-800 dark:text-amber-200 font-mono tabular-nums">
                  {entry.payment.amount.toFixed(2)} {entry.payment.asset}
                </div>
              </div>
              {entry.payment.isNewMoney && (
                <span className="px-2 py-1 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-amber-100 rounded text-xs font-medium">
                  New Money
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Related Position */}
      {position && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Related Position
          </h3>
          <Link
            to={`/positions/${position.id}`}
            className="block no-underline"
          >
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border-l-[3px] border-l-emerald-500 hover:bg-green-100 dark:hover:bg-green-900/30">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-400 font-mono uppercase">{position.ticker}</div>
                  <div className="text-sm text-green-600 dark:text-green-500 font-mono tabular-nums">
                    {position.quantity} shares @ ${position.avgCost.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-700 dark:text-green-400 font-mono tabular-nums">
                    ${(position.quantity * position.avgCost).toFixed(2)}
                  </div>
                  {position.closedAt && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-sm">
                      Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </Card>
      )}

      {/* Optional Fields / Meta */}
      {entry.meta && Object.keys(entry.meta).length > 0 && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Additional Details
          </h3>
          <div className="flex flex-col gap-2">
            {typeof entry.meta.rationale === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Rationale</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {entry.meta.rationale}
                </div>
              </div>
            )}
            {typeof entry.meta.fees === 'number' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Fees</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
                  ${entry.meta.fees.toFixed(2)}
                </div>
              </div>
            )}
            {typeof entry.meta.venue === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Venue / Exchange</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.venue}
                </div>
              </div>
            )}
            {typeof entry.meta.sector === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Sector</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.sector}
                </div>
              </div>
            )}
            {typeof entry.meta.assetClass === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Asset Class</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.assetClass}
                </div>
              </div>
            )}
            {typeof entry.meta.timeHorizon === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Time Horizon</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.timeHorizon}
                </div>
              </div>
            )}
            {typeof entry.meta.priceTargets === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Price Targets</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.priceTargets}
                </div>
              </div>
            )}
            {typeof entry.meta.invalidation === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Invalidation Conditions</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {entry.meta.invalidation}
                </div>
              </div>
            )}
            {typeof entry.meta.emotions === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Emotions</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.emotions}
                </div>
              </div>
            )}
            {(typeof entry.meta.confidence === 'string' || typeof entry.meta.confidence === 'number') && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Confidence / Conviction</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {String(entry.meta.confidence)}
                </div>
              </div>
            )}
            {typeof entry.meta.status === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Status</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.meta.status}
                </div>
              </div>
            )}
            {typeof entry.meta.reminders === 'string' && (
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Reminders / Notes</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {entry.meta.reminders}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Linked Journal Entries */}
      {entry.meta && Array.isArray(entry.meta.relatedEntryIds) && entry.meta.relatedEntryIds.length > 0 && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Linked Journal Entries
          </h3>
          <div className="flex flex-col gap-2">
            {(entry.meta.relatedEntryIds as string[]).map(relatedId => {
              const relatedEntry = JournalService.get(relatedId)
              if (!relatedEntry) return null
              const relatedValue = relatedEntry.quantity * relatedEntry.price
              return (
                <Link
                  key={relatedId}
                  to={`/journal/${relatedId}`}
                  className="block no-underline"
                >
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-[3px] border-l-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1 py-0.5 bg-blue-500 text-white rounded-sm uppercase">
                          {relatedEntry.actionType}
                        </span>
                        <span className="font-medium text-blue-800 dark:text-blue-300">{relatedEntry.ticker}</span>
                      </div>
                      <span className="text-sm text-blue-800 dark:text-blue-300 font-mono tabular-nums">
                        ${relatedValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono tabular-nums">
                      {relatedEntry.quantity} @ ${relatedEntry.price.toFixed(2)} • {new Date(relatedEntry.entryTime || relatedEntry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'journal', id }} />}

      {/* Timestamps */}
      <Card className="p-5 md:p-6 mb-4">
        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          <div>Created: {new Date(entry.createdAt).toLocaleString()}</div>
          {entry.updatedAt !== entry.createdAt && (
            <div>Updated: {new Date(entry.updatedAt).toLocaleString()}</div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {!entry.archivedAt && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Actions
          </h3>
          <button
            onClick={handleArchive}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Archive Entry
          </button>
        </Card>
      )}

      {/* Archived Warning */}
      {entry.archivedAt && (
        <Card className="p-5 md:p-6 mb-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border-l-[3px] border-l-red-500">
            <p className="text-red-700 dark:text-red-400 font-medium m-0">
              This entry was archived on {new Date(entry.archivedAt).toLocaleString()}
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
