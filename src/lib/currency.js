/**
 * Client-side currency conversion utilities
 * Converts expenses from original currencies (BRL) to EUR using ECB exchange rates
 */

/**
 * Get exchange rate for a specific date using ASOF (as-of) logic
 * If exact date not found, uses the most recent previous date with a rate
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {Object} rates - Map of date to exchange rate
 * @returns {number} - The exchange rate, or null if not found
 */
export function getRateForDate(date, rates) {
  // Try exact date first
  if (rates[date]) {
    return rates[date];
  }

  // ASOF join: find the most recent date <= requested date
  const sortedDates = Object.keys(rates).sort();
  let asofDate = null;

  for (const availableDate of sortedDates) {
    if (availableDate <= date) {
      asofDate = availableDate;
    } else {
      break; // Dates are sorted, no need to continue
    }
  }

  if (asofDate) {
    return rates[asofDate];
  }

  // No rate found before this date
  return null;
}

/**
 * Convert a single expense to EUR
 * @param {Object} expense - Expense with amountEUR, amountBRL, isCredit fields
 * @param {Object} rates - Map of date (YYYY-MM-DD) to exchange rate
 * @returns {number} - Amount in EUR
 */
export function convertExpenseToEUR(expense, rates) {
  let amount = expense.amountEUR || 0;

  // If has BRL amount and no EUR amount, convert it
  if (expense.amountBRL > 0 && expense.amountEUR === 0) {
    const rate = getRateForDate(expense.date, rates);
    if (rate) {
      // ECB rate format: 1 EUR = X BRL, so divide to convert BRL to EUR
      amount = expense.amountBRL / rate;
    } else {
      console.warn(`No rate found for ${expense.date}, using BRL amount as-is`);
      amount = expense.amountBRL;
    }
  }

  // Apply credit/refund logic: credits are negative
  if (expense.isCredit) {
    amount = -Math.abs(amount);
  }

  // Round to 2 decimals
  return Math.round(amount * 100) / 100;
}

/**
 * Convert an array of expenses to EUR
 * Returns new array with 'amount' field (in EUR) added to each expense
 * @param {Array} expenses - Array of expenses
 * @param {Object} rates - Map of date (YYYY-MM-DD) to exchange rate
 * @returns {Array} - Array of expenses with 'amount' field
 */
export function convertExpensesToEUR(expenses, rates) {
  return expenses.map(expense => ({
    ...expense,
    amount: convertExpenseToEUR(expense, rates)
  }));
}
