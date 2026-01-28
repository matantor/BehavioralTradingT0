import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { JournalService, PortfolioService } from '@/domain/services'
import type { JournalEntry, Position, ActionType, PositionMode, PaymentInfo } from '@/domain/types/entities'

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

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: '0.25rem',
  }

  const fieldGroupStyle = {
    marginBottom: '0.75rem',
  }

  return (
    <>
      {header}

      {/* Add Entry Button or Form */}
      <Card>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            + Record Trade
          </button>
        ) : (
          <>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Record Trade
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Action Type */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Action Type *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: actionType === value ? '#3b82f6' : '#f3f4f6',
                        color: actionType === value ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Mode (for non-cash actions) */}
              {canSelectExisting && needsPosition && (
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Position *</label>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    {actionType !== 'sell' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={positionMode === 'new'}
                          onChange={() => {
                            setPositionMode('new')
                            setSelectedPositionId('')
                          }}
                        />
                        New Position
                      </label>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={positionMode === 'existing'}
                        onChange={() => setPositionMode('existing')}
                      />
                      Existing Position
                    </label>
                  </div>

                  {positionMode === 'existing' && (
                    <select
                      value={selectedPositionId}
                      onChange={(e) => setSelectedPositionId(e.target.value)}
                      style={inputStyle}
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
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Ticker / Symbol *</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, BTC"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Quantity */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  {isCashAction ? 'Amount *' : 'Quantity *'}
                  {actionType === 'sell' && selectedPositionId && (
                    <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (max: {getMaxSellQuantity()})</span>
                  )}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={isCashAction ? 'Amount in USD' : 'Number of shares/units'}
                  min="0"
                  step="any"
                  style={inputStyle}
                />
              </div>

              {/* Price (for non-cash actions) */}
              {!isCashAction && (
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Price per Unit *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price in USD"
                    min="0"
                    step="0.01"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Derived Value */}
              {derivedValue !== null && !isCashAction && (
                <div style={{
                  ...fieldGroupStyle,
                  padding: '0.5rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '0.25rem',
                  border: '1px solid #bbf7d0',
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                    Total Value: <strong>${derivedValue.toFixed(2)}</strong>
                  </span>
                </div>
              )}

              {/* Entry Time */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Entry Time *</label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Payment (for buys) */}
              {needsPayment && (
                <div style={{
                  ...fieldGroupStyle,
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.375rem',
                  border: '1px solid #fcd34d',
                }}>
                  <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Payment *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={paymentAsset}
                      onChange={(e) => setPaymentAsset(e.target.value.toUpperCase())}
                      placeholder="Asset"
                      style={{ ...inputStyle, width: '80px' }}
                    />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Amount"
                      min="0"
                      step="0.01"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#92400e', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isNewMoney}
                      onChange={(e) => setIsNewMoney(e.target.checked)}
                    />
                    New money (don't subtract from cash)
                  </label>
                </div>
              )}

              {/* Optional Fields Toggle */}
              <div style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showOptional ? '- Hide optional fields' : '+ Show optional fields'}
                </button>
              </div>

              {/* Optional Fields - per TASKLIST 1.2 */}
              {showOptional && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem',
                }}>
                  {/* Classification */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Classification
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Sector</label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="e.g., Technology"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Asset Class</label>
                      <input
                        type="text"
                        value={assetClass}
                        onChange={(e) => setAssetClass(e.target.value)}
                        placeholder="e.g., Equity, Crypto"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Context & Intent */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Context & Intent
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Rationale / Reason</label>
                    <textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Why are you making this trade?"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Time Horizon</label>
                    <input
                      type="text"
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(e.target.value)}
                      placeholder="e.g., 1-3 months, Long-term"
                      style={inputStyle}
                    />
                  </div>

                  {/* Targets & Logic */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Targets & Logic
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Price Targets</label>
                    <input
                      type="text"
                      value={priceTargets}
                      onChange={(e) => setPriceTargets(e.target.value)}
                      placeholder="e.g., $180 (TP1), $200 (TP2)"
                      style={inputStyle}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Invalidation Conditions</label>
                    <textarea
                      value={invalidation}
                      onChange={(e) => setInvalidation(e.target.value)}
                      placeholder="What would make you exit this position?"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  {/* Emotional & Cognitive */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Emotional & Cognitive
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Emotions</label>
                      <input
                        type="text"
                        value={emotions}
                        onChange={(e) => setEmotions(e.target.value)}
                        placeholder="e.g., Confident, FOMO"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Confidence / Conviction</label>
                      <input
                        type="text"
                        value={confidence}
                        onChange={(e) => setConfidence(e.target.value)}
                        placeholder="e.g., High, Medium, Low"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Execution Context */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Execution Context
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Fees</label>
                      <input
                        type="number"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                      <label style={labelStyle}>Venue (exchange / wallet / broker)</label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g., Robinhood, Coinbase"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* State & Workflow */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    State & Workflow
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Status</label>
                    <input
                      type="text"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="e.g., Active, Watching, Exited"
                      style={inputStyle}
                    />
                  </div>

                  {/* Follow-up */}
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Follow-up
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Reminders / Notes</label>
                    <textarea
                      value={reminders}
                      onChange={(e) => setReminders(e.target.value)}
                      placeholder="e.g., Review in 2 weeks, Check earnings date"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Linked Entries Section */}
              {(relatedEntryIds.length > 0 || showEntryPicker) && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem',
                  border: '1px solid #bfdbfe',
                }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase' }}>
                    Linked Journal Entries
                  </div>
                  {relatedEntryIds.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {relatedEntryIds.map(entryId => {
                        const linkedEntry = entries.find(e => e.id === entryId)
                        if (!linkedEntry) return null
                        return (
                          <div key={entryId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.375rem 0.5rem',
                            backgroundColor: 'white',
                            borderRadius: '0.25rem',
                            marginBottom: '0.25rem',
                          }}>
                            <span style={{ fontSize: '0.8125rem', color: '#1e40af' }}>
                              {linkedEntry.actionType.toUpperCase()} {linkedEntry.ticker} - {linkedEntry.quantity} @ ${linkedEntry.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRelatedEntryIds(ids => ids.filter(id => id !== entryId))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.25rem',
                              }}
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
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
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
                        style={{ ...inputStyle, marginBottom: '0.25rem' }}
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
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show link option when no entries linked but positionMode=existing */}
              {relatedEntryIds.length === 0 && !showEntryPicker && positionMode === 'existing' && entries.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEntryPicker(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    + Link to previous journal entry
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem',
                }}>
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    backgroundColor: isFormValid() ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: isFormValid() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save Trade
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </Card>

      {/* Journal Entries List */}
      <Card>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Trade History ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No trades recorded yet. Click "Record Trade" above to add your first entry.</p>
        ) : (
          <div>
            {entries.map((entry) => {
              const value = entry.quantity * entry.price
              const actionColors: Record<ActionType, string> = {
                buy: '#10b981',
                sell: '#ef4444',
                long: '#3b82f6',
                short: '#f59e0b',
                deposit: '#6366f1',
                withdraw: '#8b5cf6',
              }
              const color = actionColors[entry.actionType] || '#6b7280'

              return (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.25rem',
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: color,
                          color: 'white',
                          borderRadius: '0.125rem',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                        }}>
                          {entry.actionType}
                        </span>
                        <strong>{entry.ticker}</strong>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        ${value.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ marginTop: '0.25rem', color: '#4b5563', fontSize: '0.8125rem' }}>
                      {entry.quantity} × ${entry.price.toFixed(2)}
                    </div>
                    <div style={{ marginTop: '0.25rem', color: '#9ca3af', fontSize: '0.75rem' }}>
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
