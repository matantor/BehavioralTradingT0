// PricingService: domain service for market price operations
// Per approved Data & Pricing Architecture v1
// Fetches, caches, and exposes market prices without modifying Position entities

import type { Position } from '@/domain/types/entities'
import type {
  CachedPrice,
  AssetType,
  RefreshResult,
  PriceProvider,
} from '@/domain/types/pricing'
import { CACHE_TTL } from '@/domain/types/pricing'
import {
  getCachedPrice,
  setCachedPrices,
  updateRefreshTimestamp,
  getLastRefreshTime,
  isCacheExpired,
} from '@/lib/storage/priceCache'
import { yahooFinanceProvider } from '@/domain/providers/YahooFinanceProvider'
import { coinGeckoProvider } from '@/domain/providers/CoinGeckoProvider'

// Provider registry
const providers: PriceProvider[] = [
  yahooFinanceProvider,
  coinGeckoProvider,
]

// Select provider based on asset type
function selectProvider(assetType: AssetType): PriceProvider | null {
  return providers.find(p => p.supports(assetType)) ?? null
}

// Map Position.assetType to our AssetType (handle undefined)
function normalizeAssetType(assetType: Position['assetType']): AssetType {
  if (!assetType) return 'other'
  return assetType
}

class PricingServiceClass {
  /**
   * Get cached price for a ticker
   * Returns null if not in cache
   */
  getPrice(ticker: string): CachedPrice | null {
    return getCachedPrice(ticker)
  }

  /**
   * Get cached price with staleness info
   */
  getPriceWithStatus(ticker: string): { price: CachedPrice | null; isStale: boolean } {
    const price = getCachedPrice(ticker)
    if (!price) {
      return { price: null, isStale: false }
    }
    return { price, isStale: isCacheExpired(price) }
  }

  /**
   * Get market price for a position (convenience method)
   * Uses cached price if available
   */
  getMarketPrice(position: Position): number | null {
    const cached = getCachedPrice(position.ticker)
    return cached?.price ?? null
  }

  /**
   * Get market price with staleness indicator
   */
  getMarketPriceWithStatus(position: Position): { price: number | null; isStale: boolean } {
    const cached = getCachedPrice(position.ticker)
    if (!cached) {
      return { price: null, isStale: false }
    }
    return { price: cached.price, isStale: isCacheExpired(cached) }
  }

  /**
   * Get last successful refresh timestamp
   */
  getLastRefreshed(): string | null {
    return getLastRefreshTime()
  }

  /**
   * Refresh price for a single ticker
   * Returns the new cached price or null on failure
   */
  async refreshPrice(ticker: string, assetType: AssetType): Promise<CachedPrice | null> {
    const provider = selectProvider(assetType)
    if (!provider) {
      console.warn(`No provider supports asset type: ${assetType}`)
      return null
    }

    try {
      const quote = await provider.fetchQuote(ticker)
      if (!quote) {
        return null
      }

      const now = new Date()
      const ttl = CACHE_TTL[assetType] ?? CACHE_TTL.other
      const expiresAt = new Date(now.getTime() + ttl)

      const cachedPrice: CachedPrice = {
        ticker: ticker.toUpperCase(),
        assetType,
        price: quote.price,
        currency: quote.currency,
        provider: provider.name,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }

      setCachedPrices([cachedPrice])
      updateRefreshTimestamp(true)

      return cachedPrice
    } catch (error) {
      console.warn(`Failed to refresh price for ${ticker}:`, error)
      updateRefreshTimestamp(false)
      return null
    }
  }

  /**
   * Refresh prices for multiple positions
   * Groups positions by provider for efficient batch requests
   */
  async refreshAll(positions: Position[]): Promise<RefreshResult> {
    const now = new Date()
    const result: RefreshResult = {
      success: [],
      failed: [],
      skipped: [],
      timestamp: now.toISOString(),
    }

    // Group positions by asset type (provider)
    const byAssetType = new Map<AssetType, Position[]>()
    for (const pos of positions) {
      // Skip positions without valid asset type or cash positions
      const assetType = normalizeAssetType(pos.assetType)
      if (assetType === 'cash') {
        result.skipped.push(pos.ticker)
        continue
      }

      // Check if already fresh
      const cached = getCachedPrice(pos.ticker)
      if (cached && !isCacheExpired(cached)) {
        result.skipped.push(pos.ticker)
        continue
      }

      const existing = byAssetType.get(assetType) ?? []
      existing.push(pos)
      byAssetType.set(assetType, existing)
    }

    // Fetch by provider
    for (const [assetType, assetPositions] of byAssetType) {
      const provider = selectProvider(assetType)
      if (!provider) {
        // No provider - mark all as failed
        for (const pos of assetPositions) {
          result.failed.push(pos.ticker)
        }
        continue
      }

      const tickers = assetPositions.map(p => p.ticker)

      try {
        const quotes = await provider.fetchQuotes(tickers)
        const newPrices: CachedPrice[] = []

        for (const pos of assetPositions) {
          const quote = quotes.get(pos.ticker.toUpperCase())
          if (quote) {
            const ttl = CACHE_TTL[assetType] ?? CACHE_TTL.other
            const expiresAt = new Date(now.getTime() + ttl)

            newPrices.push({
              ticker: pos.ticker.toUpperCase(),
              assetType,
              price: quote.price,
              currency: quote.currency,
              provider: provider.name,
              fetchedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            })
            result.success.push(pos.ticker)
          } else {
            result.failed.push(pos.ticker)
          }
        }

        if (newPrices.length > 0) {
          setCachedPrices(newPrices)
        }
      } catch (error) {
        console.warn(`Batch fetch failed for ${assetType}:`, error)
        for (const pos of assetPositions) {
          result.failed.push(pos.ticker)
        }
      }
    }

    // Update refresh timestamp
    const anySuccess = result.success.length > 0
    updateRefreshTimestamp(anySuccess)

    return result
  }

  /**
   * Check if any prices need refresh
   */
  needsRefresh(positions: Position[]): boolean {
    for (const pos of positions) {
      const assetType = normalizeAssetType(pos.assetType)
      if (assetType === 'cash') continue

      const cached = getCachedPrice(pos.ticker)
      if (!cached || isCacheExpired(cached)) {
        return true
      }
    }
    return false
  }
}

export const PricingService = new PricingServiceClass()
