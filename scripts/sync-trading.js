#!/usr/bin/env node
/**
 * Trading Bot Sync Script
 * Updates the tradingBot section of state.json
 * 
 * Usage: node scripts/sync-trading.js [options]
 * 
 * Options:
 *   --status <status>      Set bot status (Active, Idle, Error)
 *   --pnl <amount>         Set 24h PnL
 *   --signal <json>        Add/update active signal
 *   --order <json>         Add/update open order
 *   --fill <json>          Add trade fill to history
 *   --balances <json>      Update Coinbase balances
 *   --activity <message>   Add activity log entry
 *   --settings <json>      Update strategy settings
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error('Error loading state:', e.message);
    process.exit(1);
  }
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('✓ State updated:', STATE_FILE);
}

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[++i];
      args[key] = value;
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  const state = loadState();
  
  if (!state.tradingBot) {
    state.tradingBot = {};
  }
  
  // Update status
  if (args.status) {
    state.tradingBot.status = args.status;
  }
  
  // Update PnL
  if (args.pnl) {
    state.tradingBot.pnl24h = args.pnl;
  }
  
  if (args['total-pnl']) {
    state.tradingBot.totalPnl = args['total-pnl'];
  }
  
  if (args['win-rate']) {
    state.tradingBot.winRate = args['win-rate'];
  }
  
  // Update balances
  if (args.balances) {
    state.tradingBot.balances = JSON.parse(args.balances);
  }
  
  // Add/update signal
  if (args.signal) {
    const signal = JSON.parse(args.signal);
    if (!state.tradingBot.signals) state.tradingBot.signals = [];
    
    const idx = state.tradingBot.signals.findIndex(s => s.pair === signal.pair);
    if (idx >= 0) {
      state.tradingBot.signals[idx] = signal;
    } else {
      state.tradingBot.signals.push(signal);
    }
  }
  
  // Remove signal
  if (args['remove-signal']) {
    if (state.tradingBot.signals) {
      state.tradingBot.signals = state.tradingBot.signals.filter(
        s => s.pair !== args['remove-signal']
      );
    }
  }
  
  // Add/update order
  if (args.order) {
    const order = JSON.parse(args.order);
    order.timestamp = order.timestamp || new Date().toISOString();
    if (!state.tradingBot.openOrders) state.tradingBot.openOrders = [];
    
    const idx = state.tradingBot.openOrders.findIndex(o => o.orderId === order.orderId);
    if (idx >= 0) {
      state.tradingBot.openOrders[idx] = order;
    } else {
      state.tradingBot.openOrders.push(order);
    }
  }
  
  // Remove order
  if (args['remove-order']) {
    if (state.tradingBot.openOrders) {
      state.tradingBot.openOrders = state.tradingBot.openOrders.filter(
        o => o.orderId !== args['remove-order']
      );
    }
  }
  
  // Add fill
  if (args.fill) {
    const fill = JSON.parse(args.fill);
    fill.timestamp = fill.timestamp || new Date().toISOString();
    if (!state.tradingBot.tradeHistory) state.tradingBot.tradeHistory = [];
    state.tradingBot.tradeHistory.unshift(fill);
    state.tradingBot.tradeHistory = state.tradingBot.tradeHistory.slice(0, 100);
    
    // Update today's stats
    if (!state.tradingBot.todayStats) {
      state.tradingBot.todayStats = { trades: 0, volume: 0, fees: 0 };
    }
    state.tradingBot.todayStats.trades++;
    state.tradingBot.todayStats.volume += fill.total || 0;
    state.tradingBot.todayStats.fees += fill.fee || 0;
    state.tradingBot.trades24h = state.tradingBot.todayStats.trades;
  }
  
  // Add activity
  if (args.activity) {
    const activity = {
      type: args['activity-type'] || 'info',
      message: args.activity,
      timestamp: new Date().toISOString()
    };
    if (!state.tradingBot.recentActivity) state.tradingBot.recentActivity = [];
    state.tradingBot.recentActivity.unshift(activity);
    state.tradingBot.recentActivity = state.tradingBot.recentActivity.slice(0, 50);
  }
  
  // Update settings
  if (args.settings) {
    state.tradingBot.settings = {
      ...state.tradingBot.settings,
      ...JSON.parse(args.settings)
    };
  }
  
  saveState(state);
}

main();
