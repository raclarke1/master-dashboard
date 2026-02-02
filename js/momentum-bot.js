// Momentum Bot page logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadMomentumBotState();
  updateTimestamp();

  setInterval(loadMomentumBotState, CONFIG.stateRefreshInterval);
});

async function loadMomentumBotState() {
  const state = await API.fetchState();
  if (!state || !state.momentumBot) return;

  const bot = state.momentumBot;

  // Update status cards
  updateStatus('momentum-bot-status', bot.status);
  document.getElementById('momentum-total-pnl').textContent = bot.totalPnl || '--';
  document.getElementById('momentum-win-rate').textContent = bot.winRate || '--';
  document.getElementById('momentum-active-signals').textContent = bot.activeSignals || '0';

  // Update active signals
  updateActiveSignals(bot.signals);

  // Update watchlist
  updateWatchlist(bot.watchlist);

  // Update strategy settings
  if (bot.settings) {
    if (bot.settings.timeframes) {
      document.getElementById('tf-primary').textContent = bot.settings.timeframes.primary || '4H';
      document.getElementById('tf-secondary').textContent = bot.settings.timeframes.secondary || '1D';
      document.getElementById('tf-confirm').textContent = bot.settings.timeframes.confirmation || '1H';
    }
    if (bot.settings.indicators) {
      document.getElementById('rsi-period').textContent = bot.settings.indicators.rsiPeriod || '14';
      document.getElementById('macd-fast').textContent = bot.settings.indicators.macdFast || '12';
      document.getElementById('macd-slow').textContent = bot.settings.indicators.macdSlow || '26';
    }
    if (bot.settings.risk) {
      document.getElementById('max-position').textContent = bot.settings.risk.maxPosition || '5%';
      document.getElementById('stop-loss').textContent = bot.settings.risk.stopLoss || '2%';
      document.getElementById('take-profit').textContent = bot.settings.risk.takeProfit || '6%';
    }
  }

  // Update closed trades
  updateClosedTrades(bot.closedTrades);

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

function updateActiveSignals(signals) {
  const tbody = document.getElementById('activeSignals');
  if (!signals || signals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No active signals</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = signals.map(s => {
    const dirClass = s.direction === 'LONG' ? 'text-green' : 'text-red';
    const strengthClass = getStrengthClass(s.strength);
    
    return `
      <tr>
        <td><a href="${CONFIG.tradingViewUrl}${s.symbol}" target="_blank" class="ticker-symbol">${s.symbol}</a></td>
        <td class="${dirClass}">${s.direction}</td>
        <td class="text-right">${formatPrice(s.entry)}</td>
        <td class="text-right">${formatPrice(s.current)}</td>
        <td class="text-right">${formatPrice(s.target)}</td>
        <td class="text-right">${formatPrice(s.stop)}</td>
        <td><span class="badge ${strengthClass}">${s.strength}</span></td>
      </tr>
    `;
  }).join('');
}

function updateWatchlist(watchlist) {
  const tbody = document.getElementById('watchlist');
  if (!watchlist || watchlist.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No setups in watchlist</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = watchlist.map(w => `
    <tr>
      <td><a href="${CONFIG.tradingViewUrl}${w.symbol}" target="_blank" class="ticker-symbol">${w.symbol}</a></td>
      <td>${w.setup}</td>
      <td class="text-right">${formatPrice(w.price)}</td>
      <td class="text-right">${w.rsi || '--'}</td>
      <td class="text-right">${w.macd || '--'}</td>
      <td class="text-muted">${w.notes || '--'}</td>
    </tr>
  `).join('');
}

function updateClosedTrades(trades) {
  const tbody = document.getElementById('closedTrades');
  if (!trades || trades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No closed trades</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = trades.slice(0, 20).map(t => {
    const dirClass = t.direction === 'LONG' ? 'text-green' : 'text-red';
    const pnlClass = t.pnl >= 0 ? 'text-green' : 'text-red';
    
    return `
      <tr>
        <td>${t.date}</td>
        <td><a href="${CONFIG.tradingViewUrl}${t.symbol}" target="_blank" class="ticker-symbol">${t.symbol}</a></td>
        <td class="${dirClass}">${t.direction}</td>
        <td class="text-right">${formatPrice(t.entry)}</td>
        <td class="text-right">${formatPrice(t.exit)}</td>
        <td class="text-right ${pnlClass}">${t.pnl >= 0 ? '+' : ''}${formatPrice(t.pnl)}</td>
        <td class="text-right">${t.rr || '--'}</td>
      </tr>
    `;
  }).join('');
}

function getStrengthClass(strength) {
  if (!strength) return 'badge-info';
  const s = strength.toLowerCase();
  if (s === 'strong' || s === 'high') return 'badge-success';
  if (s === 'medium' || s === 'moderate') return 'badge-warning';
  if (s === 'weak' || s === 'low') return 'badge-danger';
  return 'badge-info';
}
