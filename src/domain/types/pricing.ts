// Pricing Types for Market Data Integration
// Per approved Data & Pricing Architecture v1

// Asset types matching Position.assetType
export type AssetType = 'equity' | 'etf' | 'crypto' | 'cash' | 'other'

// Price provider identifier
export type PriceProviderName = 'yahoo' | 'alphavantage' | 'coingecko' | 'manual'

// Cached price record
export interface CachedPrice {
  ticker: string
  assetType: AssetType
  price: number
  currency: string          // 'USD' for v1
  provider: PriceProviderName
  fetchedAt: string         // ISO timestamp
  expiresAt: string         // ISO timestamp (staleness threshold)
}

// Price cache storage structure
export interface PriceCache {
  schemaVersion: 1
  prices: Record<string, CachedPrice>  // key = ticker (uppercase)
  lastRefreshAttempt: string | null    // ISO timestamp
  lastSuccessfulRefresh: string | null // ISO timestamp
}

// Refresh result for batch operations
export interface RefreshResult {
  success: string[]         // tickers updated
  failed: string[]          // tickers that failed
  skipped: string[]         // tickers already fresh
  timestamp: string
}

// Provider response (internal, normalized)
export interface ProviderQuote {
  ticker: string
  price: number
  currency: string
  timestamp: string         // provider's timestamp
}

// Provider interface
export interface PriceProvider {
  name: PriceProviderName
  supports(assetType: AssetType): boolean
  fetchQuote(ticker: string): Promise<ProviderQuote | null>
  fetchQuotes(tickers: string[]): Promise<Map<string, ProviderQuote>>
}

// Cache TTL configuration (milliseconds)
export const CACHE_TTL: Record<AssetType, number> = {
  equity: 15 * 60 * 1000,   // 15 minutes
  etf: 15 * 60 * 1000,      // 15 minutes
  crypto: 5 * 60 * 1000,    // 5 minutes (more volatile)
  cash: 24 * 60 * 60 * 1000, // 24 hours (cash is always 1:1)
  other: 60 * 60 * 1000,    // 1 hour fallback
}
