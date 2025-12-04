# Trends

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
// Monthly aggregation
const monthlySpending = d3.rollup(
  expenses,
  v => d3.sum(v, d => d.amount),
  d => d.date?.slice(0, 7)
);

const monthlyBudgets = d3.rollup(
  budgets,
  v => d3.sum(v, d => d.budget_eur),
  d => d.month
);

const allMonths = [...new Set([...monthlySpending.keys(), ...monthlyBudgets.keys()])]
  .filter(Boolean)
  .sort();

const monthlyData = allMonths.map(month => ({
  month: new Date(month + "-01"),
  spent: monthlySpending.get(month) || 0,
  budget: monthlyBudgets.get(month) || 0
}));
```

## Monthly Spending vs Budget

```js
Plot.plot({
  height: 400,
  x: {label: null, type: "time"},
  y: {label: "EUR", grid: true},
  color: {legend: true},
  marks: [
    Plot.line(monthlyData, {x: "month", y: "budget", stroke: "var(--theme-accent-secondary)", strokeWidth: 2, strokeDasharray: "5,5"}),
    Plot.areaY(monthlyData, {x: "month", y: "spent", fill: "var(--theme-accent)", fillOpacity: 0.3}),
    Plot.line(monthlyData, {x: "month", y: "spent", stroke: "var(--theme-accent)", strokeWidth: 2}),
    Plot.dot(monthlyData, {x: "month", y: "spent", fill: "var(--theme-accent)", tip: {
      format: {
        y: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
      }
    }})
  ]
})
```

<p style="text-align: center; color: var(--theme-foreground-muted); font-size: 0.85rem;">
  Solid line = spending · Dashed line = budget
</p>

## Category Trends Over Time

```js
// Monthly spending by category
const monthlyCategorySpending = d3.flatRollup(
  expenses,
  v => d3.sum(v, d => d.amount),
  d => d.date?.slice(0, 7),
  d => d.category
).map(([month, category, amount]) => ({
  month: new Date(month + "-01"),
  category,
  amount
})).filter(d => !isNaN(d.month));
```

```js
Plot.plot({
  height: 400,
  x: {label: null, type: "time"},
  y: {label: "EUR", grid: true},
  color: {legend: true},
  marks: [
    Plot.areaY(monthlyCategorySpending, {
      x: "month",
      y: "amount",
      fill: "category",
      tip: true
    }),
    Plot.ruleY([0])
  ]
})
```

## Year-over-Year Comparison

```js
// Extract year and month-of-year
const yearlyData = expenses.map(e => ({
  ...e,
  year: e.date?.slice(0, 4),
  monthOfYear: parseInt(e.date?.slice(5, 7))
})).filter(e => e.year && e.monthOfYear);

// Aggregate by year and month
const yoyData = d3.flatRollup(
  yearlyData,
  v => d3.sum(v, d => d.amount),
  d => d.year,
  d => d.monthOfYear
).map(([year, month, amount]) => ({year, month, amount}));

const years = [...new Set(yoyData.map(d => d.year))].sort().reverse();
```

```js
Plot.plot({
  height: 400,
  x: {
    label: "Month",
    tickFormat: d => ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d]
  },
  y: {label: "EUR", grid: true},
  color: {legend: true, domain: years},
  marks: [
    Plot.line(yoyData, {
      x: "month",
      y: "amount",
      stroke: "year",
      strokeWidth: 2,
      tip: true
    }),
    Plot.dot(yoyData, {
      x: "month",
      y: "amount",
      fill: "year"
    })
  ]
})
```

## Statistics

```js
const totalAllTime = d3.sum(expenses, d => d.amount);
const avgMonthly = totalAllTime / allMonths.length;
const maxMonth = d3.max(monthlyData, d => d.spent);
const minMonth = d3.min(monthlyData.filter(d => d.spent > 0), d => d.spent);
```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Total All Time</h2>
    <span class="big">${totalAllTime.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>
  <div class="card">
    <h2>Avg. Monthly</h2>
    <span class="big">${avgMonthly.toLocaleString("fr-FR", {style: "currency", currency: "EUR", maximumFractionDigits: 0})}</span>
  </div>
  <div class="card">
    <h2>Highest Month</h2>
    <span class="big">${maxMonth?.toLocaleString("fr-FR", {style: "currency", currency: "EUR"}) || "—"}</span>
  </div>
  <div class="card">
    <h2>Lowest Month</h2>
    <span class="big">${minMonth?.toLocaleString("fr-FR", {style: "currency", currency: "EUR"}) || "—"}</span>
  </div>
</div>

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
