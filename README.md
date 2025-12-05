# Personal Expense Tracker

A personal expense dashboard built with [Observable Framework](https://observablehq.com/framework/). Fork it, break it, make it yours.

## Quick Start

**Option 1: Dev Container (recommended)**
1. Fork this repo
2. Open in VS Code with [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
3. Click "Reopen in Container" when prompted
4. Run `npm run dev`
5. Open http://localhost:3000

**Option 2: GitHub Codespaces**
1. Fork this repo
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Run `npm run dev` in terminal
4. Open the forwarded port

Works immediately with sample data - no API keys needed to explore!

## Features

- **Dashboard**: Current month spending vs budget
- **Categories**: Deep dive into category-level spending
- **Trends**: Historical analysis and year-over-year comparison
- **Hourly updates**: Fresh data on every build (when deployed)

## Architecture

```
Notion (expenses) + Google Sheets (budgets)
                ↓
     Notion webhook ─────────────────┐
                                     ↓
                          Cloudflare Worker
                                     ↓
                          Deploy Hook trigger
                                     ↓
     Cloudflare Pages ←── builds site with fresh data

PR previews: Cloudflare GitHub App (automatic)
Manual refresh: GitHub Actions workflow_dispatch
```

## Make It Yours

### Connect Your Own Data

Replace the sample data with your real expenses from Notion and budgets from Google Sheets.

See **[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)** for setup instructions.

### Deploy It

Host your dashboard on Cloudflare Pages with automatic hourly updates.

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for setup instructions.

## Project Structure

```
src/
├── index.md              # Main dashboard
├── categories.md         # Category breakdown
├── trends.md             # Historical trends
└── data/
    ├── expenses.json.js  # Notion data loader
    ├── budgets.json.js   # Google Sheets data loader
    ├── sample-expenses.json
    └── sample-budgets.json
```

## Cost

Everything runs on free tiers:
- GitHub Actions (2,000 min/month)
- Cloudflare Pages (unlimited)
- Notion & Google Sheets APIs

## License

MIT
