// Queries Notion database to find all distinct months with expenses
// Used by dynamicPaths in observablehq.config.js

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Fetches all unique months that have expenses in the Notion database
 * Returns array like ["2025-02", "2025-01", "2024-12"] (descending order)
 */
export async function getAvailableMonths() {
  // Fallback: if no API credentials, return sample data months
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    const fs = await import("fs");
    const path = await import("path");

    try {
      // Find all sample-expenses-YYYY-MM.json files
      const dataDir = path.join(process.cwd(), "src/data");
      const files = fs.readdirSync(dataDir);
      const sampleMonths = files
        .filter(f => f.startsWith("sample-expenses-") && f.endsWith(".json"))
        .map(f => f.replace("sample-expenses-", "").replace(".json", ""))
        .filter(m => /^\d{4}-\d{2}$/.test(m))
        .sort()
        .reverse();

      if (sampleMonths.length > 0) {
        console.warn(`No Notion credentials, using sample months: ${sampleMonths.join(", ")}`);
        return sampleMonths;
      }
    } catch (error) {
      console.error(`Error scanning sample data: ${error.message}`);
    }

    // Ultimate fallback: current month
    console.warn("No Notion credentials and no sample data found, using current month only");
    return [new Date().toISOString().slice(0, 7)];
  }

  // Rate limiting
  const MIN_DELAY_MS = 350;
  const now = Date.now();
  const lastRequest = global.lastNotionMonthRequest || 0;
  if (now - lastRequest < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - (now - lastRequest)));
  }
  global.lastNotionMonthRequest = Date.now();

  try {
    // Fetch first page to extract date range
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
          page_size: 100,
          sorts: [{ property: "Date", direction: "descending" }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract all unique months from dates
    const months = new Set();
    for (const page of data.results) {
      const dateStr = page.properties.Date?.date?.start;
      if (dateStr) {
        const month = dateStr.slice(0, 7); // "2025-01-15" -> "2025-01"
        months.add(month);
      }
    }

    // If we have pagination, continue fetching
    let hasMore = data.has_more;
    let cursor = data.next_cursor;

    while (hasMore) {
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const nextResponse = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_cursor: cursor,
            page_size: 100,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!nextResponse.ok) {
        console.warn(`Error fetching page: ${nextResponse.status}`);
        break;
      }

      const nextData = await nextResponse.json();
      for (const page of nextData.results) {
        const dateStr = page.properties.Date?.date?.start;
        if (dateStr) months.add(dateStr.slice(0, 7));
      }

      hasMore = nextData.has_more;
      cursor = nextData.next_cursor;
    }

    const monthArray = Array.from(months).sort().reverse();
    console.warn(`Found ${monthArray.length} months from Notion: ${monthArray.join(", ")}`);
    return monthArray;
  } catch (error) {
    console.error(`Failed to fetch months from Notion: ${error.message}`);
    // Fallback to current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.warn(`Using fallback: current month (${currentMonth})`);
    return [currentMonth];
  }
}
