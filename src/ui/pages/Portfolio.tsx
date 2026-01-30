import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'
import { PortfolioService } from '@/domain/services'
import type { PortfolioViewPosition } from '@/domain/services/PortfolioService'
import type { RefreshResult } from '@/domain/types/pricing'
import { cn } from '@/lib/utils'

type PnLView = 'combined' | 'realized' | 'unrealized'
type RefreshStatus = 'idle' | 'loading' | 'success' | 'error'

export default function Portfolio() {
  const [positions, setPositions] = useState<PortfolioViewPosition[]>([])
  const [showClosed, setShowClosed] = useState(false)
  const [pnlView, setPnlView] = useState<PnLView>('combined')
  const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({})
  const [totals, setTotals] = useState(PortfolioService.getPortfolioTotals())
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle')
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(PortfolioService.getPortfolioView().lastRefreshed)
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null)

  const loadPositions = useCallback(() => {
    const view = PortfolioService.getPortfolioView({ status: showClosed ? 'closed' : 'open' })
    setPositions(view.positions)
    setTotals(view.totals)
    setLastRefreshed(view.lastRefreshed)

    setCurrentPrices((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const item of view.positions) {
        if (next[item.position.id] === undefined) {
          next[item.position.id] = item.position.currentPrice !== undefined ? item.position.currentPrice.toString() : ''
        }
      }
      return next
    })
  }, [showClosed])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const handleSetCurrentPrice = (positionId: string) => {
    const raw = currentPrices[positionId] ?? ''
    const value = parseFloat(raw)
    if (Number.isNaN(value)) {
      alert('Enter a valid current price')
      return
    }
    if (value < 0) {
      alert('Price must be >= 0')
      return
    }
    PortfolioService.setCurrentPrice(positionId, value)
    loadPositions()
  }

  const handleRefreshPrices = async () => {
    setRefreshStatus('loading')
    setRefreshResult(null)

    try {
      // Only refresh open positions
      const result = await PortfolioService.refreshMarketPrices()

      setRefreshResult(result)

      if (result.failed.length > 0 && result.success.length === 0) {
        setRefreshStatus('error')
      } else {
        setRefreshStatus('success')
      }

      // Reload to reflect any new market prices
      loadPositions()

      // Clear status after 5 seconds
      setTimeout(() => {
        setRefreshStatus('idle')
        setRefreshResult(null)
      }, 5000)
    } catch (error) {
      console.error('Price refresh failed:', error)
      setRefreshStatus('error')
      setTimeout(() => setRefreshStatus('idle'), 5000)
    }
  }

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const header = <PageHeader title="Portfolio" />

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const renderPnLValue = (value: number | null, isLeveraged: boolean) => {
    if (isLeveraged) return 'N/A'
    if (value === null) return '—'
    return `$${formatCurrency(value)}`
  }

  const selectedTotalPnL =
    pnlView === 'realized'
      ? totals.realizedPnL
      : pnlView === 'unrealized'
        ? totals.unrealizedPnL
        : totals.combinedPnL

  return (
    <>
      {header}

      <Card className="p-5 md:p-6 mb-4">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Portfolio Totals (Spot Only)
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Open positions: {totals.positionCount}
            </p>
          </div>
          <div className="flex gap-3 items-start flex-wrap justify-end">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
                P&amp;L View
              </label>
              <select
                value={pnlView}
                onChange={(e) => setPnlView(e.target.value as PnLView)}
                className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value="combined">Combined</option>
                <option value="realized">Realized</option>
                <option value="unrealized">Unrealized</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
                Market Prices
              </label>
              <button
                onClick={handleRefreshPrices}
                disabled={refreshStatus === 'loading'}
                className={cn(
                  "px-3 py-1 rounded text-sm cursor-pointer",
                  refreshStatus === 'loading'
                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-wait"
                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                )}
              >
                {refreshStatus === 'loading' ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Last Refreshed Timestamp */}
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Last updated: {lastRefreshed ? formatTimestamp(lastRefreshed) : '—'}
        </p>

        {/* Refresh Failures */}
        {refreshResult && refreshResult.failed.length > 0 && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Some tickers failed: {refreshResult.failed.join(', ')}
          </p>
        )}
        <div className="mt-3 grid gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Value</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">${formatCurrency(totals.totalValue)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Cost Basis</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">${formatCurrency(totals.totalCostBasis)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Portfolio P&amp;L ({pnlView})</span>
            <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{typeof selectedTotalPnL === 'number' ? `$${formatCurrency(selectedTotalPnL)}` : '—'}</strong>
          </div>
          <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>Realized</span>
            <span className="font-mono tabular-nums">${formatCurrency(totals.realizedPnL)}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>Unrealized</span>
            <span className="font-mono tabular-nums">{totals.unrealizedPnL === null ? '—' : `$${formatCurrency(totals.unrealizedPnL)}`}</span>
          </div>
        </div>
      </Card>

      <Card className="p-5 md:p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {showClosed ? 'Closed Positions' : 'Open Positions'} ({positions.length})
          </h2>
          <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              className="rounded"
            />
            Show closed
          </label>
        </div>

        {positions.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            {showClosed ? 'No closed positions yet.' : 'No open positions yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {positions.map((item) => {
              const position = item.position
              const isLeveraged = item.isLeveraged
              const pnl = item.pnl
              const marketPriceStatus = item.marketPriceStatus
              const effectivePriceInfo = item.effectivePrice

              return (
                <Link
                  key={position.id}
                  to={`/positions/${position.id}`}
                  className="block no-underline"
                >
                  <div
                    className={cn(
                      "p-3 rounded-md border-l-[3px]",
                      position.archivedAt
                        ? "bg-zinc-100 dark:bg-zinc-800 border-l-zinc-400 opacity-70"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-l-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    )}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <strong className="font-mono text-base uppercase text-zinc-900 dark:text-zinc-100">{position.ticker}</strong>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                        {position.quantity} @ ${position.avgCost.toFixed(2)}
                      </span>
                    </div>
                    {position.name && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {position.name}
                      </p>
                    )}
                    <div className="mt-2 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono tabular-nums">
                        Value: ${(position.quantity * position.avgCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Price Info */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-mono tabular-nums">
                          Manual: {position.currentPrice !== undefined ? `$${position.currentPrice.toFixed(2)}` : '—'}
                        </span>
                        <span className={cn(
                          "font-mono tabular-nums",
                          marketPriceStatus.isStale && "text-amber-600 dark:text-amber-400"
                        )}>
                          Market: {marketPriceStatus.price !== null ? `$${marketPriceStatus.price.toFixed(2)}` : '—'}
                          {marketPriceStatus.isStale && " Stale"}
                        </span>
                        <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          Using: {effectivePriceInfo.source}
                        </span>
                      </div>

                      <span className="font-mono tabular-nums">Realized P&amp;L: {renderPnLValue(pnl.realized, isLeveraged)}</span>
                      <span className="font-mono tabular-nums">Unrealized P&amp;L: {renderPnLValue(pnl.unrealized, isLeveraged)}</span>
                      <span className="font-mono tabular-nums">Combined P&amp;L: {renderPnLValue(pnl.combined, isLeveraged)}</span>
                    </div>
                    <div className="mt-2 flex gap-2 items-center flex-wrap">
                      <input
                        type="number"
                        placeholder="Current price"
                        value={currentPrices[position.id] ?? ''}
                        onChange={(e) => setCurrentPrices((prev) => ({ ...prev, [position.id]: e.target.value }))}
                        min="0"
                        step="any"
                        className="px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-sm w-32 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        onClick={(e) => e.preventDefault()}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleSetCurrentPrice(position.id)
                        }}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 cursor-pointer"
                      >
                        Set Price
                      </button>
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
