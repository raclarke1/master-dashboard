# Master Dashboard

A unified trading dashboard for monitoring traditional markets, crypto, and trading bots.

## Pages

- **Macro Overview** (`index.html`) - Market summary, traditional tickers, crypto prices, bot status
- **Daily Updates** (`daily.html`) - Market movers, economic calendar, senator trades, bot activity
- **DeFi Bot** (`defi-bot.html`) - Drift perps, wallet balances, positions, trade history
- **Momentum Bot** (`momentum-bot.html`) - Momentum signals, watchlist, strategy settings
- **Trading Bot** (`trading-bot.html`) - Coinbase spot trading, v3.2 signals, order book

## Live Demo

🌐 https://raclarke1.github.io/master-dashboard/

## Data Sources

- **Traditional Markets**: Yahoo Finance API (via CORS proxy)
- **Crypto**: CoinGecko API (free tier)
- **Bot State**: `state.json` (updated by sync scripts)

## Sync Scripts

Each bot can update its section of `state.json` using the sync scripts:

```bash
# DeFi Bot updates
node scripts/sync-defi.js --status "Active" --pnl "+$125.30"
node scripts/sync-defi.js --activity "Opened SOL-PERP long"
node scripts/sync-defi.js --position '{"market":"SOL-PERP","side":"LONG","size":"10","entryPrice":150.25}'

# Momentum Bot updates
node scripts/sync-momentum.js --status "Active"
node scripts/sync-momentum.js --signal '{"symbol":"AAPL","direction":"LONG","entry":185.00,"target":195.00,"stop":180.00,"strength":"Strong"}'

# Trading Bot updates
node scripts/sync-trading.js --status "Active" --pnl "+$89.45"
node scripts/sync-trading.js --fill '{"pair":"BTC-USD","side":"BUY","price":105000,"size":0.01,"total":1050,"fee":5.25}'

# Daily updates
node scripts/sync-daily.js --notes "Strong momentum in tech sector"
node scripts/sync-daily.js --senator-trade '{"date":"2025-01-20","senator":"Pelosi","ticker":"NVDA","type":"Buy","amount":"$500K-$1M"}'
```

## Ticker Watchlist

Traditional market tickers with TradingView chart links:
VOO, MGK, VIG, VOT, VO, VNQ, PAVE, SLV, VBK, VB, VWO, ARKK, GDX, GDXJ, SILJ, TLT, ARKG, IBB, XLE

## Local Development

Just open `index.html` in a browser. For best results, serve via a local server:

```bash
cd master-dashboard
python3 -m http.server 8080
# Open http://localhost:8080
```

## Deployment

The dashboard is designed for GitHub Pages:

1. Push changes to `main` branch
2. GitHub Pages automatically deploys from the root

## Design

- Dark theme inspired by Koyfin
- Responsive layout with CSS Grid
- Card-based sections
- Real-time price updates (1 min interval)
- Status badges for bot states

## File Structure

```
master-dashboard/
├── index.html          # Macro Overview page
├── daily.html          # Daily Updates page
├── defi-bot.html       # DeFi Bot page
├── momentum-bot.html   # Momentum Bot page
├── trading-bot.html    # Trading Bot page
├── state.json          # Bot state data
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # Configuration & tickers
│   ├── api.js          # API handlers
│   ├── index.js        # Macro page logic
│   ├── daily.js        # Daily page logic
│   ├── defi-bot.js     # DeFi Bot page logic
│   ├── momentum-bot.js # Momentum Bot page logic
│   └── trading-bot.js  # Trading Bot page logic
└── scripts/
    ├── sync-defi.js    # DeFi Bot sync script
    ├── sync-momentum.js # Momentum Bot sync script
    ├── sync-trading.js # Trading Bot sync script
    └── sync-daily.js   # Daily updates sync script
```
