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

## Important Dev Container Notes

- Running in a network-restricted dev container with firewall rules
- **Package installation**: npm registry access is blocked during development for security
  - To add new packages: update `package.json`, then **rebuild the dev container**
  - Packages are installed during container build via `postCreateCommand`
- Production builds happen automatically on Cloudflare Pages via GitHub integration
- Use the playwright skill to verify changes visually

## Documentation

- **Data Sources**: See [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md) for connecting Notion and Google Sheets
- **Deployment**: See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Cloudflare Pages setup and environment variables
