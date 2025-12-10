export default {
  title: "Expense Tracker",
  root: "src",
  pages: [
    { name: "Dashboard", path: "/" }
  ],
  theme: "dashboard",
  toc: false,
  pager: false,
  footer: "",
  // Force Observable to use node_modules instead of CDN for npm: imports
  npm: true
};
