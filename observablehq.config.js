import { generateMonthList } from "./src/lib/month-utils.js";

export default {
  title: "Expense Tracker",
  root: "src",
  theme: "dashboard",
  toc: false,
  pager: false,
  footer: "",
  // Force Observable to use node_modules instead of CDN for npm: imports
  npm: true,

  // Generate dynamic routes for each month
  async *dynamicPaths() {
    try {
      const months = generateMonthList();
      console.warn(
        `Generating routes for ${months.length} months: ${months.join(", ")}`
      );

      for (const month of months) {
        yield `/${month}`;
      }
    } catch (error) {
      console.error(`Failed to generate dynamic paths: ${error.message}`);
      // Fallback: at minimum generate current month
      yield `/${new Date().toISOString().slice(0, 7)}`;
    }
  },
};
