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

## Documentation

- **Data Sources**: See [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md) for connecting Notion and Google Sheets
- **Deployment**: See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Cloudflare Pages setup and environment variables
