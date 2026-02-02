#!/usr/bin/env node
/**
 * Momentum Bot Sync Script
 * Updates the momentumBot section of state.json
 * 
 * Usage: node scripts/sync-momentum.js [options]
 * 
 * Options:
 *   --status <status>      Set bot status (Active, Idle, Error)
 *   --pnl <amount>         Set 24h PnL
 *   --signal <json>        Add/update active signal
 *   --watchlist <json>     Add/update watchlist item
 *   --close-trade <json>   Add closed trade to history
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
  
  if (!state.momentumBot) {
    state.momentumBot = {};
  }
  
  // Update status
  if (args.status) {
    state.momentumBot.status = args.status;
  }
  
  // Update PnL
  if (args.pnl) {
    state.momentumBot.pnl24h = args.pnl;
  }
  
  if (args['total-pnl']) {
    state.momentumBot.totalPnl = args['total-pnl'];
  }
  
  if (args['win-rate']) {
    state.momentumBot.winRate = args['win-rate'];
  }
  
  // Add/update signal
  if (args.signal) {
    const signal = JSON.parse(args.signal);
    if (!state.momentumBot.signals) state.momentumBot.signals = [];
    
    const idx = state.momentumBot.signals.findIndex(s => s.symbol === signal.symbol);
    if (idx >= 0) {
      state.momentumBot.signals[idx] = signal;
    } else {
      state.momentumBot.signals.push(signal);
    }
    state.momentumBot.activeSignals = state.momentumBot.signals.length;
  }
  
  // Remove signal
  if (args['remove-signal']) {
    if (state.momentumBot.signals) {
      state.momentumBot.signals = state.momentumBot.signals.filter(
        s => s.symbol !== args['remove-signal']
      );
      state.momentumBot.activeSignals = state.momentumBot.signals.length;
    }
  }
  
  // Add/update watchlist item
  if (args.watchlist) {
    const item = JSON.parse(args.watchlist);
    if (!state.momentumBot.watchlist) state.momentumBot.watchlist = [];
    
    const idx = state.momentumBot.watchlist.findIndex(w => w.symbol === item.symbol);
    if (idx >= 0) {
      state.momentumBot.watchlist[idx] = item;
    } else {
      state.momentumBot.watchlist.push(item);
    }
  }
  
  // Add closed trade
  if (args['close-trade']) {
    const trade = JSON.parse(args['close-trade']);
    trade.date = trade.date || new Date().toISOString().split('T')[0];
    if (!state.momentumBot.closedTrades) state.momentumBot.closedTrades = [];
    state.momentumBot.closedTrades.unshift(trade);
    state.momentumBot.closedTrades = state.momentumBot.closedTrades.slice(0, 100);
  }
  
  // Add activity
  if (args.activity) {
    const activity = {
      type: args['activity-type'] || 'info',
      message: args.activity,
      timestamp: new Date().toISOString()
    };
    if (!state.momentumBot.recentActivity) state.momentumBot.recentActivity = [];
    state.momentumBot.recentActivity.unshift(activity);
    state.momentumBot.recentActivity = state.momentumBot.recentActivity.slice(0, 50);
  }
  
  // Update settings
  if (args.settings) {
    state.momentumBot.settings = {
      ...state.momentumBot.settings,
      ...JSON.parse(args.settings)
    };
  }
  
  saveState(state);
}

main();
