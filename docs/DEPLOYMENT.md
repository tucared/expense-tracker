# Deployment Guide

This guide covers deploying the expense tracker to Cloudflare Pages.

## Overview

- **Production**: Push to main → auto-deploy
- **Preview**: Push to PR branch → auto-preview at `<branch>.expense-tracker.pages.dev`
- **Manual refresh**: Trigger from Cloudflare Pages dashboard

---

## Prerequisites

- GitHub repository
- Cloudflare account
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
   - `NOTION_API_KEY` - Your Notion integration API key
   - `NOTION_DATABASE_ID` - Your database ID (API auto-discovers data source)
   - `FIRST_EXPENSE_MONTH`
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
3. Go to **Deployments** tab and retry a previous deployment

This triggers a new build that fetches fresh data from Notion and Google Sheets.

---

## Adding Password Protection (Optional)

Use Cloudflare Access for simple authentication:

1. Go to **Cloudflare Zero Trust** → **Access controls** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Application domain**: your Pages URL (e.g., `expense-tracker-123.pages.dev`)
   - **Authentication**: One-time PIN (email)
4. Add allowed email addresses
5. Repeat for the preview domain ass well (e.g., `*.expense-tracker-123.pages.dev`)

Free tier supports up to 50 users.

---

## Cost

Everything fits in free tiers:
- **Cloudflare Pages**: 500 builds/month
- **Cloudflare Access**: 50 users (if enabled)
