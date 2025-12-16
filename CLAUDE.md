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

Standard Observable Framework structure: pages in `src/`, data loaders in `src/data/`, config in `observablehq.config.js`.

## Common Commands

| Task                          | Command                                   |
|-------------------------------|-------------------------------------------|
| Start dev server (.env)       | `npm run dev`                             |
| Build site (.env)             | `npm run build`                           |
| Start dev server (.env.local) | `npx dotenv -e .env.local -- npm run dev` |
| Clear data                    | `rm -rf src/.observablehq/cache/data`     |
| View in browser               | http://localhost:3000                     |
| See current changes           | `jj st`                                   |
| Commit changes                | `jj commit -m 'docs: ...'`                |

## Dev Notes

- Running in a dev container
- Production builds happen automatically on Cloudflare Pages via GitHub integration
- Use the playwright cli to verify changes visually
- **Dependencies**: All npm packages pinned to exact versions (no `^`). Use `npm ci` for installs, `npm install --save-exact` for new packages. Run `npm audit` regularly for security checks.

## Documentation

- **Data Sources**: See [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md) for connecting Notion and Google Sheets
- **Deployment**: See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Cloudflare Pages setup and environment variables
