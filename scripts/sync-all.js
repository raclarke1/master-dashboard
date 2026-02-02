#!/usr/bin/env node
/**
 * Master Dashboard - Sync All Data Sources
 * Pulls from DeFi bot, Trading bot, Senator trades, and price APIs
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIR = join(__dirname, '..');

// Source paths
const SOURCES = {
  defiBot: join(process.env.HOME, 'clawd/defi-bot/dashboard/state.json'),
  tradingBot: join(process.env.HOME, 'clawd/jarvis-live/state.json'),
  senatorTrades: join(process.env.HOME, 'clawd/senator-trades')
};

/**
 * Fetch crypto prices from CoinGecko
 */
async function fetchCryptoPrices() {
  console.log('📊 Fetching crypto prices from CoinGecko...');
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,ripple,sui,ethereum&vs_currencies=usd&include_24hr_change=true'
    );
    const data = await response.json();
    
    return {
      BTC: { price: data.bitcoin?.usd || 0, change24h: parseFloat((data.bitcoin?.usd_24h_change || 0).toFixed(2)) },
      ETH: { price: data.ethereum?.usd || 0, change24h: parseFloat((data.ethereum?.usd_24h_change || 0).toFixed(2)) },
      SOL: { price: data.solana?.usd || 0, change24h: parseFloat((data.solana?.usd_24h_change || 0).toFixed(2)) },
      XRP: { price: data.ripple?.usd || 0, change24h: parseFloat((data.ripple?.usd_24h_change || 0).toFixed(2)) },
      SUI: { price: data.sui?.usd || 0, change24h: parseFloat((data.sui?.usd_24h_change || 0).toFixed(2)) }
    };
  } catch (e) {
    console.error('  ❌ Failed to fetch crypto prices:', e.message);
    return null;
  }
}

/**
 * Load DeFi bot state
 */
async function loadDefiBot() {
  console.log('💹 Loading DeFi bot state...');
  try {
    if (!existsSync(SOURCES.defiBot)) {
      console.log('  ⚠️ DeFi bot state not found');
      return null;
    }
    const data = JSON.parse(await readFile(SOURCES.defiBot, 'utf8'));
    
    return {
      status: data.status || 'UNKNOWN',
      version: data.version || '?',
      equity: data.drift?.equity || 0,
      leverage: data.drift?.leverage || 0,
      totalCollateral: data.drift?.totalCollateral || 0,
      freeCollateral: data.drift?.freeCollateral || 0,
      unrealizedPnl: data.drift?.unrealizedPnl || 0,
      wallets: data.wallets || [],
      positions: data.drift?.positions || [],
      closedPositions: (data.drift?.closedPositions || []).slice(0, 5).map(p => ({
        asset: p.asset,
        direction: p.direction,
        pnl: p.pnl,
        closedAt: p.closedAt,
        reason: p.reason
      })),
      recentActivity: (data.activityLog || []).slice(0, 5)
    };
  } catch (e) {
    console.error('  ❌ Failed to load DeFi bot:', e.message);
    return null;
  }
}

/**
 * Load Trading bot state
 */
async function loadTradingBot() {
  console.log('📈 Loading Trading bot state...');
  try {
    if (!existsSync(SOURCES.tradingBot)) {
      console.log('  ⚠️ Trading bot state not found');
      return null;
    }
    const data = JSON.parse(await readFile(SOURCES.tradingBot, 'utf8'));
    
    return {
      status: data.mode?.toUpperCase() || 'UNKNOWN',
      version: data.version || '?',
      balance: data.account?.balance || 0,
      startingBalance: data.account?.startingBalance || 10000,
      totalPnl: (data.account?.balance || 0) - (data.account?.startingBalance || 10000),
      pnlPercent: (((data.account?.balance || 0) / (data.account?.startingBalance || 10000)) - 1) * 100,
      closedTrades: data.account?.closedTrades || 0,
      prices: data.prices || {},
      levels: data.levels || {},
      lastTrade: data.lastTrade || null,
      signal: data.status?.signal || '',
      nextAction: data.status?.nextAction || '',
      recentActivity: (data.activityLog || []).slice(0, 5)
    };
  } catch (e) {
    console.error('  ❌ Failed to load Trading bot:', e.message);
    return null;
  }
}

