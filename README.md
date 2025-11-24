# Personal Expense Tracker

A personal expense dashboard built with [Observable Framework](https://observablehq.com/framework/), deployed to Cloudflare Pages with hourly updates via GitHub Actions.

## Architecture

```text
Notion (expenses) + Google Sheets (budgets)
                ↓
    GitHub Actions (hourly cron)
                ↓
      Observable Framework build
                ↓
    Cloudflare Pages + Access (auth)
```

## Features

- **Dashboard**: Current month spending vs budget at a glance
- **Categories**: Deep dive into category-level spending
- **Trends**: Historical analysis and year-over-year comparison
- **Hourly updates**: Data refreshes every hour automatically
- **Password protected**: Cloudflare Access for simple auth

## Setup

### Prerequisites

1. A [Notion](https://notion.so) database for expenses with fields:
   - `Date` (date)
   - `Amount` (number)
   - `Category` (select)
   - `Payment Method` (select)

2. A Google Sheet for budgets with columns:
   - `month` (YYYY-MM format)
   - `category` (must match Notion categories)
   - `budget_eur` (number)

3. A [Cloudflare](https://cloudflare.com) account

### 1. Create Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new internal integration
3. Copy the **Internal Integration Secret**
4. Share your expense database with the integration

### 2. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable the **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **Service Account**
5. Create a service account (name it something like "expense-tracker")
6. Click on the service account → **Keys** → **Add Key** → **Create new key** → **JSON**
7. Download the JSON key file (keep it secure!)
8. **Important**: Share your Google Sheet with the service account email (found in the JSON file as `client_email`)
   - Open your Google Sheet → Share → paste the `client_email` → give "Viewer" access

### 3. Create Cloudflare Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Create a new project named `expense-tracker`
3. Skip the Git connection (we deploy via wrangler)

### 4. Set Up Cloudflare Access (Password Auth)

1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add an application:
   - **Type**: Self-hosted
   - **Application domain**: `expense-tracker.pages.dev` (or your custom domain)
   - **Policy**: Create a policy with "One-time PIN" or "Service Auth" for password

For simple password:

1. Go to Access → Service Auth
2. Create a service token
3. Share the Client ID and Secret as your "password"

### 5. Configure GitHub Secrets

In your repo: Settings → Secrets and variables → Actions

**Secrets** (required):

| Secret | Description |
|--------|-------------|
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_DATABASE_ID` | ID from your Notion database URL |
| `GOOGLE_SERVICE_ACCOUNT` | Contents of the service account JSON file (entire file as a string) |
| `GOOGLE_SHEETS_ID` | ID from your Google Sheet URL |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

**Variables** (optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_SHEETS_RANGE` | `Sheet1!A:C` | Range to read from sheet |

### 6. Deploy

Push to `main` branch or manually trigger the workflow:

```bash
gh workflow run build-deploy.yml
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export NOTION_API_KEY=secret_xxx
export NOTION_DATABASE_ID=xxx
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...",...}'
export GOOGLE_SHEETS_ID=xxx

# Start dev server
npm run dev
```

**Note**: For `GOOGLE_SERVICE_ACCOUNT`, copy the entire contents of your service account JSON file as a single-line string.

Open <http://localhost:3000>

## Customization

### Notion Field Names

If your Notion database uses different property names, edit `src/data/expenses.json.js`:

```js
const expense = {
  date: props.Date?.date?.start,           // ← Change "Date" to your field name
  amount: props.Amount?.number,            // ← Change "Amount"
  category: props.Category?.select?.name,  // ← Change "Category"
  // ...
};
```

### Adding Pages

Create new `.md` files in `src/` and add them to `observablehq.config.js`:

```js
pages: [
  { name: "Dashboard", path: "/" },
  { name: "New Page", path: "/new-page" }
]
```

### Styling

Edit the CSS variables in `observablehq.config.js`:

```js
head: `<style>
  :root {
    --theme-accent: #your-color;
  }
</style>`
```

## Finding Your IDs

**Notion Database ID**: Open your database in Notion. The URL looks like:

```text
https://notion.so/myworkspace/abc123def456...?v=...
                             ^^^^^^^^^^^^^^^^
                             This is your database ID
```

**Google Sheet ID**: Open your sheet. The URL looks like:

```text
https://docs.google.com/spreadsheets/d/abc123xyz.../edit
                                       ^^^^^^^^^^^
                                       This is your sheet ID
```

## Troubleshooting

### Build fails with "Notion credentials not found"

Ensure `NOTION_API_KEY` and `NOTION_DATABASE_ID` are set in GitHub Secrets.

### No data showing in dashboard

1. Check GitHub Actions logs for API errors
2. Verify your Notion integration has access to the database
3. Verify your Google Sheet is shared with the service account email (check `client_email` in your service account JSON)

### Categories don't match

Category names in Notion must **exactly** match those in your Google Sheets budget.

## Cost

- **GitHub Actions**: Free (2,000 minutes/month)
- **Cloudflare Pages**: Free (unlimited requests)
- **Cloudflare Access**: Free (up to 50 users)
- **Notion API**: Free
- **Google Sheets API**: Free (under quota)

Total: $0/month

## License

MIT
