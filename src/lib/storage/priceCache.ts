// Price Cache Storage - Separate from main app data
// Per approved architecture: uses bt_price_cache localStorage key

import type { PriceCache, CachedPrice } from '@/domain/types/pricing'

const PRICE_CACHE_KEY = 'bt_price_cache'
const CACHE_SCHEMA_VERSION = 1

// Default empty cache
function getDefaultCache(): PriceCache {
  return {
    schemaVersion: 1,
    prices: {},
    lastRefreshAttempt: null,
    lastSuccessfulRefresh: null,
  }
}

// Load price cache from localStorage
export function loadPriceCache(): PriceCache {
  try {
    const raw = localStorage.getItem(PRICE_CACHE_KEY)
    if (!raw) {
      return getDefaultCache()
    }
    const parsed = JSON.parse(raw) as PriceCache
    // Future-proof: handle schema migrations if needed
    if (parsed.schemaVersion !== CACHE_SCHEMA_VERSION) {
      // For now, just return fresh cache on version mismatch
      return getDefaultCache()
    }
    return parsed
  } catch (error) {
    console.error('Failed to load price cache:', error)
    return getDefaultCache()
  }
}

// Save price cache to localStorage
export function savePriceCache(cache: PriceCache): void {
  try {
    const serialized = JSON.stringify(cache)
    localStorage.setItem(PRICE_CACHE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save price cache:', error)
    // Don't throw - price cache is non-critical
  }
}

// Get a single cached price by ticker
export function getCachedPrice(ticker: string): CachedPrice | null {
  const cache = loadPriceCache()
  const normalizedTicker = ticker.toUpperCase()
  return cache.prices[normalizedTicker] ?? null
}

// Set a single cached price
export function setCachedPrice(price: CachedPrice): void {
  const cache = loadPriceCache()
  const normalizedTicker = price.ticker.toUpperCase()
  cache.prices[normalizedTicker] = {
    ...price,
    ticker: normalizedTicker,
  }
  savePriceCache(cache)
}

// Set multiple cached prices at once
export function setCachedPrices(prices: CachedPrice[]): void {
  const cache = loadPriceCache()
  for (const price of prices) {
    const normalizedTicker = price.ticker.toUpperCase()
    cache.prices[normalizedTicker] = {
      ...price,
      ticker: normalizedTicker,
    }
  }
  savePriceCache(cache)
}

// Update refresh timestamps
export function updateRefreshTimestamp(success: boolean): void {
  const cache = loadPriceCache()
  const now = new Date().toISOString()
  cache.lastRefreshAttempt = now
  if (success) {
    cache.lastSuccessfulRefresh = now
  }
  savePriceCache(cache)
}

// Get last successful refresh timestamp
export function getLastRefreshTime(): string | null {
  const cache = loadPriceCache()
  return cache.lastSuccessfulRefresh
}

// Check if a cached price is expired
export function isCacheExpired(price: CachedPrice): boolean {
  const now = new Date().getTime()
  const expiresAt = new Date(price.expiresAt).getTime()
  return now > expiresAt
}

// Clear entire price cache
export function clearPriceCache(): void {
  try {
    localStorage.removeItem(PRICE_CACHE_KEY)
  } catch (error) {
    console.error('Failed to clear price cache:', error)
  }
}
