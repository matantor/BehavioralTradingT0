// CoinGecko Provider for Cryptocurrency
// Uses CoinGecko public API (api.coingecko.com)

import type { PriceProvider, ProviderQuote, AssetType } from '@/domain/types/pricing'

// Common ticker -> CoinGecko ID mapping
// User enters familiar tickers; we normalize to CoinGecko IDs internally
const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'ATOM': 'cosmos',
  'UNI': 'uniswap',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'EOS': 'eos',
  'XTZ': 'tezos',
  'THETA': 'theta-token',
  'XMR': 'monero',
  'NEO': 'neo',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'SUSHI': 'sushi',
  'YFI': 'yearn-finance',
  'CRV': 'curve-dao-token',
  '1INCH': '1inch',
  'ENJ': 'enjincoin',
  'BAT': 'basic-attention-token',
  'ZEC': 'zcash',
  'DASH': 'dash',
  'WAVES': 'waves',
  'ZIL': 'zilliqa',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'GALA': 'gala',
  'ENS': 'ethereum-name-service',
  'LDO': 'lido-dao',
  'APE': 'apecoin',
  'SHIB': 'shiba-inu',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'SUI': 'sui',
  'APT': 'aptos',
  'PEPE': 'pepe',
}

interface CoinGeckoSimplePriceResponse {
  [coinId: string]: {
    usd: number
    usd_24h_change?: number
    last_updated_at?: number
  }
}

export class CoinGeckoProvider implements PriceProvider {
  name = 'coingecko' as const

  supports(assetType: AssetType): boolean {
    return assetType === 'crypto'
  }

  // Normalize user ticker to CoinGecko ID
  private tickerToId(ticker: string): string | null {
    const normalized = ticker.toUpperCase()
    return TICKER_TO_COINGECKO_ID[normalized] ?? null
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

    // Map tickers to CoinGecko IDs, filtering out unknown ones
    const tickerIdPairs: Array<{ ticker: string; id: string }> = []
    for (const ticker of tickers) {
      const id = this.tickerToId(ticker)
      if (id) {
        tickerIdPairs.push({ ticker: ticker.toUpperCase(), id })
      } else {
        console.warn(`Unknown crypto ticker: ${ticker}. Add to TICKER_TO_COINGECKO_ID mapping.`)
      }
    }

    if (tickerIdPairs.length === 0) {
      return results
    }

    const ids = tickerIdPairs.map(p => p.id).join(',')

    try {
      // CoinGecko simple price endpoint
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_last_updated_at=true`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(`CoinGecko API returned ${response.status}`)
        return results
      }

      const data: CoinGeckoSimplePriceResponse = await response.json()

      // Map results back to tickers
      for (const { ticker, id } of tickerIdPairs) {
        const priceData = data[id]
        if (priceData && priceData.usd != null) {
          const timestamp = priceData.last_updated_at
            ? new Date(priceData.last_updated_at * 1000).toISOString()
            : new Date().toISOString()

          results.set(ticker, {
            ticker,
            price: priceData.usd,
            currency: 'USD',
            timestamp,
          })
        }
      }
    } catch (error) {
      console.warn('CoinGecko fetch failed:', error)
      // Return empty results on network/parse error
    }

    return results
  }
}

// Singleton instance
export const coinGeckoProvider = new CoinGeckoProvider()

// Export helper for checking if a ticker is recognized
export function isKnownCryptoTicker(ticker: string): boolean {
  return ticker.toUpperCase() in TICKER_TO_COINGECKO_ID
}
