// DeFi Bot page logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadDeFiBotState();
  updateTimestamp();

  setInterval(loadDeFiBotState, CONFIG.stateRefreshInterval);
});

async function loadDeFiBotState() {
  const state = await API.fetchState();
  if (!state || !state.defiBot) return;

  const bot = state.defiBot;

  // Update status cards
  updateStatus('defi-bot-status', bot.status);
  document.getElementById('defi-total-pnl').textContent = bot.totalPnl || '--';
  document.getElementById('defi-24h-pnl').textContent = bot.pnl24h || '--';
  document.getElementById('defi-open-positions').textContent = bot.openPositions || '0';

  // Update wallet balances
  if (bot.wallets) {
    if (bot.wallets.main) {
      document.getElementById('sol-main').textContent = bot.wallets.main.sol || '--';
      document.getElementById('usdc-main').textContent = bot.wallets.main.usdc || '--';
    }
    if (bot.wallets.drift) {
      document.getElementById('sol-drift').textContent = bot.wallets.drift.sol || '--';
      document.getElementById('usdc-drift').textContent = bot.wallets.drift.usdc || '--';
    }
  }

  // Update Drift account
  if (bot.driftAccount) {
    document.getElementById('drift-collateral').textContent = bot.driftAccount.freeCollateral || '--';
    document.getElementById('drift-margin').textContent = bot.driftAccount.marginUsed || '--';
    document.getElementById('drift-upnl').textContent = bot.driftAccount.unrealizedPnl || '--';
  }

  // Update open positions
  updatePositions(bot.positions);

  // Update recent trades
  updateTrades(bot.trades);

  // Update activity log
  updateActivityLog(bot.recentActivity);

  updateTimestamp();
}

function updateStatus(elementId, status) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.textContent = status || 'Unknown';
  
  // Apply color based on status
  const s = (status || '').toLowerCase();
  el.classList.remove('text-green', 'text-yellow', 'text-red');
  
  if (s === 'active' || s === 'running') {
    el.classList.add('text-green');
  } else if (s === 'idle' || s === 'paused') {
    el.classList.add('text-yellow');
  } else if (s === 'error' || s === 'stopped') {
    el.classList.add('text-red');
  }
}

function updatePositions(positions) {
  const tbody = document.getElementById('openPositions');
  if (!positions || positions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No open positions</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = positions.map(p => {
    const pnlClass = p.pnl >= 0 ? 'text-green' : 'text-red';
    const sideClass = p.side === 'LONG' ? 'text-green' : 'text-red';
    
    return `
      <tr>
        <td><strong>${p.market}</strong></td>
        <td class="${sideClass}">${p.side}</td>
        <td class="text-right">${p.size}</td>
        <td class="text-right">${formatPrice(p.entryPrice)}</td>
        <td class="text-right">${formatPrice(p.markPrice)}</td>
        <td class="text-right ${pnlClass}">${p.pnl >= 0 ? '+' : ''}${formatPrice(p.pnl)}</td>
        <td class="text-right text-muted">${formatPrice(p.liquidationPrice)}</td>
      </tr>
    `;
  }).join('');
}

function updateTrades(trades) {
  const tbody = document.getElementById('recentTrades');
  if (!trades || trades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No recent trades</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = trades.slice(0, 20).map(t => {
    const sideClass = t.side === 'BUY' || t.side === 'LONG' ? 'text-green' : 'text-red';
    const pnlClass = t.pnl >= 0 ? 'text-green' : 'text-red';
    
    return `
      <tr>
        <td>${formatTimestamp(t.timestamp)}</td>
        <td><strong>${t.market}</strong></td>
        <td class="${sideClass}">${t.side}</td>
        <td class="text-right">${t.size}</td>
        <td class="text-right">${formatPrice(t.price)}</td>
        <td class="text-right ${pnlClass}">${t.pnl !== undefined ? (t.pnl >= 0 ? '+' : '') + formatPrice(t.pnl) : '--'}</td>
      </tr>
    `;
  }).join('');
}

function updateActivityLog(activities) {
  const el = document.getElementById('defiActivityLog');
  if (!activities || activities.length === 0) {
    el.innerHTML = `
      <li class="activity-item">
        <div class="activity-icon" style="background: rgba(88, 166, 255, 0.15);">ℹ️</div>
        <div class="activity-content">
          <div class="activity-text">Waiting for activity...</div>
          <div class="activity-time">--</div>
        </div>
      </li>
    `;
    return;
  }

  el.innerHTML = activities.slice(0, 15).map(a => {
    const icon = getActivityIcon(a.type);
    const bgColor = getActivityBgColor(a.type);
    
    return `
      <li class="activity-item">
        <div class="activity-icon" style="background: ${bgColor};">${icon}</div>
        <div class="activity-content">
          <div class="activity-text">${a.message}</div>
          <div class="activity-time">${formatTimestamp(a.timestamp)}</div>
        </div>
      </li>
    `;
  }).join('');
}

function getActivityIcon(type) {
  const icons = {
    trade: '💹',
    position: '📊',
    liquidation: '⚠️',
    error: '❌',
    info: 'ℹ️',
    profit: '💰',
    loss: '📉'
  };
  return icons[type] || 'ℹ️';
}

function getActivityBgColor(type) {
  const colors = {
    trade: 'rgba(88, 166, 255, 0.15)',
    position: 'rgba(163, 113, 247, 0.15)',
    liquidation: 'rgba(210, 153, 34, 0.15)',
    error: 'rgba(248, 81, 73, 0.15)',
    info: 'rgba(88, 166, 255, 0.15)',
    profit: 'rgba(63, 185, 80, 0.15)',
    loss: 'rgba(248, 81, 73, 0.15)'
  };
  return colors[type] || 'rgba(88, 166, 255, 0.15)';
}
