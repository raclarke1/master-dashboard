// Index page (Macro Overview) logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadMarketData();
  await loadCryptoData();
  await loadBotState();
  updateTimestamp();

  // Set up refresh intervals
  setInterval(loadMarketData, CONFIG.refreshInterval);
  setInterval(loadCryptoData, CONFIG.refreshInterval);
  setInterval(loadBotState, CONFIG.stateRefreshInterval);
});

async function loadMarketData() {
  const symbols = CONFIG.tickers.map(t => t.symbol);
  const quotes = await API.fetchQuotes(symbols);
  
  // Update summary stats
  if (quotes['VOO']) {
    updateStat('spy', quotes['VOO']);
  }
  if (quotes['TLT']) {
    updateStat('tlt', quotes['TLT']);
  }

  // Build ticker table
  const tbody = document.getElementById('tickerTableBody');
  if (!tbody) return;

  tbody.innerHTML = CONFIG.tickers.map(ticker => {
    const quote = quotes[ticker.symbol];
    const price = quote ? formatPrice(quote.price) : '--';
    const change = quote ? quote.change.toFixed(2) : '--';
    const changePercent = quote ? formatPercent(quote.changePercent) : '--';
    const changeClass = quote ? getChangeClass(quote.change) : '';
    const chartUrl = CONFIG.tradingViewUrl + ticker.symbol;

    return `
      <tr>
        <td>
          <a href="${chartUrl}" target="_blank" class="ticker-symbol">${ticker.symbol}</a>
        </td>
        <td>
          <span class="ticker-name">${ticker.name}</span>
        </td>
        <td class="text-right">${price}</td>
        <td class="text-right ${changeClass}">${change !== '--' ? (quote.change >= 0 ? '+' : '') + change : '--'}</td>
        <td class="text-right ${changeClass}">${changePercent}</td>
        <td class="text-right">
          <a href="${chartUrl}" target="_blank" class="badge badge-info">📈 Chart</a>
        </td>
      </tr>
    `;
  }).join('');

  updateTimestamp();
}

async function loadCryptoData() {
  const ids = CONFIG.cryptoTickers.map(t => t.coingeckoId);
  const prices = await API.fetchCryptoPrices(ids);

  // Update BTC/ETH summary stats
  if (prices.bitcoin) {
    document.getElementById('btc-price').textContent = formatPrice(prices.bitcoin.usd);
    const btcChange = document.getElementById('btc-change');
    btcChange.textContent = formatPercent(prices.bitcoin.usd_24h_change);
    btcChange.className = 'stat-change ' + getChangeClass(prices.bitcoin.usd_24h_change);
  }
  
  if (prices.ethereum) {
    document.getElementById('eth-price').textContent = formatPrice(prices.ethereum.usd);
    const ethChange = document.getElementById('eth-change');
    ethChange.textContent = formatPercent(prices.ethereum.usd_24h_change);
    ethChange.className = 'stat-change ' + getChangeClass(prices.ethereum.usd_24h_change);
  }

  // Build crypto grid
  const grid = document.getElementById('cryptoGrid');
  if (!grid) return;

  grid.innerHTML = CONFIG.cryptoTickers.map(crypto => {
    const data = prices[crypto.coingeckoId];
    const price = data ? formatPrice(data.usd) : '--';
    const change = data ? data.usd_24h_change : null;
    const changeStr = formatPercent(change);
    const changeClass = getChangeClass(change);

    return `
      <div class="crypto-card">
        <div class="crypto-header">
          <span class="crypto-symbol">${crypto.symbol}</span>
          <span class="text-muted">${crypto.name}</span>
        </div>
        <div class="crypto-price">${price}</div>
        <div class="crypto-change ${changeClass}">${changeStr}</div>
      </div>
    `;
  }).join('');
}

async function loadBotState() {
  const state = await API.fetchState();
  if (!state) return;

  // Update DeFi Bot
  if (state.defiBot) {
    const statusEl = document.getElementById('defi-status');
    statusEl.textContent = state.defiBot.status || 'Unknown';
    statusEl.className = 'badge ' + getStatusBadgeClass(state.defiBot.status);
    
    const pnlEl = document.getElementById('defi-pnl');
    pnlEl.textContent = state.defiBot.pnl24h || '--';
    pnlEl.className = 'bot-stat-value ' + getChangeClass(parseFloat(state.defiBot.pnl24h));
    
    document.getElementById('defi-positions').textContent = state.defiBot.openPositions || '0';
  }

  // Update Momentum Bot
  if (state.momentumBot) {
    const statusEl = document.getElementById('momentum-status');
    statusEl.textContent = state.momentumBot.status || 'Unknown';
    statusEl.className = 'badge ' + getStatusBadgeClass(state.momentumBot.status);
    
    document.getElementById('momentum-pnl').textContent = state.momentumBot.pnl24h || '--';
    document.getElementById('momentum-signals').textContent = state.momentumBot.activeSignals || '0';
  }

  // Update Trading Bot
  if (state.tradingBot) {
    const statusEl = document.getElementById('trading-status');
    statusEl.textContent = state.tradingBot.status || 'Unknown';
    statusEl.className = 'badge ' + getStatusBadgeClass(state.tradingBot.status);
    
    const pnlEl = document.getElementById('trading-pnl');
    pnlEl.textContent = state.tradingBot.pnl24h || '--';
    pnlEl.className = 'bot-stat-value ' + getChangeClass(parseFloat(state.tradingBot.pnl24h));
    
    document.getElementById('trading-trades').textContent = state.tradingBot.trades24h || '0';
  }
}

function updateStat(prefix, quote) {
  const priceEl = document.getElementById(`${prefix}-price`);
  const changeEl = document.getElementById(`${prefix}-change`);
  
  if (priceEl) priceEl.textContent = formatPrice(quote.price);
  if (changeEl) {
    changeEl.textContent = formatPercent(quote.changePercent);
    changeEl.className = 'stat-change ' + getChangeClass(quote.change);
  }
}

function getStatusBadgeClass(status) {
  if (!status) return 'badge-info';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'running') return 'badge-success';
  if (s === 'idle' || s === 'paused') return 'badge-warning';
  if (s === 'error' || s === 'stopped') return 'badge-danger';
  return 'badge-info';
}
