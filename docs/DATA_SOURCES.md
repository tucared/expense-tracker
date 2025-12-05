# Connecting Your Own Data Sources

This guide explains how to connect the expense tracker to your own Notion database and Google Sheets budget.

## Overview

The dashboard pulls data from two sources:
- **Notion** - Your expense records (date, amount, category, payment method)
- **Google Sheets** - Your monthly budgets per category

Both are optional. Without credentials, the app uses sample data.

---

## Notion Setup (Expenses)

### 1. Create Your Expense Database

Create a Notion database with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `Date` | Date | When the expense occurred |
| `Amount` | Number | Cost in your currency |
| `Category` | Select | e.g., Groceries, Transport, Dining |
| `Payment Method` | Select | e.g., Card, Cash, Bank Transfer |

### 2. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Name it (e.g., "Expense Tracker")
4. Select your workspace
5. Copy the **Internal Integration Secret** (starts with `secret_`)

### 3. Share Database with Integration

1. Open your expense database in Notion
2. Click **...** menu → **Add connections**
3. Select your integration

### 4. Get Your Database ID

From your database URL:
```
https://notion.so/workspace/abc123def456...?v=...
                        ^^^^^^^^^^^^^^^^
                        This is your database ID
```

### 5. Set Environment Variables

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=abc123def456...
```

---

## Google Sheets Setup (Budgets)

### 1. Create Your Budget Sheet

Create a Google Sheet with columns:

| month | category | budget_eur |
|-------|----------|------------|
| 2024-12 | Groceries | 400 |
| 2024-12 | Transport | 150 |
| 2024-11 | Groceries | 400 |
| ... | ... | ... |

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

### 5. Set Environment Variables

```bash
# Paste entire JSON content as a single line
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...",...}'

GOOGLE_SHEETS_ID=abc123xyz...

# Optional: specify range (defaults to Sheet1!A:C)
GOOGLE_SHEETS_RANGE=Sheet1!A:C
```

---

## Environment Variables Summary

For local development, create a `.env` file:

```bash
# Notion
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx

# Google Sheets
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
GOOGLE_SHEETS_ID=xxx
GOOGLE_SHEETS_RANGE=Sheet1!A:C
```

For deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) for GitHub Secrets setup.

---

## Troubleshooting

### "Notion API error: 401"
- Check your `NOTION_API_KEY` is correct
- Verify the integration is shared with your database

### "Notion API error: 404"
- Check your `NOTION_DATABASE_ID` is correct
- Make sure you're using the database ID, not the page ID

### "Google Sheets API error"
- Verify the Sheets API is enabled in your Google Cloud project
- Check the service account email has access to the sheet
- Ensure `GOOGLE_SERVICE_ACCOUNT` is valid JSON

### Categories don't match
- Budget categories must exactly match Notion category names (case-sensitive)
