# Expense Tracker - Claude Code Context

## Project Overview

Personal expense dashboard built with Observable Framework. Fetches expenses from Notion API and budgets from Google Sheets, builds static HTML/JS visualizations, deploys to Cloudflare Pages.

## Tech Stack

- **Framework**: Observable Framework (markdown with embedded reactive JavaScript)
- **Visualization**: D3.js, Observable Plot
- **Deployment**: Cloudflare Pages via GitHub Actions (hourly auto-builds)
- **Data Sources**: Notion API (expenses), Google Sheets API (budgets)
- **Version Control**: Jujutsu

## Directory Structure

```
src/                        # Observable pages (markdown + JS)
├── index.md                # Dashboard - monthly summary, category breakdown
├── categories.md           # Category deep-dive with month selector
├── trends.md               # Historical trends, year-over-year
└── data/
    ├── expenses.json.js    # Notion API data loader
    └── budgets.json.js     # Google Sheets data loader

observablehq.config.js      # Page routing, theme, title
package.json                # Dependencies and npm scripts
.github/workflows/          # GitHub Actions for build + deploy
.devcontainer/              # Dev container setup (network, firewall)
```

## Common Commands

| Task                | Command                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| Start dev server    | `npm run dev`                                                              |
| View in browser     | http://localhost:3000                                                      |
| Test data loader    | `node src/data/expenses.json.js`                                           |
| Test with real API  | `NOTION_API_KEY=xxx NOTION_DATABASE_ID=xxx node src/data/expenses.json.js` |
| See current changes | `jj st`                                                                    |
| Commit changes      | `jj commit -m 'docs: ...'`                                                 |

## Important Dev Container Notes

- Running in a network-restricted dev container
- **Local builds fail** (CDN blocked by proxy) — this is expected
- Use `npm run dev` for development (works perfectly)
- All production builds happen in GitHub Actions (has CDN access)
- Use the playwright skill to verify changes visually

## Key Files

| File                        | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `src/data/expenses.json.js` | Fetches from Notion API, transforms expense records      |
| `src/data/budgets.json.js`  | Fetches from Google Sheets with JWT service account auth |
| `src/index.md`              | Main dashboard with D3 aggregations                      |
| `observablehq.config.js`    | Site config: pages, theme, title                         |

## Environment Variables

Required in GitHub Secrets for deployment:

| Variable                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `NOTION_API_KEY`         | Notion integration secret                    |
| `NOTION_DATABASE_ID`     | ID from Notion database URL                  |
| `GOOGLE_SERVICE_ACCOUNT` | Full JSON of service account key             |
| `GOOGLE_SHEETS_ID`       | ID from Google Sheet URL                     |
| `CLOUDFLARE_API_TOKEN`   | Cloudflare API token (Pages edit permission) |
| `CLOUDFLARE_ACCOUNT_ID`  | Cloudflare account ID                        |
