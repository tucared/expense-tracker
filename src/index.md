# Monthly Budget Dashboard

```js
// Import d3 and Plot from node_modules instead of CDN
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
```

```js
const expenses = FileAttachment("data/expenses.json").json();
const budgets = FileAttachment("data/budgets.json").json();
```

```js
// Get all available months
const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)))].filter(Boolean).sort().reverse();

// Month selector - drives entire page
const selectedMonth = view(Inputs.select(months, {
  label: "Select Month",
  value: months[0]
}));
```

```js
// Filter data for selected month
const monthExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
const monthBudgets = budgets.filter(b => b.month === selectedMonth);

// Calculate totals
const totalSpent = d3.sum(monthExpenses, d => d.amount);
const totalBudget = d3.sum(monthBudgets, d => d.budget_eur);
const remaining = totalBudget - totalSpent;
const transactionCount = monthExpenses.length;

// Check if over budget
const isOverBudget = totalSpent > totalBudget;
```

```js
if (isOverBudget) {
  display(html`<div class="warning-banner">
    <span style="font-size: 1.25rem;">⚠️</span>
    <span>You've exceeded your budget by ${(totalSpent - totalBudget).toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>`);
}
```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Spent This Month</h2>
    <span class="big">${totalSpent.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Budget</h2>
    <span class="big">${totalBudget.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Remaining</h2>
    <span class="big" style="color: ${remaining >= 0 ? 'var(--theme-accent)' : 'var(--theme-red)'}">${remaining.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Transactions</h2>
    <span class="big">${transactionCount}</span>
  </div>
</div>

## Budget Burndown

```js
// Get all categories
const categories = [...new Set(expenses.map(e => e.category))].filter(Boolean).sort();

// Category filter for burndown chart
const selectedBurndownCategory = view(Inputs.select(
  ["All Categories", ...categories],
  {label: "Category Filter", value: "All Categories"}
));
```

```js
// Filter expenses for burndown
const burndownExpenses = monthExpenses.filter(e =>
  selectedBurndownCategory === "All Categories" || e.category === selectedBurndownCategory
);

// Get budget total for selected category
const budgetTotal = selectedBurndownCategory === "All Categories"
  ? d3.sum(monthBudgets, b => b.budget_eur)
  : monthBudgets.find(b => b.category === selectedBurndownCategory)?.budget_eur || 0;

// Calculate days in month
const [year, month] = selectedMonth.split('-').map(Number);
const daysInMonth = new Date(year, month, 0).getDate();

// Group expenses by day and calculate cumulative
const dailySpending = d3.rollup(
  burndownExpenses,
  v => d3.sum(v, d => d.amount),
  d => parseInt(d.date.slice(8, 10))
);

// Build cumulative data array
const burndownData = [];
let cumulative = 0;
for (let day = 1; day <= daysInMonth; day++) {
  cumulative += dailySpending.get(day) || 0;
  burndownData.push({
    day,
    cumulative,
    idealBudget: (budgetTotal / daysInMonth) * day,
    overBudget: cumulative > (budgetTotal / daysInMonth) * day
  });
}

// Check if current month
const today = new Date();
const isCurrentMonth = selectedMonth === today.toISOString().slice(0, 7);
const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
```

<p style="font-size: 0.875rem; color: var(--theme-foreground-muted); margin-bottom: 1rem;">
  ${isCurrentMonth ? `As of day ${daysElapsed} of ${daysInMonth}` : `Full month (${daysInMonth} days)`}
</p>

```js
budgetTotal > 0 ? Plot.plot({
  height: 350,
  marginLeft: 60,
  x: {
    label: "Day of Month",
    domain: [1, daysInMonth],
    grid: true
  },
  y: {
    label: "Cumulative Spending (EUR)",
    grid: true
  },
  marks: [
    // Ideal budget line (linear pacing)
    Plot.line(burndownData, {
      x: "day",
      y: "idealBudget",
      stroke: "var(--theme-foreground-muted)",
      strokeDasharray: "5,5",
      strokeWidth: 2
    }),
    Plot.text([{day: daysInMonth, y: budgetTotal}], {
      x: "day",
      y: "y",
      text: ["Budget"],
      dx: -30,
      dy: -10,
      fill: "var(--theme-foreground-muted)",
      fontSize: 11
    }),

    // Warning area when over budget
    Plot.areaY(burndownData.filter(d => d.overBudget && d.cumulative > 0), {
      x: "day",
      y1: "idealBudget",
      y2: "cumulative",
      fill: "var(--theme-red)",
      fillOpacity: 0.1
    }),

    // Actual spending line
    Plot.line(burndownData.filter(d => d.cumulative > 0), {
      x: "day",
      y: "cumulative",
      stroke: d => d.overBudget ? "var(--theme-red)" : "var(--theme-accent)",
      strokeWidth: 3
    }),

    // Data points
    Plot.dot(burndownData.filter(d => d.cumulative > 0), {
      x: "day",
      y: "cumulative",
      fill: d => d.overBudget ? "var(--theme-red)" : "var(--theme-accent)",
      r: 4,
      tip: {
        format: {
          y: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
        }
      }
    }),

    Plot.ruleY([0])
  ]
}) : html`<p style="color: var(--theme-foreground-muted); text-align: center; padding: 2rem;">
    No budget set for ${selectedBurndownCategory} in ${selectedMonth}
  </p>`
```

## Category Breakdown

```js
// Category selection for transaction filtering
const selectedTableCategory = Mutable("All Categories");
```

```js
// Calculate spending by category
const categorySpending = d3.rollup(
  monthExpenses,
  v => d3.sum(v, d => d.amount),
  d => d.category
);

