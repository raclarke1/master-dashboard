#!/usr/bin/env node
/**
 * DeFi Bot Sync Script
 * Updates the defiBot section of state.json
 * 
 * Usage: node scripts/sync-defi.js [options]
 * 
 * Options:
 *   --status <status>      Set bot status (Active, Idle, Error)
 *   --pnl <amount>         Set 24h PnL
 *   --position <json>      Add/update position (JSON string)
 *   --trade <json>         Add trade to history (JSON string)
 *   --activity <message>   Add activity log entry
 *   --wallet-main <json>   Update main wallet balances
 *   --wallet-drift <json>  Update drift wallet balances
 *   --drift-account <json> Update drift account stats
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
  
  if (!state.defiBot) {
    state.defiBot = {};
  }
  
  // Update status
  if (args.status) {
    state.defiBot.status = args.status;
  }
  
  // Update 24h PnL
  if (args.pnl) {
    state.defiBot.pnl24h = args.pnl;
  }
  
  // Update total PnL
  if (args['total-pnl']) {
    state.defiBot.totalPnl = args['total-pnl'];
  }
  
  // Add/update position
  if (args.position) {
    const position = JSON.parse(args.position);
    if (!state.defiBot.positions) state.defiBot.positions = [];
    
    // Replace existing or add new
    const idx = state.defiBot.positions.findIndex(p => p.market === position.market);
    if (idx >= 0) {
      state.defiBot.positions[idx] = position;
    } else {
      state.defiBot.positions.push(position);
    }
    state.defiBot.openPositions = state.defiBot.positions.length;
  }
  
  // Add trade
  if (args.trade) {
    const trade = JSON.parse(args.trade);
    trade.timestamp = trade.timestamp || new Date().toISOString();
    if (!state.defiBot.trades) state.defiBot.trades = [];
    state.defiBot.trades.unshift(trade);
    // Keep only last 100 trades
    state.defiBot.trades = state.defiBot.trades.slice(0, 100);
  }
  
  // Add activity
  if (args.activity) {
    const activity = {
      type: args['activity-type'] || 'info',
      message: args.activity,
      timestamp: new Date().toISOString()
    };
    if (!state.defiBot.recentActivity) state.defiBot.recentActivity = [];
    state.defiBot.recentActivity.unshift(activity);
    state.defiBot.recentActivity = state.defiBot.recentActivity.slice(0, 50);
  }
  
  // Update main wallet
  if (args['wallet-main']) {
    const wallet = JSON.parse(args['wallet-main']);
    if (!state.defiBot.wallets) state.defiBot.wallets = {};
    state.defiBot.wallets.main = wallet;
  }
  
  // Update drift wallet
  if (args['wallet-drift']) {
    const wallet = JSON.parse(args['wallet-drift']);
    if (!state.defiBot.wallets) state.defiBot.wallets = {};
    state.defiBot.wallets.drift = wallet;
  }
  
  // Update drift account
  if (args['drift-account']) {
    state.defiBot.driftAccount = JSON.parse(args['drift-account']);
  }
  
  saveState(state);
}

main();
