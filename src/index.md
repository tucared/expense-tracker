# Expense Tracker

```js
import {csvFormat} from "d3-dsv";

const expenses = FileAttachment("data/expenses.json").json();
const budgets = FileAttachment("data/budgets.json").json();
```

```js
// Compute current month in YYYY-MM format
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// Filter expenses for current month
const currentMonthExpenses = expenses.filter(e => e.date?.startsWith(currentMonth));

// Total spent this month
const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

// Current month budgets
const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);
const totalBudget = currentMonthBudgets.reduce((sum, b) => sum + b.budget_eur, 0);

// Spending by category this month
const spendingByCategory = d3.rollup(
  currentMonthExpenses,
  v => d3.sum(v, d => d.amount),
  d => d.category
);

// Merge with budgets
const categoryData = currentMonthBudgets.map(b => ({
  category: b.category,
  budget: b.budget_eur,
  spent: spendingByCategory.get(b.category) || 0,
  remaining: b.budget_eur - (spendingByCategory.get(b.category) || 0)
}));
```

<div class="grid grid-cols-3">
  <div class="card">
    <h2>Spent</h2>
    <span class="big">${totalSpent.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Budget</h2>
    <span class="big">${totalBudget.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Remaining</h2>
    <span class="big" style="color: ${totalBudget - totalSpent >= 0 ? 'var(--theme-green)' : 'var(--theme-red)'}">
      ${(totalBudget - totalSpent).toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}
    </span>
  </div>
</div>

## Budget vs Actual by Category

```js
Plot.plot({
  marginLeft: 120,
  marginRight: 40,
  height: Math.max(300, categoryData.length * 40),
  x: {label: "EUR", grid: true},
  y: {label: null},
  color: {
    domain: ["Budget", "Spent"],
    range: ["#e0e0e0", "var(--theme-accent)"]
  },
  marks: [
    Plot.barX(categoryData, {
      y: "category",
      x: "budget",
      fill: "#e0e0e0",
      tip: true
    }),
    Plot.barX(categoryData, {
      y: "category",
      x: "spent",
      fill: d => d.spent > d.budget ? "var(--theme-red)" : "var(--theme-accent)",
      tip: true
    }),
    Plot.ruleX([0])
  ]
})
```

## Daily Spending This Month

```js
// Aggregate by day
const dailySpending = d3.rollup(
  currentMonthExpenses,
  v => d3.sum(v, d => d.amount),
  d => d.date
);

const dailyData = Array.from(dailySpending, ([date, amount]) => ({date: new Date(date), amount}))
  .sort((a, b) => a.date - b.date);

// Cumulative spending
let cumulative = 0;
const cumulativeData = dailyData.map(d => {
  cumulative += d.amount;
  return {...d, cumulative};
});
```

```js
Plot.plot({
  height: 300,
  x: {label: "Date", type: "time"},
  y: {label: "EUR", grid: true},
  marks: [
    Plot.areaY(cumulativeData, {x: "date", y: "cumulative", fill: "var(--theme-accent)", fillOpacity: 0.2}),
    Plot.lineY(cumulativeData, {x: "date", y: "cumulative", stroke: "var(--theme-accent)", strokeWidth: 2}),
    Plot.ruleY([totalBudget], {stroke: "var(--theme-accent-secondary)", strokeDasharray: "5,5", strokeWidth: 2}),
    Plot.dot(cumulativeData, {x: "date", y: "cumulative", fill: "var(--theme-accent)", tip: true})
  ]
})
```

<p style="text-align: center; color: var(--theme-foreground-muted); font-size: 0.85rem;">
  Dashed line = monthly budget target
</p>

## Recent Expenses

```js
const recentExpenses = expenses.slice(0, 20);
```

```js
Inputs.table(recentExpenses, {
  columns: ["date", "category", "amount", "payment_method"],
  header: {
    date: "Date",
    category: "Category",
    amount: "Amount (EUR)",
    payment_method: "Payment"
  },
  format: {
    amount: d => d.toLocaleString("fr-FR", {minimumFractionDigits: 2})
  },
  width: {
    date: 100,
    category: 150,
    amount: 100,
    payment_method: 100
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
  font-size: 2rem;
  font-weight: 600;
  color: var(--theme-foreground);
}
</style>
