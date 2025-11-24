export default {
  title: "Expense Tracker",
  pages: [
    { name: "Dashboard", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Trends", path: "/trends" }
  ],
  theme: "dashboard",
  toc: false,
  pager: false,
  footer: "",
  head: `<style>
    :root {
      --theme-foreground: #1a1a2e;
      --theme-background: #fafafa;
      --theme-accent: #e94560;
      --theme-accent-secondary: #0f3460;
    }
  </style>`
};
