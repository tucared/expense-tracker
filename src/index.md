# Redirecting...

```js
// Load available months and redirect to the most recent one with data
const availableMonths = FileAttachment("data/available-months.json").json();
const lastMonth = (await availableMonths)[0]; // First element is most recent (descending order)
window.location.replace(`/${lastMonth}`);
```

<p>Redirecting to latest month with data: <a href="/${lastMonth}">${lastMonth}</a></p>

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
