---
style: custom-style.css
---

# Monthly Budget Dashboard

```js
// Import d3 and Plot from node_modules instead of CDN
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
```

```js
// Access month parameter from URL
const month = observable.params.month;

// Load month-specific expenses and shared budgets
// Note: FileAttachment requires observable.params directly in template literal
const expenses = await FileAttachment(`data/expenses-${observable.params.month}.json`).json();
const allBudgets = await FileAttachment("data/budgets.json").json();
const allowances = await FileAttachment("data/allowances.json").json();

// Filter budgets for this month
const budgets = allBudgets.filter(b => b.month === month);
```

```js
const ALLOWANCE_PREFIX = "Allowance - ";

// Filter out allowance budgets (expenses already exclude allowances via data loader)
const nonAllowanceBudgets = budgets.filter(b => !b.category.startsWith(ALLOWANCE_PREFIX));
```

```js
// Calculate totals (expenses already exclude allowances)
const totalSpent = d3.sum(expenses, d => d.amount);
const totalBudget = d3.sum(nonAllowanceBudgets, d => d.budget_eur);
const remaining = totalBudget - totalSpent;
const transactionCount = expenses.length;

// Check if over budget
const isOverBudget = totalSpent > totalBudget;
```

```js
// Month navigation - calculate prev/next months
const [year, monthNum] = month.split("-").map(Number);

// Previous month
const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
const prevYear = monthNum === 1 ? year - 1 : year;
const prevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

// Next month
const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
const nextYear = monthNum === 12 ? year + 1 : year;
const nextMonth = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;

// Current month
const currentMonth = new Date().toISOString().slice(0, 7);
const isCurrentMonth = month === currentMonth;
```

```js
display(html`<div class="month-nav">
  <a href="/${prevMonth}" class="nav-btn">← ${prevMonth}</a>
  <h2 style="margin: 0;">${month}</h2>
  <a href="/${nextMonth}" class="nav-btn">${nextMonth} →</a>
</div>`);
```

```js
if (isOverBudget) {
  display(html`<div class="warning-banner">
    <span style="font-size: 1.25rem;">⚠️</span>
    <span>You've exceeded your budget by ${(totalSpent - totalBudget).toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}</span>
  </div>`);
}
```

```js
if (allowances.length > 0) {
  display(html`<div class="allowance-widget">
    <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: var(--theme-foreground-muted);">
      Allowance Balances (All Time)
    </h3>
    <div class="allowance-cards">
      ${allowances.map(a => html`<div class="allowance-card">
        <div class="allowance-person">${a.person}</div>
        <div class="allowance-balance" style="color: ${a.balance >= 0 ? 'var(--theme-accent)' : 'var(--theme-red)'}">
          ${a.balance.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})}
        </div>
        <div class="allowance-details">
          <span title="Total budgeted">${a.totalBudget.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})} budgeted</span>
          <span title="Total spent">${a.totalSpent.toLocaleString("fr-FR", {style: "currency", currency: "EUR"})} spent</span>
        </div>
      </div>`)}
    </div>
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
// Get all categories (excluding allowances)
const categories = [...new Set(expenses.map(e => e.category))]
  .filter(cat => cat && !cat.startsWith(ALLOWANCE_PREFIX))
  .sort();

// Category filter for burndown chart
const selectedBurndownCategory = view(Inputs.select(
  ["All Categories", ...categories],
  {label: "Category Filter", value: "All Categories"}
));
```

```js
// Filter expenses for burndown (expenses already exclude allowances)
const burndownExpenses = expenses.filter(e =>
  selectedBurndownCategory === "All Categories" || e.category === selectedBurndownCategory
);

// Get budget total for selected category (excluding allowances)
const budgetTotal = selectedBurndownCategory === "All Categories"
  ? d3.sum(nonAllowanceBudgets, b => b.budget_eur)
  : nonAllowanceBudgets.find(b => b.category === selectedBurndownCategory)?.budget_eur || 0;

// Calculate days in month
const daysInMonth = new Date(year, monthNum, 0).getDate();

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
    No budget set for ${selectedBurndownCategory} in ${month}
  </p>`
```

## Category Breakdown

```js
// Category selection for transaction filtering
const selectedTableCategory = Mutable("All Categories");
```

```js
// Calculate spending by category (expenses already exclude allowances)
const categorySpending = d3.rollup(
  expenses,
  v => d3.sum(v, d => d.amount),
  d => d.category
);

// Build category breakdown data
const categoryBreakdownData = categories.map(cat => {
  const spent = categorySpending.get(cat) || 0;
  const budget = nonAllowanceBudgets.find(b => b.category === cat)?.budget_eur || 0;
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
display(html`<table class="category-table">
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
      onclick=${() => selectedTableCategory.value = "All Categories"}
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
      onclick=${() => selectedTableCategory.value = d.category}
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
</table>`);
```

## Transactions

```js
// Toggle state for show all/less
const showAllTransactions = Mutable(false);
```

```js
// Filter transactions based on selected category
const filteredTransactions = expenses
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
