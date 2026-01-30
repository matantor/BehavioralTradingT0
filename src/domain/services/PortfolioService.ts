// PortfolioService: domain service for Position operations
// Per TASKLIST Part 2: Portfolio lifecycle, accounting, P&L, and history
// Services call repositories only, no direct storage access

import type { Position } from '@/domain/types/entities'
import type { RefreshResult } from '@/domain/types/pricing'
import { PositionRepository } from '@/domain/repositories/PositionRepository'
import { JournalRepository } from '@/domain/repositories/JournalRepository'
import { PricingService } from './PricingService'

// P&L result types
export interface PnLResult {
  realized: number
  unrealized: number | null  // null if no current price or leveraged
  combined: number | null    // null if unrealized is null
}

export interface PortfolioTotals {
  totalValue: number         // sum of (qty * currentPrice) for spot open positions with price
  totalCostBasis: number     // sum of (qty * avgCost) for spot open positions
  unrealizedPnL: number | null  // null if any position missing currentPrice
  realizedPnL: number        // sum of realized P&L across all tickers
  combinedPnL: number | null    // null if unrealized is null
  positionCount: number      // number of open spot positions
}

export interface HistoricalSnapshot {
  date: string               // ISO8601 date
  portfolioValue: number     // total portfolio value at this point
  cumulativePnL: number      // cumulative P&L up to this point
}

export interface PortfolioViewPosition {
  position: Position
  isLeveraged: boolean
  pnl: PnLResult
  marketPriceStatus: { price: number | null; isStale: boolean }
  effectivePrice: { price: number | null; source: 'manual' | 'market' | 'none'; isStale: boolean }
}

export interface PortfolioView {
  positions: PortfolioViewPosition[]
  totals: PortfolioTotals
  lastRefreshed: string | null
}

class PortfolioServiceClass {
  /**
   * List all positions (non-archived), regardless of open/closed status
   */
  list(includeArchived = false): Position[] {
    return PositionRepository.list(includeArchived)
  }

  /**
   * List open positions only (qty > 0)
   * Per TASKLIST 2.2: Position is open if quantity ≠ 0
   */
  listOpen(includeArchived = false): Position[] {
    return this.list(includeArchived).filter(p => p.quantity > 0)
  }

  /**
   * List closed positions only (qty === 0)
   * Per TASKLIST 2.2: Position is closed if quantity = 0
   */
  listClosed(includeArchived = false): Position[] {
    return this.list(includeArchived).filter(p => p.quantity === 0)
  }

  /**
   * Get a position by ID
   */
  get(id: string): Position | null {
    return PositionRepository.getById(id)
  }

  /**
   * Create a position
   */
  create(
    payload: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>
  ): Position {
    return PositionRepository.create(payload)
  }

  /**
   * Update a position
   */
  update(id: string, patch: Partial<Position>): Position {
    const existing = PositionRepository.getById(id)
    if (!existing) {
      throw new Error(`Position ${id} not found`)
    }

    // If ticker changes or clears, invalidate cached market price for the old ticker
    if (patch.ticker !== undefined && patch.ticker !== existing.ticker) {
      PricingService.invalidatePrice(existing.ticker)
    }

    return PositionRepository.update(id, patch)
  }

  /**
   * Archive a position (soft delete)
   */
  archive(id: string): void {
    PositionRepository.archive(id)
  }

  /**
   * Set the manual current price for a position
   * Per TASKLIST 2.5: current price is manual for now
   */
  setCurrentPrice(positionId: string, price: number): Position {
    if (price < 0) {
      throw new Error('Price cannot be negative')
    }
    return PositionRepository.update(positionId, { currentPrice: price })
  }

  /**
   * Get market price from price cache for a position
   * Returns null if not in cache
   */
  getMarketPrice(position: Position): number | null {
    return PricingService.getMarketPrice(position)
  }

  /**
   * Get market price with staleness indicator
   */
  getMarketPriceWithStatus(position: Position): { price: number | null; isStale: boolean } {
    return PricingService.getMarketPriceWithStatus(position)
  }

  /**
   * Get effective price for P&L calculations
   * Per approved architecture: Manual price always wins
   * Falls back to market price if no manual price set
   */
  getEffectivePrice(position: Position): number | null {
    // Manual price takes priority
    if (position.currentPrice !== undefined) {
      return position.currentPrice
    }
    // Fall back to market price
    return PricingService.getMarketPrice(position)
  }

