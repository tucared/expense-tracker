# Deployment Guide

This guide covers deploying the expense tracker to Cloudflare Pages with automatic hourly updates.

## Overview

```
GitHub Actions (hourly cron + push to main)
           ↓
   Build Observable site
           ↓
   Deploy to Cloudflare Pages
```

The workflow:
1. Fetches fresh data from Notion and Google Sheets
2. Builds static HTML/JS with Observable Framework
3. Deploys to Cloudflare Pages

---

## Prerequisites

- GitHub repository (fork or your own)
- Cloudflare account (free tier works)
- Data sources configured (see [DATA_SOURCES.md](./DATA_SOURCES.md))

---

## Cloudflare Setup

### 1. Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy** (this initial deploy will fail - that's OK)

Or let the GitHub Action create it automatically on first run.

### 2. Get Cloudflare Credentials

**API Token:**
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Or create custom with permissions:
   - Account: Cloudflare Pages (Edit)
5. Copy the token

**Account ID:**
1. Go to any domain in Cloudflare, or Workers & Pages
2. Find **Account ID** in the right sidebar
3. Copy it

---

## GitHub Secrets Configuration

Go to your repo: **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret | Description |
|--------|-------------|
| `NOTION_API_KEY` | Your Notion integration secret |
| `NOTION_DATABASE_ID` | Notion database ID |
| `GOOGLE_SERVICE_ACCOUNT` | Full JSON content of service account key |
| `GOOGLE_SHEETS_ID` | Google Sheet ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

Optional variables (Settings → Variables → Actions):

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_SHEETS_RANGE` | `Sheet1!A:C` | Custom sheet range |

---

## Triggering Deployments

### Automatic
- **Hourly**: Cron schedule runs every hour
- **On push**: Any push to `main` branch triggers deploy

### Manual
Via GitHub CLI:
```bash
gh workflow run build-deploy.yml
```

Or in GitHub UI:
- Go to **Actions** → **Build and Deploy** → **Run workflow**

---

## Workflow File

The workflow lives at `.github/workflows/build-deploy.yml`:

```yaml
name: Build and Deploy

on:
  schedule:
    - cron: "0 * * * *"  # Every hour
  push:
    branches: [main]
  workflow_dispatch:       # Manual trigger

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          # ... other secrets
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=expense-tracker
```

---

## Adding Password Protection (Optional)

Use Cloudflare Access for simple authentication:

1. Go to **Cloudflare Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Application domain**: your Pages URL
   - **Authentication**: One-time PIN (email)
4. Add allowed email addresses

Free tier supports up to 50 users.

---

## Cost

Everything fits in free tiers:
- **GitHub Actions**: 2,000 minutes/month
- **Cloudflare Pages**: Unlimited sites, 500 builds/month
- **Cloudflare Access**: 50 users

---

## Troubleshooting

### Build fails with "Notion API error"
- Check `NOTION_API_KEY` and `NOTION_DATABASE_ID` secrets are set correctly
- Verify the integration has access to your database

### Build fails with "Google Sheets API error"
- Ensure `GOOGLE_SERVICE_ACCOUNT` contains the full JSON (not a file path)
- Check the service account has Viewer access to the sheet

### Deploy fails with "Authentication error"
- Verify `CLOUDFLARE_API_TOKEN` has Pages edit permission
- Check `CLOUDFLARE_ACCOUNT_ID` is correct

### Pages shows old data
- Check if the workflow ran successfully in Actions tab
- Cloudflare Pages may cache - try hard refresh (Ctrl+Shift+R)
