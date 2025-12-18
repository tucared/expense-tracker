// Allowance expenses data loader: fetches ONLY allowance expenses from Notion
// Returns raw expense data - calculation logic moved to client-side
// NOTE: Outputs original currency amounts - conversion happens client-side
//
// NOTION API VERSION: 2025-09-03

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Parse allowance categories from env var (comma-separated)
// Example: ALLOWANCE_CATEGORIES="Allowance - Max,Allowance - Cla"
const ALLOWANCE_CATEGORIES = process.env.ALLOWANCE_CATEGORIES
  ? process.env.ALLOWANCE_CATEGORIES.split(",").map(c => c.trim())
  : [];

// Fallback to empty data if no credentials or no categories specified
if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.warn("Notion credentials not found, returning empty allowance expenses");
  console.log(JSON.stringify([]));
  process.exit(0);
}

if (ALLOWANCE_CATEGORIES.length === 0) {
  console.warn("ALLOWANCE_CATEGORIES env var not set, returning empty allowance expenses");
  console.log(JSON.stringify([]));
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

// Data source discovery
let cachedDataSourceId = null;

async function discoverDataSourceId() {
  await fetchWithRateLimit();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2025-09-03",
      },
      signal: controller.signal,
    }
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Database discovery failed: ${response.status}`);
  }

  const database = await response.json();

  if (!database.data_sources || database.data_sources.length === 0) {
    throw new Error("No data sources found for database");
  }

  return database.data_sources[0].id;
}

async function getDataSourceId() {
  if (!cachedDataSourceId) {
    cachedDataSourceId = await discoverDataSourceId();
    console.warn(`Discovered data_source_id: ${cachedDataSourceId.slice(0, 12)}...`);
  }
  return cachedDataSourceId;
}

// Fetch allowance expenses from Notion using equals filter
async function fetchExpenses(startCursor = undefined, retries = 3) {
  const dataSourceId = await getDataSourceId();

  await fetchWithRateLimit();

  // Build OR filter for allowance categories
  const categoryFilters = ALLOWANCE_CATEGORIES.map(cat => ({
    property: "Category",
    select: {
      equals: cat
    }
  }));

  const filter = categoryFilters.length > 1
    ? { or: categoryFilters }
    : categoryFilters[0];

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2025-09-03",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_cursor: startCursor,
            page_size: 100,
            sorts: [{ property: "Date", direction: "descending" }],
            filter: filter,
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
      if (error.name === 'AbortError') {
        console.error(`Request timeout (10s)`);
      }

      if (i === retries - 1) throw error;
      const backoff = Math.pow(2, i) * 1000;
      console.warn(`Retry ${i + 1}/${retries} after ${backoff}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

// Fetch all expenses with pagination
async function fetchAllExpenses() {
  const allExpenses = [];
  let hasMore = true;
  let startCursor = undefined;
  let pageCount = 0;
  const MAX_PAGES = 100;

  while (hasMore && pageCount < MAX_PAGES) {
    const data = await fetchExpenses(startCursor);
    pageCount++;

    for (const page of data.results) {
      const props = page.properties;

      const expense = {
        id: page.id,
        date: props.Date?.date?.start || null,
        amountEUR: props.Amount?.number || 0,
        amountBRL: props.Amount_BRL?.number || 0,
        category: props.Category?.select?.name || "Uncategorized",
        payment_method: props["Payment Method"]?.select?.name || "Unknown",
        isCredit: props.Credit?.checkbox || false,
      };

      allExpenses.push(expense);
    }

    hasMore = data.has_more;
    startCursor = data.next_cursor;

    if (pageCount % 10 === 0) {
      console.warn(`Page ${pageCount}: ${allExpenses.length} total expenses`);
    }
  }

  if (pageCount >= MAX_PAGES && hasMore) {
    console.warn(`Reached max page limit (${MAX_PAGES}), stopping pagination`);
  }

  console.warn(`Complete: ${allExpenses.length} allowance expenses`);

  return allExpenses;
}

// Top-level error handling
try {
  const allowanceExpenses = await fetchAllExpenses();
  console.log(JSON.stringify(allowanceExpenses));
} catch (error) {
  console.error(`Fatal error fetching allowance expenses: ${error.message}`);
  console.log(JSON.stringify([]));
}