  /**
   * Get effective price with source indicator
   */
  getEffectivePriceWithSource(position: Position): {
    price: number | null
    source: 'manual' | 'market' | 'none'
    isStale: boolean
  } {
    if (position.currentPrice !== undefined) {
      return { price: position.currentPrice, source: 'manual', isStale: false }
    }
    const marketStatus = PricingService.getMarketPriceWithStatus(position)
    if (marketStatus.price !== null) {
      return { price: marketStatus.price, source: 'market', isStale: marketStatus.isStale }
    }
    return { price: null, source: 'none', isStale: false }
  }

  /**
   * Derived portfolio view model for UI consumption
   */
  getPortfolioView(options?: { status?: 'open' | 'closed' | 'all' }): PortfolioView {
    const status = options?.status ?? 'open'
    const positions =
      status === 'closed'
        ? this.listClosed()
        : status === 'all'
          ? this.list()
          : this.listOpen()

    const viewPositions = positions.map((position) => ({
      position,
      isLeveraged: this.isLeveraged(position),
      pnl: this.getCombinedPnL(position),
      marketPriceStatus: this.getMarketPriceWithStatus(position),
      effectivePrice: this.getEffectivePriceWithSource(position),
    }))

    return {
      positions: viewPositions,
      totals: this.getPortfolioTotals(),
      lastRefreshed: PricingService.getLastRefreshed(),
    }
  }

  /**
   * Refresh market prices for open positions (or provided list)
   */
  async refreshMarketPrices(positions?: Position[]): Promise<RefreshResult> {
    const targets = positions ?? this.listOpen()
    return PricingService.refreshAll(targets)
  }

  /**
   * Check if a position is leveraged (created via long/short action)
   * Per TASKLIST: leveraged positions exist separately, P&L = N/A
   */
  isLeveraged(position: Position): boolean {
    return position.meta?.leveraged === true
  }

  /**
   * Check if a position is a cash position (deposit/withdraw)
   * Cash positions are excluded from P&L calculations
   */
  isCash(position: Position): boolean {
    return position.assetType === 'cash' || position.ticker === 'USD'
  }

  /**
   * Get unrealized P&L for a position
   * Returns null if:
   * - Position is leveraged (P&L = N/A)
   * - Position has no currentPrice set
   * - Position is cash
   */
  getUnrealizedPnL(position: Position): number | null {
    if (this.isLeveraged(position) || this.isCash(position)) {
      return null
    }
    if (position.currentPrice === undefined) {
      return null
    }
    // Unrealized P&L = (currentPrice - avgCost) * quantity
    return (position.currentPrice - position.avgCost) * position.quantity
  }

  /**
   * Get realized P&L for a ticker via avg-cost ledger replay
   * Per TASKLIST 2.4: realized P&L derived from journal history
   * Only processes buy/sell entries (not deposit/withdraw/long/short)
   *
   * Algorithm:
   * 1. Get all buy/sell journal entries for the ticker, sorted by entryTime
   * 2. Replay through entries:
   *    - Buy: adds to holdings, updates avg cost
   *    - Sell: realizes profit/loss based on avg cost at time of sale
   */
  getRealizedPnL(ticker: string): number {
    const entries = JournalRepository.list(true) // include archived for complete history
      .filter(e =>
        e.ticker.toUpperCase() === ticker.toUpperCase() &&
        (e.actionType === 'buy' || e.actionType === 'sell')
      )
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())

    let holdings = 0
    let avgCost = 0
    let realizedPnL = 0

    for (const entry of entries) {
      if (entry.actionType === 'buy') {
        // Update average cost: weighted average
        const totalCost = holdings * avgCost + entry.quantity * entry.price
        holdings += entry.quantity
        avgCost = holdings > 0 ? totalCost / holdings : 0
      } else if (entry.actionType === 'sell') {
        // Realize P&L at current avg cost
        const profit = (entry.price - avgCost) * entry.quantity
        realizedPnL += profit
        holdings -= entry.quantity
        // avgCost remains the same after sell (FIFO-like behavior with avg cost)
      }
    }

