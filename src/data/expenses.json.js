// Notion API loader for expenses
// Runs at build time in GitHub Actions

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.warn("Notion credentials not found. No expense data loaded.");
  console.log(JSON.stringify([]));
  process.exit(0);
}

async function fetchAllExpenses() {
  const expenses = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
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
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

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
  }

  return expenses;
}

const expenses = await fetchAllExpenses();

// Sort by date descending
expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log(JSON.stringify(expenses));
