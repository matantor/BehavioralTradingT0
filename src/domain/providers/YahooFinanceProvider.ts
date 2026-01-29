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
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(`Yahoo Finance API returned ${response.status}`)
        return results
      }

      const data: YahooQuoteResponse = await response.json()

      if (data.quoteResponse.error) {
        console.warn('Yahoo Finance API error:', data.quoteResponse.error)
        return results
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
      console.warn('Yahoo Finance fetch failed:', error)
      // Return empty results on network/parse error
    }

    return results
  }
}

// Singleton instance
export const yahooFinanceProvider = new YahooFinanceProvider()
