# Redirecting...

```js
// Redirect to current month (simplest approach - page will 404 if no data)
const currentMonth = new Date().toISOString().slice(0, 7);
window.location.replace(`/${currentMonth}`);
```

<p>Redirecting to latest month: <a href="/${currentMonth}">${currentMonth}</a></p>

<style>
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: var(--sans-serif);
  text-align: center;
}
</style>
