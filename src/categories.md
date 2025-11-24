# Categories

```js
const expenses = FileAttachment("data/expenses.json").json();
const budgets = FileAttachment("data/budgets.json").json();
```

```js
// Get unique categories
const categories = [...new Set(expenses.map(e => e.category))].sort();

// Month selector
const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
const selectedMonth = view(Inputs.select(months, {label: "Month", value: months[0]}));
```

```js
// Filter data
const monthExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
const monthBudgets = budgets.filter(b => b.month === selectedMonth);

// Spending by category
const categorySpending = d3.rollup(
  monthExpenses,
  v => d3.sum(v, d => d.amount),
  d => d.category
);

const categoryData = categories.map(cat => ({
  category: cat,
  spent: categorySpending.get(cat) || 0,
  budget: monthBudgets.find(b => b.category === cat)?.budget_eur || 0
})).filter(d => d.spent > 0 || d.budget > 0);

const totalSpent = d3.sum(categoryData, d => d.spent);
```

## Spending Distribution

```js
Plot.plot({
  height: 400,
  marginLeft: 20,
  marginRight: 20,
  x: {label: null},
  y: {label: null},
  marks: [
    Plot.barY(categoryData, {
      x: "category",
      y: "spent",
      fill: "category",
      sort: {x: "-y"},
      tip: {
        format: {
          y: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})
        }
      }
    }),
    Plot.ruleY([0])
  ]
})
```

## Category Breakdown

```js
// Pie chart data
const pieData = categoryData
  .filter(d => d.spent > 0)
  .map(d => ({...d, percentage: (d.spent / totalSpent * 100).toFixed(1)}));
```

```js
Plot.plot({
  height: 400,
  width: 400,
  projection: {type: "identity", domain: [[-1.2, -1.2], [1.2, 1.2]]},
  color: {legend: true},
  marks: [
    Plot.arc(pieData, Plot.stackX({
      x: "spent",
      fill: "category",
      tip: {
        format: {
          x: d => `${d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}`
        }
      }
    }))
  ]
})
```

## Budget Performance

```js
const performanceData = categoryData.map(d => ({
  ...d,
  utilization: d.budget > 0 ? (d.spent / d.budget * 100) : null,
  status: d.budget === 0 ? "No budget" : d.spent > d.budget ? "Over budget" : d.spent > d.budget * 0.8 ? "Warning" : "On track"
}));
```

```js
Inputs.table(performanceData, {
  columns: ["category", "spent", "budget", "utilization", "status"],
  header: {
    category: "Category",
    spent: "Spent",
    budget: "Budget",
    utilization: "Used %",
    status: "Status"
  },
  format: {
    spent: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"}),
    budget: d => d.toLocaleString("fr-FR", {style: "currency", currency: "EUR"}),
    utilization: d => d !== null ? `${d.toFixed(0)}%` : "—"
  },
  sort: "utilization",
  reverse: true
})
```
