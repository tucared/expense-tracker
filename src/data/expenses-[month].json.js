// Parameterized data loader: fetches expenses for a specific month
// Invoked as: node expenses-[month].json.js --month=2025-01

import { parseArgs } from "node:util";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Parse CLI argument
const { values } = parseArgs({
  options: {
    month: { type: "string" }
  }
});

const month = values.month;

// Validate month format
if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
  console.error("Invalid or missing --month parameter (expected YYYY-MM with valid month)");
  console.log(JSON.stringify([]));
  process.exit(0);
}

// Check if month is in the future - if so, return empty data
const [year, monthNum] = month.split("-").map(Number);
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

const isFuture = year > currentYear || (year === currentYear && monthNum > currentMonth);
if (isFuture) {
  console.warn(`Month ${month} is in the future, returning empty data`);
  console.log(JSON.stringify([]));
  process.exit(0);
}

// Fallback to empty data if no credentials
if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.warn(`Notion credentials not found, returning empty data for ${month}`);
  console.log(JSON.stringify([]));
  process.exit(0);
}

// Rate limiting helper (copied from original loader)
global.lastNotionRequest = global.lastNotionRequest || 0;

async function fetchWithRateLimit() {
  const MIN_DELAY_MS = 350; // ~3 req/sec
  const now = Date.now();
  const timeSinceLastRequest = now - global.lastNotionRequest;

  if (timeSinceLastRequest < MIN_DELAY_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_DELAY_MS - timeSinceLastRequest)
    );
  }

  global.lastNotionRequest = Date.now();
}

// Calculate date range for the month (reuse parsed values from validation above)
const startDate = `${month}-01`; // First day of month
const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10); // Last day

console.warn(`Fetching expenses for ${month} (${startDate} to ${endDate})`);

async function fetchMonthExpenses(startCursor = undefined, retries = 3) {
  await fetchWithRateLimit();

  for (let i = 0; i < retries; i++) {
    try {
      // Add timeout protection to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_cursor: startCursor,
            page_size: 100,
            sorts: [{ property: "Date", direction: "descending" }],
            // SERVER-SIDE FILTER: Only fetch this month's expenses
            filter: {
              and: [
                {
                  property: "Date",
                  date: {
                    on_or_after: startDate
                  }
                },
                {
                  property: "Date",
                  date: {
                    on_or_before: endDate
                  }
                }
              ]
            }
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '1');
        console.warn(`Rate limited, waiting ${retryAfter}s`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Handle timeout abort errors
      if (error.name === 'AbortError') {
        console.error(`Request timeout (10s) for ${month}`);
      }

      if (i === retries - 1) throw error;
      const backoff = Math.pow(2, i) * 1000;
      console.warn(`Retry ${i + 1}/${retries} after ${backoff}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

async function fetchAll() {
  try {
    const expenses = [];
    let hasMore = true;
    let startCursor = undefined;
    let pageCount = 0;
    const MAX_PAGES = 50; // Safety limit to prevent infinite loops

    while (hasMore && pageCount < MAX_PAGES) {
      const data = await fetchMonthExpenses(startCursor);
      pageCount++;

      for (const page of data.results) {
        const props = page.properties;

        const expense = {
          id: page.id,
          date: props.Date?.date?.start || null,
          amount: props.Amount?.number || 0,
          category: props.Category?.select?.name || "Uncategorized",
          payment_method: props["Payment Method"]?.select?.name || "Unknown",
        };

        // Double-check date is in correct month (defense in depth)
        if (expense.date && expense.date.startsWith(month)) {
          expenses.push(expense);
        }
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;

      console.warn(`Page ${pageCount}: ${expenses.length} expenses for ${month}`);
    }

    if (pageCount >= MAX_PAGES && hasMore) {
      console.warn(`Reached max page limit (${MAX_PAGES}), stopping pagination`);
    }

    console.warn(`Complete: ${expenses.length} expenses for ${month}`);
    return expenses;
  } catch (error) {
    console.error(`Failed to fetch expenses for ${month}: ${error.message}`);
    // Return empty array instead of crashing - allows build to continue
    return [];
  }
}

// Top-level error handling - always output valid JSON
try {
  const expenses = await fetchAll();
  console.log(JSON.stringify(expenses));
} catch (error) {
  console.error(`Fatal error fetching expenses for ${month}: ${error.message}`);
  // Output empty array to allow build to continue
  console.log(JSON.stringify([]));
}
