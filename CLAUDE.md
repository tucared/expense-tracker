# Expense Tracker - Claude Code Context

## Project Overview

Personal expense dashboard built with Observable Framework. Fetches expenses from Notion API and budgets from Google Sheets, builds static HTML/JS visualizations, deploys to Cloudflare Pages.

## Tech Stack

- **Framework**: Observable Framework (markdown with embedded reactive JavaScript)
- **Visualization**: D3.js, Observable Plot
- **Deployment**: Cloudflare Pages (native GitHub integration, automatic builds on push)
- **Data Sources**: Notion API (expenses), Google Sheets API (budgets)
- **Version Control**: Jujutsu

## Directory Structure

```
src/                        # Observable pages (markdown + JS)
├── index.md                # Dashboard - monthly summary, category breakdown
└── data/
    ├── expenses.json.js    # Notion API data loader
    └── budgets.json.js     # Google Sheets data loader

observablehq.config.js      # Page routing, theme, title
package.json                # Dependencies and npm scripts
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
- All production builds happen on Cloudflare Pages (has CDN access)
- Use the playwright skill to verify changes visually

## Key Files

| File                        | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `src/data/expenses.json.js` | Fetches from Notion API, transforms expense records      |
| `src/data/budgets.json.js`  | Fetches from Google Sheets with JWT service account auth |
| `src/index.md`              | Main dashboard with D3 aggregations                      |
| `observablehq.config.js`    | Site config: pages, theme, title                         |

## Environment Variables

Required in **Cloudflare Pages** (Settings → Environment variables):

| Variable                 | Description                      |
| ------------------------ | -------------------------------- |
| `NOTION_API_KEY`         | Notion integration secret        |
| `NOTION_DATABASE_ID`     | ID from Notion database URL      |
| `GOOGLE_SERVICE_ACCOUNT` | Full JSON of service account key |
| `GOOGLE_SHEETS_ID`       | ID from Google Sheet URL         |

**How to set:**

1. Go to Cloudflare Dashboard → Pages → expense-tracker
2. Settings → Environment variables
3. Add each variable for "Production" and "Preview" environments
4. Trigger a new deployment (commit + push or manual retry)

## Build & Deployment

**How builds work:**

- Cloudflare Pages watches your GitHub repository
- On every push to main, it automatically:
  1. Clones the repo
  2. Runs `npm clean-install`
  3. Runs `npm run build` (with environment variables)
  4. Deploys the `dist/` folder

**Caching on Cloudflare Pages:**

- Observable Framework caches data loaders locally in `.observablehq/cache/`
- Build caching can be enabled (see [DEPLOYMENT.md](./docs/DEPLOYMENT.md#build-caching))
- However, **data loaders fetch ALL records on every build** (no incremental updates)
- Build caching only speeds up dependency installation, not API calls
- For this expense tracker, fresh data on every build is ideal

**Scheduled builds:**
If you want automatic hourly/daily builds (to refresh data without pushing code):

1. Use Cloudflare Pages Deploy Hooks:
   - Pages → Settings → Builds & deployments → Deploy hooks
   - Create a hook URL
2. Set up a cron service (like GitHub Actions, Cloudflare Workers Cron, or cron-job.org) to POST to the hook URL
