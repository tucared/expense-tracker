# Connecting Your Own Data Sources

This guide explains how to connect the expense tracker to your own Notion database and Google Sheets budget.

## Overview

The dashboard pulls data from two sources:
- **Notion** - Your expense records (date, amount, category, payment method)
- **Google Sheets** - Your monthly budgets per category

---

## Notion Setup (Expenses)

### 1. Create Your Expense Database

Create a Notion database with these properties or duplicate this [template](https://adjoining-heath-cac.notion.site/1e81ed43cd7081609485d8f73c0d5e36?v=1e81ed43cd7081f88063000c38133b27):

| Property         | Type   | Description                        |
|------------------|--------|------------------------------------|
| `Date`           | Date   | When the expense occurred          |
| `Amount`         | Number | Cost in your currency              |
| `Category`       | Select | e.g., Groceries, Transport, Dining |
| `Payment Method` | Select | e.g., Card, Cash, Bank Transfer    |

### 2. Create a Notion Integration and share with Database

Follow the [Build your first integration](https://developers.notion.com/docs/create-a-notion-integration) tutorial from Notion
- [Create your integration in Notion](https://developers.notion.com/docs/create-a-notion-integration#create-your-integration-in-notion)
- [Get your API secret](https://developers.notion.com/docs/create-a-notion-integration#get-your-api-secret)
- [Give your integration page permissions](https://developers.notion.com/docs/create-a-notion-integration#give-your-integration-page-permissions)

Only `read_content` permission is needed

### 3. Get Your Database ID

From your database URL:
```
https://notion.so/workspace/abc123def456...?v=...
                        ^^^^^^^^^^^^^^^^
                        This is your database ID
```

**Save these values - you'll need them in [Configure Environment Variables](#configure-environment-variables):**
- `NOTION_API_KEY`: Your API secret from step 2
- `NOTION_DATABASE_ID`: The database ID from this step

---

## Google Sheets Setup (Budgets)

### 1. Create Your Budget Sheet

Create a Google Sheet with columns or duplicate this [template](https://docs.google.com/spreadsheets/d/1mf3u9zqNAhXSNc7v2GYphqUjYIN6PHYEgjTAHuvD50M):

| month   | category  | budget_eur |
|---------|-----------|------------|
| 2024-12 | Groceries | 400        |
| 2024-12 | Transport | 150        |
| 2024-11 | Groceries | 400        |
| ...     | ...       | ...        |

- `month`: YYYY-MM format
- `category`: Must match your Notion categories exactly
- `budget_eur`: Your budget amount (rename column if using different currency)

### 2. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services** → **Library**
   - Search "Google Sheets API"
   - Click **Enable**

4. Create Service Account:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **Service Account**
   - Name it (e.g., "expense-tracker-reader")
   - Click **Create and Continue** → **Done**

5. Create JSON Key:
   - Click on your service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key** → **JSON**
   - Save the downloaded file

### 3. Share Sheet with Service Account

1. Open your Google Sheet
2. Click **Share**
3. Add the service account email (from JSON file: `client_email`)
4. Set permission to **Viewer**

### 4. Get Your Sheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/abc123xyz.../edit
                                       ^^^^^^^^^^^
                                       This is your sheet ID
```

**Save these values - you'll need them in [Configure Environment Variables](#configure-environment-variables):**
- `GOOGLE_SERVICE_ACCOUNT`: The entire JSON file content from step 2
- `GOOGLE_SHEETS_ID`: The sheet ID from this step

---

## Configure Environment Variables

Now that you have all the required credentials, configure them based on your environment:

### Local Development

1. Create a `.env` file in the project root  from exemple (`cp .env.example .env`)
2. Edit values from those obtained in previous steps

The `.env` file is gitignored and will be automatically loaded when you run `npm run dev`.

### Deployment

For Cloudflare Pages deployment, set these as environment variables in your Cloudflare Pages project settings. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
