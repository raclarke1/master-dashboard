// Trading Bot page logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadTradingBotState();
  updateTimestamp();

  setInterval(loadTradingBotState, CONFIG.stateRefreshInterval);
});

async function loadTradingBotState() {
  const state = await API.fetchState();
  if (!state || !state.tradingBot) return;

  const bot = state.tradingBot;

  // Update status cards
  updateStatus('trading-bot-status', bot.status);
  document.getElementById('trading-total-pnl').textContent = bot.totalPnl || '--';
  document.getElementById('trading-24h-pnl').textContent = bot.pnl24h || '--';
  document.getElementById('trading-win-rate').textContent = bot.winRate || '--';

  // Update Coinbase balances
  if (bot.balances) {
    document.getElementById('cb-usd').textContent = formatPrice(bot.balances.usd);
    document.getElementById('cb-btc').textContent = bot.balances.btc || '--';
    document.getElementById('cb-btc-usd').textContent = formatPrice(bot.balances.btcUsd);
    document.getElementById('cb-eth').textContent = bot.balances.eth || '--';
    document.getElementById('cb-eth-usd').textContent = formatPrice(bot.balances.ethUsd);
  }

  // Update today's stats
  if (bot.todayStats) {
    document.getElementById('today-trades').textContent = bot.todayStats.trades || '0';
    document.getElementById('today-volume').textContent = formatPrice(bot.todayStats.volume);
    document.getElementById('today-fees').textContent = formatPrice(bot.todayStats.fees);
  }

  // Update active signals
  updateTradingSignals(bot.signals);

  // Update open orders
  updateOpenOrders(bot.openOrders);

  // Update trade history
  updateTradeHistory(bot.tradeHistory);

  // Update strategy settings
  if (bot.settings) {
    if (bot.settings.signal) {
      document.getElementById('signal-lookback').textContent = bot.settings.signal.lookback || '24h';
      document.getElementById('signal-threshold').textContent = bot.settings.signal.threshold || '2.5%';
      document.getElementById('signal-confirm').textContent = bot.settings.signal.confirmation || '15m';
    }
    if (bot.settings.risk) {
      document.getElementById('max-trade').textContent = formatPrice(bot.settings.risk.maxTradeSize);
      document.getElementById('daily-limit').textContent = formatPrice(bot.settings.risk.dailyLossLimit);
      document.getElementById('max-open').textContent = bot.settings.risk.maxOpenTrades || '3';
    }
  }

  // Update trading pairs
  if (bot.pairs) {
    const pairsEl = document.getElementById('tradingPairs');
    pairsEl.innerHTML = bot.pairs.map(p => `
      <li class="activity-item">
        <div class="activity-content">
          <div class="activity-text">${p}</div>
        </div>
      </li>
    `).join('');
  }

  updateTimestamp();
}

function updateStatus(elementId, status) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.textContent = status || 'Unknown';
  el.classList.remove('text-green', 'text-yellow', 'text-red');
  
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'running') {
    el.classList.add('text-green');
  } else if (s === 'idle' || s === 'paused') {
    el.classList.add('text-yellow');
  } else if (s === 'error' || s === 'stopped') {
    el.classList.add('text-red');
  }
}

function updateTradingSignals(signals) {
  const tbody = document.getElementById('tradingSignals');
  if (!signals || signals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No active signals</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = signals.map(s => {
    const signalClass = s.signal === 'BUY' ? 'text-green' : 'text-red';
    const statusBadge = getSignalStatusBadge(s.status);
    
    return `
      <tr>
        <td><strong>${s.pair}</strong></td>
        <td class="${signalClass}">${s.signal}</td>
        <td class="text-right">${formatPrice(s.entry)}</td>
        <td class="text-right">${formatPrice(s.current)}</td>
        <td class="text-right">${formatPrice(s.target)}</td>
        <td class="text-right">${formatPrice(s.stop)}</td>
        <td><span class="badge ${statusBadge.class}">${statusBadge.text}</span></td>
      </tr>
    `;
  }).join('');
}

function updateOpenOrders(orders) {
  const tbody = document.getElementById('openOrders');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No open orders</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const sideClass = o.side === 'BUY' ? 'text-green' : 'text-red';
    
    return `
      <tr>
        <td>${formatTimestamp(o.timestamp)}</td>
        <td><strong>${o.pair}</strong></td>
        <td class="${sideClass}">${o.side}</td>
        <td>${o.type}</td>
        <td class="text-right">${formatPrice(o.price)}</td>
        <td class="text-right">${o.size}</td>
        <td><span class="badge badge-warning">Pending</span></td>
      </tr>
    `;
  }).join('');
}

function updateTradeHistory(trades) {
  const tbody = document.getElementById('tradeHistory');
  if (!trades || trades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No recent trades</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = trades.slice(0, 20).map(t => {
    const sideClass = t.side === 'BUY' ? 'text-green' : 'text-red';
    
    return `
      <tr>
        <td>${formatTimestamp(t.timestamp)}</td>
        <td><strong>${t.pair}</strong></td>
        <td class="${sideClass}">${t.side}</td>
        <td class="text-right">${formatPrice(t.price)}</td>
        <td class="text-right">${t.size}</td>
        <td class="text-right">${formatPrice(t.total)}</td>
        <td class="text-right text-muted">${formatPrice(t.fee)}</td>
      </tr>
    `;
  }).join('');
}

function getSignalStatusBadge(status) {
  const statuses = {
    pending: { class: 'badge-warning', text: 'Pending' },
    active: { class: 'badge-success', text: 'Active' },
    filled: { class: 'badge-info', text: 'Filled' },
    cancelled: { class: 'badge-danger', text: 'Cancelled' },
    profit: { class: 'badge-success', text: 'Take Profit' },
    stopped: { class: 'badge-danger', text: 'Stopped Out' }
  };
  return statuses[status] || { class: 'badge-info', text: status || 'Unknown' };
}