// Build category breakdown data
const categoryBreakdownData = categories.map(cat => {
  const spent = categorySpending.get(cat) || 0;
  const budget = monthBudgets.find(b => b.category === cat)?.budget_eur || 0;
  return {
    category: cat,
    spent,
    budget,
    remaining: budget - spent,
    utilization: budget > 0 ? (spent / budget * 100) : 0
  };
}).filter(d => d.spent > 0 || d.budget > 0); // Show if there's activity OR budget

// Sort by utilization descending
categoryBreakdownData.sort((a, b) => b.utilization - a.utilization);
```

```js
{
  const table = html`<table class="category-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Spent</th>
        <th>Budget</th>
        <th>Remaining</th>
        <th>Utilization</th>
      </tr>
    </thead>
    <tbody>
      <tr
        class="category-row all-categories ${selectedTableCategory === "All Categories" ? 'selected' : ''}"
        data-category="All Categories"
        style="cursor: pointer;"
      >
        <td style="font-weight: bold;">All Categories</td>
        <td>${totalSpent.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</td>
        <td>${totalBudget.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</td>
        <td style="color: ${remaining >= 0 ? 'var(--theme-accent)' : 'var(--theme-red)'}; font-weight: 600;">
          ${remaining.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}
        </td>
        <td>
          <div class="utilization-bar">
            <div class="utilization-fill" style="
              width: ${Math.min(totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0, 100)}%;
              background: ${totalSpent > totalBudget ? 'var(--theme-red)' : totalSpent / totalBudget > 0.8 ? 'orange' : 'var(--theme-accent)'};
            "></div>
            <span class="utilization-text">${totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(0) : 0}%</span>
          </div>
        </td>
      </tr>
      ${categoryBreakdownData.map(d => html`<tr
        class="category-row ${selectedTableCategory === d.category ? 'selected' : ''}"
        data-category="${d.category}"
        style="cursor: pointer;"
      >
        <td>${d.category}</td>
        <td>${d.spent.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</td>
        <td>${d.budget.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</td>
        <td style="color: ${d.remaining >= 0 ? 'var(--theme-accent)' : 'var(--theme-red)'}; font-weight: 600;">
          ${d.remaining.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}
        </td>
        <td>
          <div class="utilization-bar">
            <div class="utilization-fill" style="
              width: ${Math.min(d.utilization, 100)}%;
              background: ${d.utilization > 100 ? 'var(--theme-red)' : d.utilization > 80 ? 'orange' : 'var(--theme-accent)'};
            "></div>
            <span class="utilization-text">${d.utilization.toFixed(0)}%</span>
          </div>
        </td>
      </tr>`)}
    </tbody>
  </table>`;

  // Add event listeners to category rows
  table.querySelectorAll('.category-row').forEach(row => {
    row.addEventListener('click', () => {
      const category = row.getAttribute('data-category');
      selectedTableCategory.value = category;
    });
  });

  return table;
}
```

## Transactions

```js
// Toggle state for show all/less
const showAllTransactions = Mutable(false);
```

```js
// Filter transactions based on selected category
const filteredTransactions = monthExpenses
  .filter(e => selectedTableCategory === "All Categories" || e.category === selectedTableCategory)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Display first 10 or all based on toggle
const displayedTransactions = showAllTransactions
  ? filteredTransactions
  : filteredTransactions.slice(0, 10);
```

<div class="transactions-section">
  <h3>${selectedTableCategory !== "All Categories" ? `${selectedTableCategory} - ` : ""}${filteredTransactions.length} Transaction${filteredTransactions.length !== 1 ? 's' : ''}</h3>
  <p style="color: var(--theme-foreground-muted); margin: 0.5rem 0 1rem 0; font-size: 0.875rem;">
    Showing ${displayedTransactions.length} of ${filteredTransactions.length}
  </p>
</div>

```js
Inputs.table(displayedTransactions, {
  columns: ["date", "category", "payment_method", "amount"],
  header: {
    date: "Date",
    category: "Category",
    payment_method: "Payment Method",
    amount: "Amount"
  },
  format: {
    amount: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
  },
  width: {
    date: 100,
    category: 150,
    payment_method: 150
  }
})
```

```js
if (filteredTransactions.length > 10) {
  display(html`<button
    class="toggle-btn"
    onclick=${() => showAllTransactions.value = !showAllTransactions}
  >
    ${showAllTransactions ? "Show less" : `Show all ${filteredTransactions.length} transactions`}
  </button>`);
}
```

<style>
.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-foreground-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.card .big {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-foreground);
}

.warning-banner {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #856404;
}

.category-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.category-table thead {
  background: var(--theme-foreground-faintest);
}

.category-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--theme-foreground-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--theme-foreground-faintest);
}

.category-row:hover {
  background: var(--theme-foreground-faintest);
}

.category-row.selected {
  background: var(--theme-accent-faint);
  border-left: 3px solid var(--theme-accent);
}

.category-row.all-categories {
  border-bottom: 2px solid var(--theme-foreground-faint);
}

.utilization-bar {
  position: relative;
  height: 24px;
  background: var(--theme-foreground-faintest);
  border-radius: 4px;
  overflow: hidden;
  min-width: 100px;
}

.utilization-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.utilization-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-foreground);
  text-shadow: 0 0 2px white;
}

.toggle-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--theme-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.toggle-btn:hover {
  opacity: 0.9;
}

.transactions-section h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
