// API handlers for market data

// Yahoo Finance API via a CORS proxy or direct call
// Note: For GitHub Pages, we'll use a free CORS proxy or fallback to cached data

const API = {
  // Fetch Yahoo Finance quote data
  // Uses the Yahoo Finance v8 API
  async fetchQuote(symbol) {
    try {
      // Use a CORS proxy for client-side requests
      const corsProxy = 'https://corsproxy.io/?';
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      
      const response = await fetch(corsProxy + encodeURIComponent(yahooUrl));
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;
        
        return {
          symbol: symbol,
          price: price,
          change: change,
          changePercent: changePercent,
          volume: quote.volume ? quote.volume[quote.volume.length - 1] : null,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow,
          marketState: meta.marketState
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return null;
    }
  },

  // Fetch multiple quotes
  async fetchQuotes(symbols) {
    const results = {};
    
    // Batch requests (5 at a time to avoid rate limiting)
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(s => this.fetchQuote(s));
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach((result, idx) => {
        if (result) {
          results[batch[idx]] = result;
        }
      });
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
    return results;
  },

  // Fetch crypto prices from CoinGecko (free, no API key needed)
  async fetchCryptoPrices(ids) {
    try {
      const idsParam = ids.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return {};
    }
  },

  // Fetch dashboard state
  async fetchState() {
    try {
      const response = await fetch(CONFIG.stateUrl + '?t=' + Date.now());
      if (!response.ok) throw new Error('State not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching state:', error);
      return null;
    }
  }
};

// Export for use in other scripts
window.API = API;
