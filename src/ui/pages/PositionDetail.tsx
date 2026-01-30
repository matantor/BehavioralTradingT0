import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import LinkedItems from '../components/LinkedItems'
import { PortfolioService } from '@/domain/services'
import type { Position } from '@/domain/types/entities'

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [position, setPosition] = useState<Position | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  const loadPosition = useCallback(() => {
    if (!id) return
    const data = PortfolioService.get(id)
    setPosition(data)
    if (data) {
      setTicker(data.ticker || '')
      setName(data.name || '')
      setNotes(data.notes || '')
      setCurrentPrice(data.currentPrice !== undefined ? data.currentPrice.toString() : '')
    }
  }, [id])

  useEffect(() => {
    loadPosition()
  }, [loadPosition])

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !position) return

    PortfolioService.update(id, {
      ticker,
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    setIsEditing(false)
    loadPosition()
  }

  const handleArchive = () => {
    if (!id || !position) return
    if (!confirm(`Archive position ${position.ticker}? This will hide it from the main list.`)) return

    PortfolioService.archive(id)
    navigate('/portfolio')
  }

  const header = <PageHeader title={position ? position.ticker : 'Position'} />

  if (!position) {
    return (
      <>
        {header}
        <Card className="p-5 md:p-6">
          <p className="text-zinc-500 dark:text-zinc-400">Position not found.</p>
        </Card>
      </>
    )
  }

  const isLeveraged = PortfolioService.isLeveraged(position)
  const pnl = PortfolioService.getCombinedPnL(position)
  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const renderPnLValue = (value: number | null) => {
    if (isLeveraged) return 'N/A'
    if (value === null) return '—'
    return `$${formatCurrency(value)}`
  }

  const handleSetCurrentPrice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    const value = parseFloat(currentPrice)
    if (Number.isNaN(value)) {
      alert('Enter a valid current price')
      return
    }
    if (value < 0) {
      alert('Price must be >= 0')
      return
    }
    PortfolioService.setCurrentPrice(id, value)
    loadPosition()
  }

  return (
    <>
      {header}

      {position.archivedAt && (
        <Card className="p-5 md:p-6 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-200">
            This position was archived on {new Date(position.archivedAt).toLocaleDateString()}
          </div>
        </Card>
      )}

      <Card className="p-5 md:p-6 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Position Details
          </h2>
          {!isEditing && !position.archivedAt && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <div className="mb-2">
              <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Ticker
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g., AAPL"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple Inc."
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-y"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  loadPosition()
                }}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Ticker</span>
              <p className="font-semibold text-xl font-mono uppercase text-zinc-900 dark:text-zinc-100">{position.ticker}</p>
            </div>
            {position.name && (
              <div className="mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Name</span>
                <p className="text-zinc-900 dark:text-zinc-100">{position.name}</p>
              </div>
            )}
            <div className="flex gap-8 mb-2 flex-wrap">
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Quantity</span>
                <p className="font-medium font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{position.quantity}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Avg Cost</span>
                <p className="font-medium font-mono tabular-nums text-zinc-900 dark:text-zinc-100">${position.avgCost.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Value</span>
                <p className="font-medium font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                  ${(position.quantity * position.avgCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {position.closedAt && (
                <div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Status</span>
                  <p className="font-medium text-red-600 dark:text-red-400">Closed</p>
                </div>
              )}
            </div>
            {position.notes && (
              <div className="mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Notes</span>
                <p className="text-zinc-600 dark:text-zinc-300">{position.notes}</p>
              </div>
            )}
            {position.closedAt && (
              <div className="mb-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  Closed on {new Date(position.closedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                Created: {new Date(position.createdAt).toLocaleString()}
              </span>
              <br />
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                Updated: {new Date(position.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Current Price
        </h2>
        <form onSubmit={handleSetCurrentPrice} className="flex gap-2 items-center flex-wrap">
          <input
            type="number"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            min="0"
            step="any"
            placeholder="Manual price"
            className="p-2 border border-zinc-300 dark:border-zinc-600 rounded w-40 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 cursor-pointer"
          >
            Set Price
          </button>
        </form>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          P&amp;L Breakdown
        </h2>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Realized</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{renderPnLValue(pnl.realized)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Unrealized</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{renderPnLValue(pnl.unrealized)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Combined</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{renderPnLValue(pnl.combined)}</strong>
          </div>
        </div>
      </Card>

      {!position.archivedAt && (
        <Card className="p-5 md:p-6 mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Actions
          </h2>
          <button
            onClick={handleArchive}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
          >
            Archive Position
          </button>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Archiving hides the position from the main list. You can view archived positions using the toggle.
          </p>
        </Card>
      )}

      {/* Linked Items from RelationEdges */}
      {id && <LinkedItems entityRef={{ type: 'position', id }} />}
    </>
  )
}
