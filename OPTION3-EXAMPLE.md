# Option 3: Keep Observable Framework, Remove CDN Dependencies

## What "Observable stays in the stack" means:

**YES** - Observable Framework remains:
- ✅ `@observablehq/framework` package stays in dependencies
- ✅ `npm run build` still uses Observable
- ✅ You still write `.md` files in `src/`
- ✅ Observable still processes your markdown

**BUT** - Change how you import libraries:

## Current Approach (Requires CDN - FAILS)

```javascript
// src/categories.md - CURRENT (broken)
```js
// Observable auto-imports d3 from CDN
const categorySpending = d3.rollup(expenses, ...);
Plot.plot({...});
```

**What happens:**
```
Observable sees "d3" → tries to fetch npm:d3@latest from esm.sh → 403 Forbidden
```

## Option 3 Approaches:

### Approach A: Explicit Local Imports

```javascript
// src/categories.md - MODIFIED
```js
import * as d3 from "d3";  // ← Use the d3 we installed in node_modules
import * as Plot from "@observablehq/plot";

const categorySpending = d3.rollup(expenses, ...);
Plot.plot({...});
```

**Configuration needed:**
```javascript
// observablehq.config.js
export default {
  // ... existing config
  // Tell Observable to resolve npm: imports from node_modules
  npm: true  // or npmInstall: true
};
```

### Approach B: Vendor JavaScript Files

```javascript
// 1. Create src/lib/d3-bundle.js with all d3 code
// 2. Use FileAttachment in markdown

```js
const d3 = await FileAttachment("lib/d3-bundle.js").json();
const categorySpending = d3.rollup(expenses, ...);
```

### Approach C: Use Built-in Observable Features Only

Observable Framework has built-in utilities. Remove d3 usage:

```javascript
// src/categories.md - NO EXTERNAL DEPS
```js
// Use native JavaScript instead of d3.rollup
const categorySpending = expenses.reduce((acc, e) => {
  acc[e.category] = (acc[e.category] || 0) + e.amount;
  return acc;
}, {});

// Use Observable's built-in Plot (if it doesn't require CDN)
Plot.plot({...});
```

## Summary

**Observable Framework = The Tool** ✅ Stays
- It's the static site generator
- Processes `.md` files → HTML
- Provides built-ins like `FileAttachment`, `Inputs`

**npm: auto-imports = The Problem** ❌ Remove
- When you use `d3` without importing it
- Observable tries to fetch from CDN
- This is what fails

**Option 3 = Keep the tool, change the pattern**
- Write imports explicitly
- Or bundle dependencies locally
- Or use only Observable's built-in features

The "stack" (Observable Framework) stays. You just change **how** you load external libraries.
