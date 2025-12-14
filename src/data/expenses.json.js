// Notion API loader for expenses
// Runs at build time in GitHub Actions

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  // Load sample data during local dev if secrets not set
  const fs = await import("fs");
  const path = await import("path");
  const samplePath = path.join(import.meta.dirname, "sample-expenses.json");
  const sampleData = fs.readFileSync(samplePath, "utf-8");
  console.warn("Notion credentials not found, using sample data");
  console.log(sampleData);
  process.exit(0);
}

// Rate limiting helper
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

async function fetchAllExpenses(startCursor = undefined, retries = 3) {
  await fetchWithRateLimit();

  for (let i = 0; i < retries; i++) {
    try {
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
          }),
        }
      );

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
      if (i === retries - 1) throw error;
      const backoff = Math.pow(2, i) * 1000;
      console.warn(`Retry ${i + 1}/${retries} after ${backoff}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

async function fetchAll() {
  const expenses = [];
  let hasMore = true;
  let startCursor = undefined;
  let pageCount = 0;

  console.warn("Fetching all expenses from Notion...");

  while (hasMore) {
    const data = await fetchAllExpenses(startCursor);
    pageCount++;

    for (const page of data.results) {
      const props = page.properties;

      // Extract fields - adjust property names to match your Notion database
      const expense = {
        id: page.id,
        date: props.Date?.date?.start || null,
        amount: props.Amount?.number || 0,
        category: props.Category?.select?.name || "Uncategorized",
        payment_method: props["Payment Method"]?.select?.name || "Unknown",
      };

      if (expense.date) {
        expenses.push(expense);
      }
    }

    hasMore = data.has_more;
    startCursor = data.next_cursor;

    console.warn(`Processed page ${pageCount}, ${expenses.length} expenses so far`);
  }

  console.warn(`Complete: ${expenses.length} expenses from ${pageCount} pages`);
  return expenses;
}

const expenses = await fetchAll();

console.log(JSON.stringify(expenses));

