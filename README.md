# Expense Tracker

A personal expense dashboard built with [Observable Framework](https://observablehq.com/framework/). Started as a way to have fun extending my personal analysis and explore analytics solutions like Observable Framework.

## Prerequisites

- Docker (for dev containers) or Node.js 18+
- Notion account with a database for expenses
- Google Sheet for budgets + service account credentials
- Cloudflare account (for deployment)

## Quick Start

**Option 1: Dev Containers (recommended)**
1. Fork this repo
2. Open in VS Code with [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
3. Click "Reopen in Container" when prompted
4. Run `npm run dev`
5. Open http://localhost:3000

**Option 2: Local setup**
1. Fork this repo
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:3000

**Data setup:** Requires Notion database + Google Sheet with service account.
See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for instructions

**Deployment:** See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for instructions.

## Cost

Everything runs on free tiers:
- Cloudflare Pages (500 free builds a month)
- Notion & Google Sheets APIs

## License

MIT
