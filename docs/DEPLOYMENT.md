# Deployment Guide

This guide covers deploying the expense tracker to Cloudflare Pages.

## Overview

- **Production**: Push to main → auto-deploy
- **Preview**: Push to PR branch → auto-preview at `<branch>.expense-tracker.pages.dev`
- **Manual refresh**: Trigger from Cloudflare Pages dashboard

---

## Prerequisites

- GitHub repository (fork or your own)
- Cloudflare account (free tier works)
- Data sources configured (see [DATA_SOURCES.md](./DATA_SOURCES.md))

---

## Step 1: Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Authorize Cloudflare GitHub App when prompted
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Add environment variables:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
   - `GOOGLE_SERVICE_ACCOUNT`
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SHEETS_RANGE` (optional, default: `Sheet1!A:C`)
7. Click **Save and Deploy**

Now:
- Every push to main auto-deploys to production
- Every PR gets a preview URL like `feature-branch.expense-tracker.pages.dev`

---

## Step 2: Manual Refresh (Optional)

To manually refresh data without pushing code changes:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click on your **expense-tracker** project
3. Go to **Deployments** tab
4. Click **Create deployment**
5. Select **Production branch** (main)
6. Click **Save and Deploy**

This triggers a new build that fetches fresh data from Notion and Google Sheets.

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
- **Cloudflare Pages**: 500 builds/month
- **Cloudflare Access**: 50 users (if enabled)

---

## Build Caching

Cloudflare Pages supports build caching to speed up dependency installation. **Note: This does NOT reduce API calls to Notion/Sheets.**

### How to Enable

1. Go to Cloudflare Dashboard → **Pages** → your project
2. **Settings** → **Build & deployments** → **Build cache**
3. Toggle **Enable build cache**
4. Requires **V2 build system** or later

### What Gets Cached

- ✅ **Dependencies** (`node_modules`) - speeds up `npm install`
- ✅ **Framework build artifacts** (Observable Framework output)
- ❌ **NOT the data loader cache** (`.observablehq/cache/`)
- ❌ **NOT API responses** (Notion, Google Sheets)

### Limitations for This Project

**Data loaders always fetch ALL records:**
- `src/data/expenses.json.js` fetches entire Notion database (no date filter)
- `src/data/budgets.json.js` fetches entire Google Sheet
- No incremental updates or smart caching

**When build caching helps:**
- Faster dependency installation (~30-60s savings)
- Useful if you push frequent code changes

**When it doesn't help:**
- Won't reduce Notion API calls (always fetches everything)
- Won't reduce Google Sheets API calls
- Won't make data fresher (it's already fresh every build)

### Storage Limits

- **10 GB per project**
- Automatically deletes least-recently-used cache if exceeded
- For this project: ~100-200 MB typical usage

### Recommendation

**You probably don't need it for this project** because:
1. Builds triggered by Notion webhooks are already efficient (only when data changes)
2. Dependency installation is fast for this small project
3. Data loaders will fetch everything anyway

**Enable it if:**
- You're pushing code changes frequently
- You want slightly faster preview builds on PRs

---

## Troubleshooting

### PR previews not working
- Verify Cloudflare GitHub App is authorized on your repo
- Check that environment variables are set in Cloudflare Pages settings
- Look at build logs in Cloudflare Pages dashboard

### Build fails with "Notion API error"
- Check `NOTION_API_KEY` and `NOTION_DATABASE_ID` are set correctly
- Verify the integration has access to your database

### Build fails with "Google Sheets API error"
- Ensure `GOOGLE_SERVICE_ACCOUNT` contains the full JSON (not a file path)
- Check the service account has Viewer access to the sheet

### Pages shows old data
- Push a new commit to trigger a rebuild
- Or trigger manual deployment from Cloudflare Pages dashboard (see Step 2)
- Cloudflare Pages may cache - try hard refresh (Ctrl+Shift+R)
