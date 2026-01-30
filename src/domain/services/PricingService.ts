// PricingService: domain service for market price operations
// Per approved Data & Pricing Architecture v1
// Fetches, caches, and exposes market prices without modifying Position entities

import type { Position } from '@/domain/types/entities'
import type {
  CachedPrice,
  AssetType,
  RefreshResult,
  PriceProvider,
  ProviderQuote,
  PriceProviderName,
} from '@/domain/types/pricing'
import { CACHE_TTL } from '@/domain/types/pricing'
import {
  getCachedPrice,
  setCachedPrices,
  updateRefreshTimestamp,
  getLastRefreshTime,
  isCacheExpired,
  removeCachedPrice,
} from '@/lib/storage/priceCache'
import { yahooFinanceProvider } from '@/domain/providers/YahooFinanceProvider'
import { alphaVantageProvider } from '@/domain/providers/AlphaVantageProvider'
import { coinGeckoProvider } from '@/domain/providers/CoinGeckoProvider'

const ALPHA_VANTAGE_MAX_PER_REFRESH = 5

function isAlphaEnabled(provider: PriceProvider): boolean {
  const maybe = provider as PriceProvider & { isEnabled?: () => boolean }
  return typeof maybe.isEnabled === 'function' ? maybe.isEnabled() : true
}

function isEquityLike(assetType: AssetType): boolean {
  return assetType === 'equity' || assetType === 'etf'
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
    try {
      let quote: ProviderQuote | null = null
      let providerName: PriceProviderName | null = null

      if (isEquityLike(assetType)) {
        try {
          quote = await yahooFinanceProvider.fetchQuote(ticker)
          providerName = yahooFinanceProvider.name
        } catch (error) {
          if (isAlphaEnabled(alphaVantageProvider)) {
            quote = await alphaVantageProvider.fetchQuote(ticker)
            providerName = alphaVantageProvider.name
          } else {
            throw error
          }
        }
      } else if (coinGeckoProvider.supports(assetType)) {
        quote = await coinGeckoProvider.fetchQuote(ticker)
        providerName = coinGeckoProvider.name
      } else {
        console.warn(`No provider supports asset type: ${assetType}`)
        return null
      }

      if (!quote || !providerName) {
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
        provider: providerName,
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
      const tickers = assetPositions.map(p => p.ticker)

      if (isEquityLike(assetType)) {
        const newPrices: CachedPrice[] = []
        let yahooQuotes: Map<string, ProviderQuote> = new Map()
        let yahooFailed = false

        try {
          yahooQuotes = await yahooFinanceProvider.fetchQuotes(tickers)
        } catch (error) {
          yahooFailed = true
        }

        const missingPositions = assetPositions.filter(
          pos => !yahooQuotes.has(pos.ticker.toUpperCase())
        )

        const alphaQuotes = new Map<string, ProviderQuote>()
        if (yahooFailed && isAlphaEnabled(alphaVantageProvider) && missingPositions.length > 0) {
          const capped = missingPositions.slice(0, ALPHA_VANTAGE_MAX_PER_REFRESH)
          const skipped = missingPositions.slice(ALPHA_VANTAGE_MAX_PER_REFRESH)
          for (const pos of skipped) {
            result.skipped.push(pos.ticker)
          }

          for (const pos of capped) {
            try {
              const quote = await alphaVantageProvider.fetchQuote(pos.ticker)
              if (quote) {
                alphaQuotes.set(pos.ticker.toUpperCase(), quote)
              }
            } catch (error) {
              // Ignore per-ticker errors; handled below
            }
          }
        }

        for (const pos of assetPositions) {
          const ticker = pos.ticker.toUpperCase()
          const yahooQuote = yahooQuotes.get(ticker)
          const alphaQuote = alphaQuotes.get(ticker)
          const quote = yahooQuote ?? alphaQuote
          if (quote) {
            const ttl = CACHE_TTL[assetType] ?? CACHE_TTL.other
            const expiresAt = new Date(now.getTime() + ttl)
            newPrices.push({
              ticker,
              assetType,
              price: quote.price,
              currency: quote.currency,
              provider: yahooQuote ? yahooFinanceProvider.name : alphaVantageProvider.name,
              fetchedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            })
            result.success.push(pos.ticker)
          } else if (!result.skipped.includes(pos.ticker)) {
            result.failed.push(pos.ticker)
          }
        }

        if (newPrices.length > 0) {
          setCachedPrices(newPrices)
        }
        continue
      }

      if (!coinGeckoProvider.supports(assetType)) {
        for (const pos of assetPositions) {
          result.failed.push(pos.ticker)
        }
        continue
      }

      try {
        const quotes = await coinGeckoProvider.fetchQuotes(tickers)
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
              provider: coinGeckoProvider.name,
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

  /**
   * Invalidate cached price for a ticker
   */
  invalidatePrice(ticker: string): void {
    removeCachedPrice(ticker)
  }
}

export const PricingService = new PricingServiceClass()
