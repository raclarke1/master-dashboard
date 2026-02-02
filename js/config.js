// Master Dashboard Configuration

const CONFIG = {
  // Refresh intervals (ms)
  refreshInterval: 60000, // 1 minute for price updates
  stateRefreshInterval: 30000, // 30 seconds for bot state

  // Traditional market tickers with metadata
  tickers: [
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'Large Cap' },
    { symbol: 'MGK', name: 'Vanguard Mega Cap Growth', category: 'Large Cap Growth' },
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation', category: 'Dividend' },
    { symbol: 'VOT', name: 'Vanguard Mid-Cap Growth', category: 'Mid Cap' },
    { symbol: 'VO', name: 'Vanguard Mid-Cap', category: 'Mid Cap' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate', category: 'REIT' },
    { symbol: 'PAVE', name: 'Global X US Infrastructure', category: 'Infrastructure' },
    { symbol: 'SLV', name: 'iShares Silver Trust', category: 'Commodities' },
    { symbol: 'VBK', name: 'Vanguard Small-Cap Growth', category: 'Small Cap' },
    { symbol: 'VB', name: 'Vanguard Small-Cap', category: 'Small Cap' },
    { symbol: 'VWO', name: 'Vanguard Emerging Markets', category: 'International' },
    { symbol: 'ARKK', name: 'ARK Innovation ETF', category: 'Innovation' },
    { symbol: 'GDX', name: 'VanEck Gold Miners', category: 'Gold Miners' },
    { symbol: 'GDXJ', name: 'VanEck Junior Gold Miners', category: 'Gold Miners' },
    { symbol: 'SILJ', name: 'ETFMG Prime Junior Silver', category: 'Silver Miners' },
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury', category: 'Bonds' },
    { symbol: 'ARKG', name: 'ARK Genomic Revolution', category: 'Biotech' },
    { symbol: 'IBB', name: 'iShares Biotechnology', category: 'Biotech' },
    { symbol: 'XLE', name: 'Energy Select Sector SPDR', category: 'Energy' }
  ],

  // Crypto tickers
  cryptoTickers: [
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' },
    { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple' },
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
    { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano' },
    { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2' },
    { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink' }
  ],

  // TradingView chart base URL
  tradingViewUrl: 'https://www.tradingview.com/chart/?symbol=',

  // State file location (for GitHub Pages, we'll use a JSON endpoint)
  stateUrl: 'state.json'
};

// Utility functions
function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return '--';
  return price >= 1000 
    ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + price.toFixed(2);
}

function formatChange(change, percent) {
  if (change === null || change === undefined) return '--';
  const sign = change >= 0 ? '+' : '';
  const changeStr = sign + change.toFixed(2);
  const percentStr = sign + percent.toFixed(2) + '%';
  return `${changeStr} (${percentStr})`;
}

function formatPercent(percent) {
  if (percent === null || percent === undefined) return '--';
  const sign = percent >= 0 ? '+' : '';
  return sign + percent.toFixed(2) + '%';
}

function getChangeClass(change) {
  if (change === null || change === undefined || change === 0) return 'price-neutral';
  return change > 0 ? 'price-positive' : 'price-negative';
}

function formatTimestamp(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateTimestamp() {
  const el = document.getElementById('lastUpdate');
  if (el) {
    el.textContent = 'Updated: ' + formatTimestamp(new Date());
  }
}
