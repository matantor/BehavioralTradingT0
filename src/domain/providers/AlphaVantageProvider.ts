// Alpha Vantage Provider for Stocks and ETFs
// Uses Alpha Vantage public API (www.alphavantage.co)

import type { PriceProvider, ProviderQuote, AssetType } from '@/domain/types/pricing'

interface AlphaVantageQuoteResponse {
  ['Global Quote']?: {
    ['01. symbol']?: string
    ['05. price']?: string
    ['07. latest trading day']?: string
  }
  ['Note']?: string
  ['Error Message']?: string
}

function readEnvVar(key: string): string | undefined {
  const env = import.meta as unknown as { env?: Record<string, string | undefined> }
  return env.env?.[key]
}

export class AlphaVantageProvider implements PriceProvider {
  name = 'alphavantage' as const
  private readonly baseUrl = 'https://www.alphavantage.co/query'
  private readonly apiKey = readEnvVar('VITE_ALPHA_VANTAGE_KEY')

  supports(assetType: AssetType): boolean {
    return assetType === 'equity' || assetType === 'etf'
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey)
  }

  async fetchQuote(ticker: string): Promise<ProviderQuote | null> {
    if (!this.apiKey) {
      return null
    }

    const symbol = ticker.toUpperCase()
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(this.apiKey)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Alpha Vantage API returned ${response.status}`)
    }

    const data: AlphaVantageQuoteResponse = await response.json()
    if (data['Note'] || data['Error Message']) {
      return null
    }

    const quote = data['Global Quote']
    if (!quote) {
      return null
    }

    const priceValue = quote['05. price']
    const price = priceValue ? Number(priceValue) : NaN
    if (!Number.isFinite(price)) {
      return null
    }

    const timestamp = quote['07. latest trading day']
    const isoTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()

    return {
      ticker: symbol,
      price,
      currency: 'USD',
      timestamp: isoTimestamp,
    }
  }

  async fetchQuotes(tickers: string[]): Promise<Map<string, ProviderQuote>> {
    const results = new Map<string, ProviderQuote>()
    if (!this.apiKey || tickers.length === 0) {
      return results
    }

    for (const ticker of tickers) {
      const quote = await this.fetchQuote(ticker)
      if (quote) {
        results.set(quote.ticker.toUpperCase(), quote)
      }
    }

    return results
  }
}

export const alphaVantageProvider = new AlphaVantageProvider()
