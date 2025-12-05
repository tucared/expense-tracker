# Dashboard

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
// Get current month
const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
const currentMonth = months[0];

// Filter to current month
const monthExpenses = expenses.filter(e => e.date?.startsWith(currentMonth));
const monthBudgets = budgets.filter(b => b.month === currentMonth);

// Calculate totals
const totalSpent = d3.sum(monthExpenses, d => d.amount);
const totalBudget = d3.sum(monthBudgets, d => d.budget_eur);
const remaining = totalBudget - totalSpent;
const transactionCount = monthExpenses.length;
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

## Spending Overview

```js
// Monthly spending by category
const categorySpending = d3.rollup(
  monthExpenses,
  v => d3.sum(v, d => d.amount),
  d => d.category
);

const categoryData = [...categorySpending].map(([category, spent]) => ({
  category,
  spent
})).sort((a, b) => b.spent - a.spent);
```

```js
Plot.plot({
  height: 300,
  marginLeft: 100,
  x: {label: "EUR", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(categoryData, {
      y: "category",
      x: "spent",
      fill: "category",
      sort: {y: "-x"},
      tip: {
        format: {
          x: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
        }
      }
    }),
    Plot.ruleX([0])
  ]
})
```

## Recent Transactions

```js
// Sort expenses by date descending and take first 10
const recentExpenses = [...monthExpenses]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 10);
```

```js
Inputs.table(recentExpenses, {
  columns: ["date", "description", "category", "amount"],
  header: {
    date: "Date",
    description: "Description",
    category: "Category",
    amount: "Amount"
  },
  format: {
    amount: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
  }
})
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
</style>
