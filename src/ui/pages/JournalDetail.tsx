import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import LinkedItems from '../components/LinkedItems'
import { JournalService, PortfolioService } from '@/domain/services'
import type { JournalEntry, Position, ActionType, PositionMode, PaymentInfo } from '@/domain/types/entities'
import { cn } from '@/lib/utils'

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
]

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
  const [positions, setPositions] = useState<Position[]>([])

  const [showReplaceForm, setShowReplaceForm] = useState(false)
  const [replaceError, setReplaceError] = useState('')

  const [actionType, setActionType] = useState<ActionType>('buy')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [entryTime, setEntryTime] = useState('')
  const [positionMode, setPositionMode] = useState<PositionMode>('new')
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [paymentAsset, setPaymentAsset] = useState('USD')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isNewMoney, setIsNewMoney] = useState(false)
  const [metaSnapshot, setMetaSnapshot] = useState<Record<string, unknown> | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    const data = JournalService.get(id)
    setEntry(data)
    setPositions(PortfolioService.list(false))

    // Load related position if available
    if (data?.positionId) {
      const pos = PortfolioService.get(data.positionId)
      setPosition(pos)
    }
  }, [id])

  useEffect(() => {
    if (!entry || !showReplaceForm) return
    setReplaceError('')
    setActionType(entry.actionType)
    setTicker(entry.ticker)
    setQuantity(entry.quantity.toString())
    setPrice(entry.price.toString())
    setEntryTime(new Date(entry.entryTime || entry.createdAt).toISOString().slice(0, 16))
    setPositionMode(entry.positionMode)
    setSelectedPositionId(entry.positionId || '')
    setPaymentAsset(entry.payment?.asset?.toUpperCase() || 'USD')
    setPaymentAmount(entry.payment ? entry.payment.amount.toString() : '')
    setIsNewMoney(Boolean(entry.payment?.isNewMoney))
    setMetaSnapshot(entry.meta)
  }, [entry, showReplaceForm])

  useEffect(() => {
    if (actionType === 'buy' && quantity && price) {
      const value = parseFloat(quantity) * parseFloat(price)
      if (!isNaN(value)) {
        setPaymentAmount(value.toFixed(2))
      }
    }
  }, [actionType, quantity, price])

  const handleArchive = () => {
    if (!id) return
    if (!confirm('Are you sure you want to archive this journal entry?')) return

    JournalService.archive(id)
    navigate('/journal')
  }

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry) return
    if (!isReplaceFormValid()) return
    setReplaceError('')

    try {
      const isCashAction = actionType === 'deposit' || actionType === 'withdraw'
      const needsPayment = actionType === 'buy'
      const canSelectExisting = actionType !== 'deposit' && actionType !== 'withdraw'

      const effectiveTicker = isCashAction ? 'USD' : ticker.trim().toUpperCase()
      const effectivePrice = isCashAction ? 1 : parseFloat(price)

      let payment: PaymentInfo | undefined
      if (needsPayment) {
        payment = {
          asset: paymentAsset.trim().toUpperCase(),
          amount: parseFloat(paymentAmount),
          isNewMoney,
        }
      }

      const result = JournalService.replaceTrade(entry.id, {
        actionType,
        ticker: effectiveTicker,
        quantity: parseFloat(quantity),
        price: effectivePrice,
        entryTime: new Date(entryTime).toISOString(),
        positionMode: canSelectExisting ? positionMode : 'new',
        positionId: positionMode === 'existing' ? selectedPositionId : undefined,
        payment,
        meta: metaSnapshot,
      })

      setShowReplaceForm(false)
      navigate(`/journal/${result.journalEntry.id}`)
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : 'Failed to replace trade')
    }
  }

  const needsPosition = actionType === 'buy' || actionType === 'sell' || actionType === 'long' || actionType === 'short'
  const needsPayment = actionType === 'buy'
  const isCashAction = actionType === 'deposit' || actionType === 'withdraw'
  const canSelectExisting = actionType !== 'deposit' && actionType !== 'withdraw'

  const availablePositions = positions.filter(p => {
    if (actionType === 'sell') {
      return p.quantity > 0 && !p.closedAt
    }
    return !p.closedAt
  })

  const derivedValue = (() => {
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    if (!isNaN(qty) && !isNaN(prc)) {
      return qty * prc
    }
    return null
  })()

  const getMaxSellQuantity = (): number => {
    if (actionType !== 'sell' || !selectedPositionId) return 0
    const pos = positions.find(p => p.id === selectedPositionId)
    return pos?.quantity || 0
  }

  const isReplaceFormValid = (): boolean => {
    if (!actionType) return false
    const effectiveTicker = isCashAction ? 'USD' : ticker
    if (!effectiveTicker.trim()) return false
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return false
    if (!isCashAction) {
      const prc = parseFloat(price)
      if (isNaN(prc) || prc < 0) return false
    }
    if (actionType === 'sell') {
      if (positionMode !== 'existing' || !selectedPositionId) return false
      const pos = positions.find(p => p.id === selectedPositionId)
      if (pos && qty > pos.quantity) return false
    }
    if (positionMode === 'existing' && needsPosition && !selectedPositionId) return false
    if (needsPayment) {
      if (!paymentAsset.trim()) return false
      const payAmt = parseFloat(paymentAmount)
      if (isNaN(payAmt) || payAmt < 0) return false
    }
    return true
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
  const isEntryCashAction = entry.actionType === 'deposit' || entry.actionType === 'withdraw'

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
              {isEntryCashAction ? 'Amount' : 'Quantity'}
            </div>
            <div className="text-base font-medium text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {entry.quantity}
            </div>
          </div>
          {!isEntryCashAction && (
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowReplaceForm((prev) => !prev)}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              {showReplaceForm ? 'Cancel Replace' : 'Replace / Correct Trade'}
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Archive Entry
            </button>
          </div>
        </Card>
      )}

      {/* Replace / Correct Form */}
      {!entry.archivedAt && showReplaceForm && (
        <Card className="p-5 md:p-6 mb-4">
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Replace / Correct Trade
          </h3>
          {replaceError && (
            <div className="mb-3 text-sm text-red-600 dark:text-red-400">
              {replaceError}
            </div>
          )}
          <form onSubmit={handleReplaceSubmit}>
            {/* Action Type */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Action Type *</label>
              <div className="flex flex-wrap gap-2">
                {ACTION_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setActionType(value)
                      if (value === 'sell') {
                        setPositionMode('existing')
                      }
                      if (value === 'deposit' || value === 'withdraw') {
                        setPositionMode('new')
                        setSelectedPositionId('')
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded text-sm cursor-pointer",
                      actionType === value
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Mode (for non-cash actions) */}
            {canSelectExisting && needsPosition && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Position *</label>
                <div className="flex gap-4 mb-2">
                  {actionType !== 'sell' && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        checked={positionMode === 'new'}
                        onChange={() => {
                          setPositionMode('new')
                          setSelectedPositionId('')
                        }}
                        className="rounded"
                      />
                      New Position
                    </label>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      checked={positionMode === 'existing'}
                      onChange={() => setPositionMode('existing')}
                      className="rounded"
                    />
                    Existing Position
                  </label>
                </div>

                {positionMode === 'existing' && (
                  <select
                    value={selectedPositionId}
                    onChange={(e) => setSelectedPositionId(e.target.value)}
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Select a position...</option>
                    {availablePositions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.ticker} ({pos.quantity} @ ${pos.avgCost.toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Ticker (for new positions, non-cash) */}
            {!isCashAction && positionMode === 'new' && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ticker / Symbol *</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL, BTC"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {isCashAction ? 'Amount *' : 'Quantity *'}
                {actionType === 'sell' && selectedPositionId && (
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal"> (max: {getMaxSellQuantity()})</span>
                )}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={isCashAction ? 'Amount in USD' : 'Number of shares/units'}
                min="0"
                step="any"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Price (for non-cash actions) */}
            {!isCashAction && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Price per Unit *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price in USD"
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            {/* Derived Value */}
            {derivedValue !== null && !isCashAction && (
              <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <span className="text-xs text-green-700 dark:text-green-400">
                  Total Value: <strong>${derivedValue.toFixed(2)}</strong>
                </span>
              </div>
            )}

            {/* Entry Time */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Entry Time *</label>
              <input
                type="datetime-local"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Payment (for buys) */}
            {needsPayment && (
              <div className="mb-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md border border-amber-300 dark:border-amber-700">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Payment *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={paymentAsset}
                    onChange={(e) => setPaymentAsset(e.target.value.toUpperCase())}
                    placeholder="Asset"
                    className="w-20 p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-[13px] text-amber-700 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewMoney}
                    onChange={(e) => setIsNewMoney(e.target.checked)}
                    className="rounded"
                  />
                  New money (don't subtract from cash)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={!isReplaceFormValid()}
              className={cn(
                "w-full py-2 rounded-md text-sm font-medium",
                isReplaceFormValid()
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
              )}
            >
              Save Replacement
            </button>
          </form>
        </Card>
      )}

      {/* Archived Warning */}
      {entry.archivedAt && (
        <Card className="p-5 md:p-6 mb-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border-l-[3px] border-l-red-500">
            <p className="text-red-700 dark:text-red-400 font-medium m-0">
              This entry was archived on {new Date(entry.archivedAt).toLocaleString()}
            </p>
            {entry.supersededById && (
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                Corrected by{' '}
                <Link className="underline" to={`/journal/${entry.supersededById}`}>
                  the replacement entry
                </Link>
                .
              </p>
            )}
          </div>
        </Card>
      )}
    </>
  )
}
