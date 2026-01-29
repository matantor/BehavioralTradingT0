import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
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

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Form state - mandatory fields
  const [actionType, setActionType] = useState<ActionType>('buy')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [entryTime, setEntryTime] = useState('')
  const [positionMode, setPositionMode] = useState<PositionMode>('new')
  const [selectedPositionId, setSelectedPositionId] = useState('')

  // Payment fields (for buy actions)
  const [paymentAsset, setPaymentAsset] = useState('USD')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isNewMoney, setIsNewMoney] = useState(false)

  // Optional fields (collapsible) - per TASKLIST 1.2
  const [showOptional, setShowOptional] = useState(false)
  // Classification
  const [sector, setSector] = useState('')
  const [assetClass, setAssetClass] = useState('')
  // Context & intent
  const [rationale, setRationale] = useState('')
  const [timeHorizon, setTimeHorizon] = useState('')
  // Targets & logic
  const [priceTargets, setPriceTargets] = useState('')
  const [invalidation, setInvalidation] = useState('')
  // Emotional & cognitive
  const [emotions, setEmotions] = useState('')
  const [confidence, setConfidence] = useState('')
  // Execution context
  const [fees, setFees] = useState('')
  const [venue, setVenue] = useState('')
  // State & workflow
  const [status, setStatus] = useState('')
  // Follow-up
  const [reminders, setReminders] = useState('')
  // Relations
  const [relatedEntryIds, setRelatedEntryIds] = useState<string[]>([])
  const [showEntryPicker, setShowEntryPicker] = useState(false)

  // UI state
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadData = () => {
    setEntries(JournalService.list())
    setPositions(PortfolioService.list(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Reset form to defaults
  const resetForm = () => {
    setActionType('buy')
    setTicker('')
    setQuantity('')
    setPrice('')
    setEntryTime(new Date().toISOString().slice(0, 16)) // datetime-local format
    setPositionMode('new')
    setSelectedPositionId('')
    setPaymentAsset('USD')
    setPaymentAmount('')
    setIsNewMoney(false)
    setShowOptional(false)
    // Reset all optional fields
    setSector('')
    setAssetClass('')
    setRationale('')
    setTimeHorizon('')
    setPriceTargets('')
    setInvalidation('')
    setEmotions('')
    setConfidence('')
    setFees('')
    setVenue('')
    setStatus('')
    setReminders('')
    setRelatedEntryIds([])
    setShowEntryPicker(false)
    setError('')
  }

  // Initialize form when showing
  useEffect(() => {
    if (showForm) {
      resetForm()
    }
  }, [showForm])

  // Auto-calculate payment amount when quantity/price change (for buys)
  useEffect(() => {
    if (actionType === 'buy' && quantity && price) {
      const value = parseFloat(quantity) * parseFloat(price)
      if (!isNaN(value)) {
        setPaymentAmount(value.toFixed(2))
      }
    }
  }, [actionType, quantity, price])

  // Auto-fill ticker when selecting existing position
  useEffect(() => {
    if (positionMode === 'existing' && selectedPositionId) {
      const pos = positions.find(p => p.id === selectedPositionId)
      if (pos) {
        setTicker(pos.ticker)
      }
    }
  }, [positionMode, selectedPositionId, positions])

  // Auto-suggest related entry when positionMode='existing' and ticker matches
  useEffect(() => {
    if (positionMode === 'existing' && ticker) {
      // Find most recent prior entry with same ticker
      const matchingEntry = entries.find(e => e.ticker === ticker.toUpperCase())
      if (matchingEntry) {
        setRelatedEntryIds([matchingEntry.id])
      } else {
        setRelatedEntryIds([])
      }
    } else if (positionMode === 'new') {
      // New position: default to no related entries
      setRelatedEntryIds([])
    }
  }, [positionMode, ticker, entries])

  // Determine if certain fields are needed
  const needsPosition = actionType === 'buy' || actionType === 'sell' || actionType === 'long' || actionType === 'short'
  const needsPayment = actionType === 'buy'
  const isCashAction = actionType === 'deposit' || actionType === 'withdraw'
  const canSelectExisting = actionType !== 'deposit' && actionType !== 'withdraw'

  // Get available positions for selection
  const availablePositions = positions.filter(p => {
    if (actionType === 'sell') {
      // For sell, only show positions with quantity > 0
      return p.quantity > 0 && !p.closedAt
    }
    return !p.closedAt
  })

  // Calculate derived value
  const derivedValue = (() => {
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    if (!isNaN(qty) && !isNaN(prc)) {
      return qty * prc
    }
    return null
  })()

  // Validate form
  const isFormValid = (): boolean => {
    // Action type always required
    if (!actionType) return false

    // Ticker required (auto-set to USD for deposit/withdraw)
    const effectiveTicker = isCashAction ? 'USD' : ticker
    if (!effectiveTicker.trim()) return false

    // Quantity required and positive
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return false

    // Price required for non-cash actions
    if (!isCashAction) {
      const prc = parseFloat(price)
      if (isNaN(prc) || prc < 0) return false
    }

    // For sell, must have existing position selected
    if (actionType === 'sell') {
      if (positionMode !== 'existing' || !selectedPositionId) return false
      // Check quantity doesn't exceed held
      const pos = positions.find(p => p.id === selectedPositionId)
      if (pos && qty > pos.quantity) return false
    }

    // For existing position, must have selection
    if (positionMode === 'existing' && needsPosition && !selectedPositionId) return false

    // For buy, payment required
    if (needsPayment) {
      if (!paymentAsset.trim()) return false
      const payAmt = parseFloat(paymentAmount)
      if (isNaN(payAmt) || payAmt < 0) return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return
    setError('')

    try {
      const effectiveTicker = isCashAction ? 'USD' : ticker.trim().toUpperCase()
      const effectivePrice = isCashAction ? 1 : parseFloat(price)

      // Build payment info for buys
      let payment: PaymentInfo | undefined
      if (needsPayment) {
        payment = {
          asset: paymentAsset.trim().toUpperCase(),
          amount: parseFloat(paymentAmount),
          isNewMoney,
        }
      }

      // Build meta for optional fields (per TASKLIST 1.2)
      const meta: Record<string, unknown> = {}
      // Classification
      if (sector.trim()) meta.sector = sector.trim()
      if (assetClass.trim()) meta.assetClass = assetClass.trim()
      // Context & intent
      if (rationale.trim()) meta.rationale = rationale.trim()
      if (timeHorizon.trim()) meta.timeHorizon = timeHorizon.trim()
      // Targets & logic
      if (priceTargets.trim()) meta.priceTargets = priceTargets.trim()
      if (invalidation.trim()) meta.invalidation = invalidation.trim()
      // Emotional & cognitive
      if (emotions.trim()) meta.emotions = emotions.trim()
      if (confidence.trim()) meta.confidence = confidence.trim()
      // Execution context
      if (fees.trim()) meta.fees = parseFloat(fees)
      if (venue.trim()) meta.venue = venue.trim()
      // State & workflow
      if (status.trim()) meta.status = status.trim()
      // Follow-up
      if (reminders.trim()) meta.reminders = reminders.trim()
      // Relations
      if (relatedEntryIds.length > 0) meta.relatedEntryIds = relatedEntryIds

      // Create journal entry (this also updates positions)
      JournalService.create({
        actionType,
        ticker: effectiveTicker,
        quantity: parseFloat(quantity),
        price: effectivePrice,
        entryTime: new Date(entryTime).toISOString(),
        positionMode: canSelectExisting ? positionMode : 'new',
        positionId: positionMode === 'existing' ? selectedPositionId : undefined,
        payment,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      })

      setShowForm(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    }
  }

  // Get max sellable quantity
  const getMaxSellQuantity = (): number => {
    if (actionType !== 'sell' || !selectedPositionId) return 0
    const pos = positions.find(p => p.id === selectedPositionId)
    return pos?.quantity || 0
  }

  const header = <PageHeader title="Trading Journal" />

  return (
    <>
      {header}

      {/* Add Entry Button or Form */}
      <Card className="p-5 md:p-6 mb-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-base font-medium cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            + Record Trade
          </button>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Record Trade
            </h2>
            <form onSubmit={handleSubmit}>
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

              {/* Optional Fields Toggle */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="text-[13px] text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {showOptional ? '- Hide optional fields' : '+ Show optional fields'}
                </button>
              </div>

              {/* Optional Fields - per TASKLIST 1.2 */}
              {showOptional && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md mb-3">
                  {/* Classification */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Classification
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sector</label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="e.g., Technology"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Asset Class</label>
                      <input
                        type="text"
                        value={assetClass}
                        onChange={(e) => setAssetClass(e.target.value)}
                        placeholder="e.g., Equity, Crypto"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Context & Intent */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Context & Intent
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rationale / Reason</label>
                    <textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Why are you making this trade?"
                      rows={2}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time Horizon</label>
                    <input
                      type="text"
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(e.target.value)}
                      placeholder="e.g., 1-3 months, Long-term"
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Targets & Logic */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Targets & Logic
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Price Targets</label>
                    <input
                      type="text"
                      value={priceTargets}
                      onChange={(e) => setPriceTargets(e.target.value)}
                      placeholder="e.g., $180 (TP1), $200 (TP2)"
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Invalidation Conditions</label>
                    <textarea
                      value={invalidation}
                      onChange={(e) => setInvalidation(e.target.value)}
                      placeholder="What would make you exit this position?"
                      rows={2}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
                    />
                  </div>

                  {/* Emotional & Cognitive */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Emotional & Cognitive
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Emotions</label>
                      <input
                        type="text"
                        value={emotions}
                        onChange={(e) => setEmotions(e.target.value)}
                        placeholder="e.g., Confident, FOMO"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confidence / Conviction</label>
                      <input
                        type="text"
                        value={confidence}
                        onChange={(e) => setConfidence(e.target.value)}
                        placeholder="e.g., High, Medium, Low"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Execution Context */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Execution Context
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fees</label>
                      <input
                        type="number"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="flex-1 mb-3">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Venue (exchange / wallet / broker)</label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g., Robinhood, Coinbase"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* State & Workflow */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    State & Workflow
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
                    <input
                      type="text"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="e.g., Active, Watching, Exited"
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Follow-up */}
                  <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    Follow-up
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Reminders / Notes</label>
                    <textarea
                      value={reminders}
                      onChange={(e) => setReminders(e.target.value)}
                      placeholder="e.g., Review in 2 weeks, Check earnings date"
                      rows={2}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
                    />
                  </div>
                </div>
              )}

              {/* Linked Entries Section */}
              {(relatedEntryIds.length > 0 || showEntryPicker) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-3 border border-blue-200 dark:border-blue-800">
                  <div className="mb-2 text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">
                    Linked Journal Entries
                  </div>
                  {relatedEntryIds.length > 0 && (
                    <div className="mb-2">
                      {relatedEntryIds.map(entryId => {
                        const linkedEntry = entries.find(e => e.id === entryId)
                        if (!linkedEntry) return null
                        return (
                          <div key={entryId} className="flex justify-between items-center px-2 py-1.5 bg-white dark:bg-zinc-800 rounded mb-1">
                            <span className="text-[13px] text-blue-800 dark:text-blue-300">
                              {linkedEntry.actionType.toUpperCase()} {linkedEntry.ticker} - {linkedEntry.quantity} @ ${linkedEntry.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRelatedEntryIds(ids => ids.filter(id => id !== entryId))}
                              className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-700 dark:hover:text-red-300 px-1 py-0.5"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {!showEntryPicker ? (
                    <button
                      type="button"
                      onClick={() => setShowEntryPicker(true)}
                      className="text-[13px] text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      + Add linked entry
                    </button>
                  ) : (
                    <div>
                      <select
                        onChange={(e) => {
                          if (e.target.value && !relatedEntryIds.includes(e.target.value)) {
                            setRelatedEntryIds([...relatedEntryIds, e.target.value])
                          }
                          e.target.value = ''
                        }}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-1"
                        defaultValue=""
                      >
                        <option value="">Select an entry...</option>
                        {entries.filter(e => !relatedEntryIds.includes(e.id)).map(e => (
                          <option key={e.id} value={e.id}>
                            {e.actionType.toUpperCase()} {e.ticker} - {e.quantity} @ ${e.price.toFixed(2)} ({new Date(e.entryTime || e.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowEntryPicker(false)}
                        className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show link option when no entries linked but positionMode=existing */}
              {relatedEntryIds.length === 0 && !showEntryPicker && positionMode === 'existing' && entries.length > 0 && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setShowEntryPicker(true)}
                    className="text-[13px] text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    + Link to previous journal entry
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm mb-3">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={cn(
                    "flex-1 py-2.5 rounded text-sm font-medium text-white",
                    isFormValid()
                      ? "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      : "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
                  )}
                >
                  Save Trade
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </Card>

      {/* Journal Entries List */}
      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Trade History ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No trades recorded yet. Click "Record Trade" above to add your first entry.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const value = entry.quantity * entry.price
              const actionColorClasses: Record<ActionType, { border: string; bg: string }> = {
                buy: { border: 'border-l-emerald-500', bg: 'bg-emerald-500' },
                sell: { border: 'border-l-red-500', bg: 'bg-red-500' },
                long: { border: 'border-l-blue-500', bg: 'bg-blue-500' },
                short: { border: 'border-l-amber-500', bg: 'bg-amber-500' },
                deposit: { border: 'border-l-indigo-500', bg: 'bg-indigo-500' },
                withdraw: { border: 'border-l-violet-500', bg: 'bg-violet-500' },
              }
              const colors = actionColorClasses[entry.actionType] || { border: 'border-l-zinc-500', bg: 'bg-zinc-500' }

              return (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  className="block no-underline"
                >
                  <div
                    className={cn(
                      "p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border-l-[3px]",
                      colors.border,
                      "hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[11px] px-1.5 py-0.5 text-white rounded-sm uppercase font-semibold",
                          colors.bg
                        )}>
                          {entry.actionType}
                        </span>
                        <strong className="text-zinc-900 dark:text-zinc-100">{entry.ticker}</strong>
                      </div>
                      <span className="text-sm font-medium font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                        ${value.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                      {entry.quantity} × ${entry.price.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(entry.entryTime || entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
