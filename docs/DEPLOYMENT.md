# Deployment Guide

This guide covers deploying the expense tracker to Cloudflare Pages with automatic updates triggered by Notion webhooks.

## Overview

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION: Notion Webhook → Auto Deploy               │
├─────────────────────────────────────────────────────────┤
│  Notion (expense added/edited)                          │
│            ↓                                            │
│  Cloudflare Worker (receives webhook)                   │
│            ↓                                            │
│  Deploy Hook (triggers Pages build)                     │
│            ↓                                            │
│  Cloudflare Pages (builds + deploys)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  DEVELOPMENT: PR Previews                               │
├─────────────────────────────────────────────────────────┤
│  Push to PR branch                                      │
│            ↓                                            │
│  Cloudflare GitHub App (auto-detects)                   │
│            ↓                                            │
│  Preview URL: <branch>.expense-tracker.pages.dev        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MANUAL: Emergency Refresh                              │
├─────────────────────────────────────────────────────────┤
│  GitHub Actions → workflow_dispatch                     │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- GitHub repository (fork or your own)
- Cloudflare account (free tier works)
- Data sources configured (see [DATA_SOURCES.md](./DATA_SOURCES.md))

---

## Step 1: Cloudflare Pages + GitHub App

This gives you automatic PR preview URLs.

### 1.1 Connect Repository to Cloudflare Pages

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

Now every PR will automatically get a preview URL like `feature-branch.expense-tracker.pages.dev`.

### 1.2 Create a Deploy Hook

1. In your Pages project, go to **Settings** → **Builds & deployments**
2. Scroll to **Deploy hooks**
3. Click **Add deploy hook**
4. Name it `notion-webhook`
5. Select branch: `main`
6. Copy the hook URL (you'll need it for Step 2)

---

## Step 2: Notion Webhook → Cloudflare Worker

This triggers a deploy whenever you add/edit an expense in Notion.

### 2.1 Deploy the Worker

```bash
cd workers/notion-webhook
npm install
wrangler deploy
```

After deploying, note the worker URL (e.g., `https://notion-webhook.<account>.workers.dev`).

### 2.2 Add Worker Secrets

```bash
# The deploy hook URL from Step 1.2
wrangler secret put DEPLOY_HOOK_URL

# After Notion webhook verification (Step 2.4), add:
wrangler secret put VERIFICATION_TOKEN
```

### 2.3 Create Notion Webhook Subscription

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Select your expense tracker integration
3. Go to **Webhooks** tab → **Create a subscription**
4. Enter your worker URL: `https://notion-webhook.<account>.workers.dev`
5. Select event types:
   - `page.content_updated`
   - `page.created`
   - `page.properties_updated`
6. Click **Create subscription**

### 2.4 Verify the Webhook

1. Notion sends a `verification_token` to your worker
2. Check worker logs: `wrangler tail`
3. Copy the token from the logs
4. Back in Notion, click **Verify** and paste the token
5. Add the token to your worker: `wrangler secret put VERIFICATION_TOKEN`

Your webhook is now active! Adding an expense in Notion will trigger a deploy.

---

## Step 3: GitHub Actions (Manual Refresh)

For emergency refreshes when webhook fails or you need immediate update.

### 3.1 Get Cloudflare Credentials

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

### 3.2 GitHub Secrets Configuration

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

### 3.3 Trigger Manual Refresh

Via GitHub CLI:
```bash
gh workflow run build-deploy.yml
```

Or in GitHub UI:
- Go to **Actions** → **Manual Refresh** → **Run workflow**

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
- **Cloudflare Pages**: 500 builds/month (webhook-triggered = very efficient)
- **Cloudflare Workers**: 100,000 requests/day
- **GitHub Actions**: 2,000 minutes/month (only manual refreshes)
- **Cloudflare Access**: 50 users

---

## Troubleshooting

### Webhook not triggering deploys
- Check worker logs: `wrangler tail` in `workers/notion-webhook`
- Verify the webhook subscription is **active** in Notion integration settings
- Ensure `DEPLOY_HOOK_URL` secret is set in the worker
- Check the integration has access to your expense database

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

### Deploy fails with "Authentication error"
- Verify `CLOUDFLARE_API_TOKEN` has Pages edit permission
- Check `CLOUDFLARE_ACCOUNT_ID` is correct

### Pages shows old data
- Add a new expense in Notion and wait ~1 minute for webhook + build
- Or trigger manual refresh via GitHub Actions
- Cloudflare Pages may cache - try hard refresh (Ctrl+Shift+R)
