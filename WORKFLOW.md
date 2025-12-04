# Development Workflow

This guide explains how to work with this expense tracker project locally and deploy to Cloudflare.

## 🏠 Local Development

### Start the Dev Server

```bash
npm run dev
```

- Opens at http://localhost:3000
- ✅ **Live reload** - Changes appear instantly
- ✅ **No build needed** - Works perfectly in dev container
- ✅ **All features work** - d3, Plot, charts, everything

### Edit Files

1. Modify markdown files in `src/`:
   - `src/index.md` - Dashboard page
   - `src/categories.md` - Categories breakdown
   - `src/trends.md` - Trend analysis

2. Save the file

3. Browser auto-refreshes with your changes

### Update Data

Data loaders run at build time:
- `src/data/expenses.json.js` - Fetches from Notion API
- `src/data/budgets.json.js` - Fetches from Google Sheets API

To test with new data locally:
```bash
# Set environment variables (optional for local dev)
export NOTION_API_KEY="your-key"
export NOTION_DATABASE_ID="your-db-id"
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export GOOGLE_SHEETS_ID="your-sheet-id"

# Dev server will use these
npm run dev
```

---

## 🚀 Deploy to Cloudflare

### Automatic Deployment (Recommended)

**Just push to GitHub:**

```bash
git add .
git commit -m "your changes"
git push
```

GitHub Actions automatically:
1. ✅ Builds the Observable site (has CDN access)
2. ✅ Deploys to Cloudflare Pages
3. ✅ Your site is live!

### Manual Deployment

If you need to deploy manually:

```bash
# Set Cloudflare credentials
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Deploy (will fail locally due to build issues, use GitHub Actions instead)
npm run deploy
```

**Note:** Manual deployment won't work from dev container due to CDN access restrictions. Always use GitHub Actions for deployment.

---

## 🔧 Using Claude Code

This repository is optimized for development with Claude Code:

### Get Help
```
Can you help me add a new chart to the categories page?
```

### Make Changes
```
Update the dashboard to show expenses by payment method
```

### Understand Code
```
Explain how the budget performance calculation works
```

Claude Code can:
- ✅ Read and modify `.md` files
- ✅ Add new visualizations
- ✅ Update data loaders
- ✅ Fix bugs and improve code
- ✅ Explain how things work

---

## 📦 Why Builds Fail Locally

**Technical note:** Local builds (`npm run build`) fail because:

1. Observable Framework needs to fetch libraries from CDN (esm.sh, jsdelivr)
2. Dev container proxy blocks CDN access (security requirement)
3. Even with explicit imports, transitive dependencies still need CDN

**Solution:** Don't build locally. Use:
- `npm run dev` for local development ✅
- GitHub Actions for builds/deploys ✅

---

## 🎯 Quick Reference

| Task | Command | Where |
|------|---------|-------|
| **Develop locally** | `npm run dev` | Dev container ✅ |
| **Preview changes** | Open http://localhost:3000 | Browser |
| **Deploy** | `git push` | Anywhere |
| **Build** | (Happens in GitHub Actions) | CI/CD only |

---

## 🆘 Troubleshooting

### Dev server won't start
```bash
# Reinstall dependencies
npm install

# Try again
npm run dev
```

### Changes not appearing
- Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
- Check terminal for errors
- Verify file is in `src/` directory

### Deploy fails in GitHub Actions
- Check Secrets are set: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Verify Cloudflare Pages project exists
- Check GitHub Actions logs for specific error

---

## ✅ Your Workflow (The Simple Way)

```bash
# 1. Start dev server
npm run dev

# 2. Edit files in src/
#    (Browser auto-refreshes as you save)

# 3. When happy with changes:
git add .
git commit -m "Updated expense categories view"
git push

# 4. GitHub Actions builds and deploys automatically
#    Check https://your-site.pages.dev in ~2 minutes
```

That's it! 🎉