/**
 * Run senator trades scraper and get recent trades
 */
async function loadSenatorTrades() {
  console.log('🏛️ Loading Senator trades...');
  try {
    const scriptPath = join(SOURCES.senatorTrades, 'get-trades-data.js');
    if (!existsSync(scriptPath)) {
      console.log('  ⚠️ Senator trades scraper not found');
      return [];
    }
    
    const output = execSync(`node "${scriptPath}"`, { 
      cwd: SOURCES.senatorTrades,
      encoding: 'utf8',
      timeout: 60000
    });
    
    const trades = JSON.parse(output);
    console.log(`  ✅ Found ${trades.length} recent trades`);
    return trades;
  } catch (e) {
    console.error('  ❌ Failed to load Senator trades:', e.message);
    return [];
  }
}

/**
 * Load existing state
 */
async function loadExistingState() {
  const statePath = join(DASHBOARD_DIR, 'state.json');
  try {
    return JSON.parse(await readFile(statePath, 'utf8'));
  } catch (e) {
    return {};
  }
}

/**
 * Main sync function
 */
async function syncAll() {
  console.log('\n🔄 Master Dashboard - Sync All\n');
  console.log(`   ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })} MST\n`);
  console.log('─'.repeat(50));
  
  // Load existing state as fallback
  const existing = await loadExistingState();
  
  // Fetch all data in parallel
  const [cryptoPrices, defiBot, tradingBot, senatorTrades] = await Promise.all([
    fetchCryptoPrices(),
    loadDefiBot(),
    loadTradingBot(),
    loadSenatorTrades()
  ]);
  
  console.log('─'.repeat(50));
  
  // Build updated state
  const state = {
    lastUpdated: new Date().toISOString(),
    
    cryptoPrices: cryptoPrices || existing.cryptoPrices || {},
    
    defiBot: defiBot || existing.defiBot || { status: 'OFFLINE' },
    
    momentumBot: existing.momentumBot || {
      status: 'Idle',
      totalPnl: 0,
      activeSignals: 0,
      signals: [],
      watchlist: ['XRP', 'SOL', 'SUI'],
      recentActivity: []
    },
    
    tradingBot: tradingBot || existing.tradingBot || { status: 'OFFLINE' },
    
    daily: {
      date: new Date().toISOString().split('T')[0],
      notes: existing.daily?.notes || '',
      marketMovers: cryptoPrices ? [
        { ticker: 'BTC', move: `${cryptoPrices.BTC.change24h > 0 ? '+' : ''}${cryptoPrices.BTC.change24h}%`, note: `$${cryptoPrices.BTC.price.toLocaleString()}` },
        { ticker: 'ETH', move: `${cryptoPrices.ETH.change24h > 0 ? '+' : ''}${cryptoPrices.ETH.change24h}%`, note: `$${cryptoPrices.ETH.price.toLocaleString()}` },
        { ticker: 'SOL', move: `${cryptoPrices.SOL.change24h > 0 ? '+' : ''}${cryptoPrices.SOL.change24h}%`, note: `$${cryptoPrices.SOL.price}` }
      ] : existing.daily?.marketMovers || [],
      senatorTrades: senatorTrades.length > 0 ? senatorTrades : existing.daily?.senatorTrades || [],
      econCalendar: existing.daily?.econCalendar || []
    }
  };
  
  // Write updated state
  const statePath = join(DASHBOARD_DIR, 'state.json');
  await writeFile(statePath, JSON.stringify(state, null, 2));
  
  console.log('\n✅ State synced successfully!');
  console.log(`   Crypto: ${cryptoPrices ? '✓' : '✗'}`);
  console.log(`   DeFi Bot: ${defiBot ? '✓' : '✗'}`);
  console.log(`   Trading Bot: ${tradingBot ? '✓' : '✗'}`);
  console.log(`   Senator Trades: ${senatorTrades.length > 0 ? `✓ (${senatorTrades.length})` : '✗'}`);
  console.log(`\n   Output: ${statePath}\n`);
}

// Run
syncAll().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
