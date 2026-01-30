// Yahoo Finance Provider for Stocks and ETFs
// Uses Yahoo Finance public API (query1.finance.yahoo.com)

import type { PriceProvider, ProviderQuote, AssetType } from '@/domain/types/pricing'

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string
      regularMarketPrice: number
      regularMarketTime: number
      currency: string
    }>
    error: null | { code: string; description: string }
  }
}

export class YahooFinanceProvider implements PriceProvider {
  name = 'yahoo' as const

  private readonly baseUrl = '/api/yahoo'
  private readonly isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true

  supports(assetType: AssetType): boolean {
    return assetType === 'equity' || assetType === 'etf'
  }

  async fetchQuote(ticker: string): Promise<ProviderQuote | null> {
    const quotes = await this.fetchQuotes([ticker])
    return quotes.get(ticker.toUpperCase()) ?? null
  }

  async fetchQuotes(tickers: string[]): Promise<Map<string, ProviderQuote>> {
    const results = new Map<string, ProviderQuote>()

    if (tickers.length === 0) {
      return results
    }

    // Normalize tickers to uppercase
    const normalizedTickers = tickers.map(t => t.toUpperCase())
    const symbols = normalizedTickers.join(',')

    try {
      // Yahoo Finance API endpoint
      const url = `${this.baseUrl}/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`

      if (this.isDev) {
        console.info('[YahooFinanceProvider] fetchQuotes URL:', url)
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (this.isDev) {
        console.info('[YahooFinanceProvider] status:', response.status)
      }

      if (!response.ok) {
        const error = new Error(`Yahoo Finance API returned ${response.status}`)
        ;(error as { status?: number }).status = response.status
        throw error
      }

      const data: YahooQuoteResponse = await response.json()

      if (data.quoteResponse.error) {
        const error = new Error(`Yahoo Finance API error: ${data.quoteResponse.error.code}`)
        throw error
      }

      for (const quote of data.quoteResponse.result) {
        if (quote.regularMarketPrice != null) {
          results.set(quote.symbol.toUpperCase(), {
            ticker: quote.symbol.toUpperCase(),
            price: quote.regularMarketPrice,
            currency: quote.currency || 'USD',
            timestamp: new Date(quote.regularMarketTime * 1000).toISOString(),
          })
        }
      }
    } catch (error) {
      if (this.isDev) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn('[YahooFinanceProvider] fetch failed:', message)
      } else {
        console.warn('Yahoo Finance fetch failed:', error)
      }
      // Return empty results on network/parse error
    }

    return results
  }
}

// Singleton instance
export const yahooFinanceProvider = new YahooFinanceProvider()
