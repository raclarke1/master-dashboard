// Daily page logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadDailyData();
  await loadBotActivity();
  updateTimestamp();

  setInterval(loadDailyData, CONFIG.refreshInterval);
  setInterval(loadBotActivity, CONFIG.stateRefreshInterval);
});

async function loadDailyData() {
  // Load state for daily notes and activity
  const state = await API.fetchState();
  
  if (state && state.daily) {
    // Update market movers
    if (state.daily.marketMovers) {
      updateMarketMovers(state.daily.marketMovers);
    }
    
    // Update economic calendar
    if (state.daily.econCalendar) {
      updateEconCalendar(state.daily.econCalendar);
    }
    
    // Update senator trades
    if (state.daily.senatorTrades) {
      updateSenatorTrades(state.daily.senatorTrades);
    }
    
    // Update daily notes
    if (state.daily.notes) {
      document.getElementById('dailyNotes').innerHTML = `<p>${state.daily.notes}</p>`;
    }
  }
  
  updateTimestamp();
}

async function loadBotActivity() {
  const state = await API.fetchState();
  if (!state) return;
  
  const activities = [];
  
  // Collect activities from all bots
  if (state.defiBot && state.defiBot.recentActivity) {
    state.defiBot.recentActivity.forEach(a => {
      activities.push({ ...a, bot: 'DeFi Bot', icon: '💰' });
    });
  }
  
  if (state.momentumBot && state.momentumBot.recentActivity) {
    state.momentumBot.recentActivity.forEach(a => {
      activities.push({ ...a, bot: 'Momentum Bot', icon: '📈' });
    });
  }
  
  if (state.tradingBot && state.tradingBot.recentActivity) {
    state.tradingBot.recentActivity.forEach(a => {
      activities.push({ ...a, bot: 'Trading Bot', icon: '🤖' });
    });
  }
  
  // Sort by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Render activity feed
  const activityEl = document.getElementById('botActivity');
  if (activities.length === 0) {
    activityEl.innerHTML = `
      <li class="activity-item">
        <div class="activity-icon" style="background: rgba(163, 113, 247, 0.15);">🔄</div>
        <div class="activity-content">
          <div class="activity-text">No recent activity</div>
          <div class="activity-time">--</div>
        </div>
      </li>
    `;
    return;
  }
  
  activityEl.innerHTML = activities.slice(0, 20).map(a => `
    <li class="activity-item">
      <div class="activity-icon" style="background: rgba(163, 113, 247, 0.15);">${a.icon}</div>
      <div class="activity-content">
        <div class="activity-text"><strong>${a.bot}:</strong> ${a.message}</div>
        <div class="activity-time">${formatTimestamp(a.timestamp)}</div>
      </div>
    </li>
  `).join('');
}

function updateMarketMovers(movers) {
  const el = document.getElementById('marketMovers');
  if (!movers || movers.length === 0) {
    el.innerHTML = `
      <li class="activity-item">
        <div class="activity-icon" style="background: rgba(63, 185, 80, 0.15);">📈</div>
        <div class="activity-content">
          <div class="activity-text">No significant movers today</div>
          <div class="activity-time">--</div>
        </div>
      </li>
    `;
    return;
  }
  
  el.innerHTML = movers.map(m => `
    <li class="activity-item">
      <div class="activity-icon" style="background: ${m.change >= 0 ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)'};">
        ${m.change >= 0 ? '📈' : '📉'}
      </div>
      <div class="activity-content">
        <div class="activity-text">
          <strong>${m.symbol}</strong> ${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}%
        </div>
        <div class="activity-time">${m.reason || ''}</div>
      </div>
    </li>
  `).join('');
}

function updateEconCalendar(events) {
  const el = document.getElementById('econCalendar');
  if (!events || events.length === 0) {
    el.innerHTML = `
      <li class="activity-item">
        <div class="activity-icon" style="background: rgba(88, 166, 255, 0.15);">📆</div>
        <div class="activity-content">
          <div class="activity-text">No events today</div>
          <div class="activity-time">--</div>
        </div>
      </li>
    `;
    return;
  }
  
  el.innerHTML = events.map(e => `
    <li class="activity-item">
      <div class="activity-icon" style="background: rgba(88, 166, 255, 0.15);">📆</div>
      <div class="activity-content">
        <div class="activity-text">${e.event}</div>
        <div class="activity-time">${e.time} - ${e.impact || 'Low'} Impact</div>
      </div>
    </li>
  `).join('');
}

function updateSenatorTrades(trades) {
  const tbody = document.getElementById('senatorTradesBody');
  if (!trades || trades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No recent senator trades</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = trades.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.senator}</td>
      <td><a href="${CONFIG.tradingViewUrl}${t.ticker}" target="_blank" class="ticker-symbol">${t.ticker}</a></td>
      <td class="${t.type === 'Buy' ? 'trade-buy' : 'trade-sell'}">${t.type}</td>
      <td>${t.amount}</td>
      <td class="text-muted">${t.description || '--'}</td>
    </tr>
  `).join('');
}