    return realizedPnL
  }

  /**
   * Get combined P&L (realized + unrealized) for a position
   * Returns null if unrealized cannot be calculated
   */
  getCombinedPnL(position: Position): PnLResult {
    const realized = this.getRealizedPnL(position.ticker)
    const unrealized = this.getUnrealizedPnL(position)

    return {
      realized,
      unrealized,
      combined: unrealized !== null ? realized + unrealized : null
    }
  }

  /**
   * Get portfolio totals for all open spot positions
   * Per TASKLIST 2.4: P&L shown for entire portfolio
   * Excludes: leveraged positions, cash positions
   */
  getPortfolioTotals(): PortfolioTotals {
    const openPositions = this.listOpen()
    const spotPositions = openPositions.filter(p => !this.isLeveraged(p) && !this.isCash(p))

    let totalValue = 0
    let totalCostBasis = 0
    let unrealizedPnL: number | null = 0
    let realizedPnL = 0

    // Track tickers we've already computed realized P&L for (avoid double counting)
    const processedTickers = new Set<string>()

    for (const position of spotPositions) {
      // Cost basis
      totalCostBasis += position.quantity * position.avgCost

      // Current value (requires currentPrice)
      if (position.currentPrice !== undefined) {
        totalValue += position.quantity * position.currentPrice
      }

      // Unrealized P&L
      const posUnrealized = this.getUnrealizedPnL(position)
      if (posUnrealized === null) {
        unrealizedPnL = null // Any missing price nullifies total unrealized
      } else if (unrealizedPnL !== null) {
        unrealizedPnL += posUnrealized
      }

      // Realized P&L (once per ticker)
      if (!processedTickers.has(position.ticker.toUpperCase())) {
        realizedPnL += this.getRealizedPnL(position.ticker)
        processedTickers.add(position.ticker.toUpperCase())
      }
    }

    // Also add realized P&L from closed positions (tickers not in open positions)
    const closedPositions = this.listClosed()
    for (const position of closedPositions) {
      if (this.isLeveraged(position) || this.isCash(position)) continue
      if (!processedTickers.has(position.ticker.toUpperCase())) {
        realizedPnL += this.getRealizedPnL(position.ticker)
        processedTickers.add(position.ticker.toUpperCase())
      }
    }

    return {
      totalValue,
      totalCostBasis,
      unrealizedPnL,
      realizedPnL,
      combinedPnL: unrealizedPnL !== null ? realizedPnL + unrealizedPnL : null,
      positionCount: spotPositions.length
    }
  }

  /**
   * Get historical snapshots for portfolio value and P&L over time
   * Per TASKLIST 2.6: Historical graph data (returns data only, no charts)
   *
   * Timeline starts from first recorded journal entry.
   * Closed positions continue to affect history.
   */
  getHistoricalSnapshots(): HistoricalSnapshot[] {
    // Get all journal entries sorted by entryTime
    const entries = JournalRepository.list(true)
      .filter(e => e.actionType === 'buy' || e.actionType === 'sell')
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())

    if (entries.length === 0) {
      return []
    }

    const snapshots: HistoricalSnapshot[] = []

    // Track holdings and avg costs per ticker
    const holdings: Record<string, { qty: number; avgCost: number }> = {}
    let cumulativePnL = 0

    for (const entry of entries) {
      const ticker = entry.ticker.toUpperCase()

      if (!holdings[ticker]) {
        holdings[ticker] = { qty: 0, avgCost: 0 }
      }

      if (entry.actionType === 'buy') {
        const h = holdings[ticker]
        const totalCost = h.qty * h.avgCost + entry.quantity * entry.price
        h.qty += entry.quantity
        h.avgCost = h.qty > 0 ? totalCost / h.qty : 0
      } else if (entry.actionType === 'sell') {
        const h = holdings[ticker]
        const profit = (entry.price - h.avgCost) * entry.quantity
        cumulativePnL += profit
        h.qty -= entry.quantity
      }

      // Calculate portfolio value at this point using entry prices as proxy
      // (since we don't have historical prices, use avgCost as value proxy)
      let portfolioValue = 0
      for (const t of Object.keys(holdings)) {
        const h = holdings[t]
        // Use the last known price for this ticker from current entry if matches,
        // otherwise use avgCost as conservative estimate
        const price = t === ticker ? entry.price : h.avgCost
        portfolioValue += h.qty * price
      }

      snapshots.push({
        date: entry.entryTime,
        portfolioValue,
        cumulativePnL
      })
    }

    return snapshots
  }
}

export const PortfolioService = new PortfolioServiceClass()
