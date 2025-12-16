// Generate list of months for expense tracking without API calls
// Used by both dynamicPaths (build-time) and data loaders

/**
 * Generates last N months from current date
 * @param {number} n - Number of months to generate
 * @returns {string[]} Array of months in YYYY-MM format, descending order
 */
function generateLastNMonths(n) {
  const months = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push(month);
  }

  return months; // Already in descending order
}

/**
 * Generates list of months from FIRST_EXPENSE_MONTH env var to current month
 * Falls back to last 6 months if env var not set or invalid
 * @returns {string[]} Array of months in YYYY-MM format, descending order (newest first)
 */
export function generateMonthList() {
  const firstMonth = process.env.FIRST_EXPENSE_MONTH;

  // Validate format YYYY-MM
  if (!firstMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(firstMonth)) {
    if (!firstMonth) {
      console.warn(
        "FIRST_EXPENSE_MONTH env var not set, using last 6 months as fallback"
      );
    } else {
      console.warn(
        `FIRST_EXPENSE_MONTH has invalid format: "${firstMonth}" (expected YYYY-MM), using last 6 months as fallback`
      );
    }
    return generateLastNMonths(6);
  }

  // Parse firstMonth
  const [startYear, startMonth] = firstMonth.split("-").map(Number);

  // Get current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  // Check if firstMonth is in the future
  const isFuture =
    startYear > currentYear ||
    (startYear === currentYear && startMonth > currentMonth);

  if (isFuture) {
    console.warn(
      `FIRST_EXPENSE_MONTH is in the future: "${firstMonth}", using current month only`
    );
    return [new Date().toISOString().slice(0, 7)];
  }

  // Generate array of months from firstMonth to current month
  const months = [];
  let year = startYear;
  let month = startMonth;

  while (
    year < currentYear ||
    (year === currentYear && month <= currentMonth)
  ) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  // Return descending order (newest first)
  const result = months.reverse();
  console.warn(
    `Generated ${result.length} months from ${firstMonth} to ${result[0]}`
  );
  return result;
}
