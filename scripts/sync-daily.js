#!/usr/bin/env node
/**
 * Daily Updates Sync Script
 * Updates the daily section of state.json
 * 
 * Usage: node scripts/sync-daily.js [options]
 * 
 * Options:
 *   --notes <text>           Set daily notes
 *   --mover <json>           Add market mover entry
 *   --event <json>           Add economic calendar event
 *   --senator-trade <json>   Add senator trade entry
 *   --clear-movers           Clear market movers
 *   --clear-events           Clear economic calendar
 *   --clear-senators         Clear senator trades
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
      // Check if next arg exists and isn't a flag
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args[key] = argv[++i];
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  const state = loadState();
  
  if (!state.daily) {
    state.daily = {
      date: new Date().toISOString().split('T')[0],
      notes: '',
      marketMovers: [],
      econCalendar: [],
      senatorTrades: []
    };
  }
  
  // Update date
  state.daily.date = new Date().toISOString().split('T')[0];
  
  // Update notes
  if (args.notes) {
    state.daily.notes = args.notes;
  }
  
  // Add market mover
  if (args.mover) {
    const mover = JSON.parse(args.mover);
    if (!state.daily.marketMovers) state.daily.marketMovers = [];
    state.daily.marketMovers.push(mover);
  }
  
  // Add economic event
  if (args.event) {
    const event = JSON.parse(args.event);
    if (!state.daily.econCalendar) state.daily.econCalendar = [];
    state.daily.econCalendar.push(event);
  }
  
  // Add senator trade
  if (args['senator-trade']) {
    const trade = JSON.parse(args['senator-trade']);
    if (!state.daily.senatorTrades) state.daily.senatorTrades = [];
    state.daily.senatorTrades.unshift(trade);
    // Keep last 50
    state.daily.senatorTrades = state.daily.senatorTrades.slice(0, 50);
  }
  
  // Clear options
  if (args['clear-movers']) {
    state.daily.marketMovers = [];
  }
  
  if (args['clear-events']) {
    state.daily.econCalendar = [];
  }
  
  if (args['clear-senators']) {
    state.daily.senatorTrades = [];
  }
  
  saveState(state);
}

main();
