// Currency rates data loader: fetches BRL/EUR exchange rates from ECB
// This is a dedicated loader that exports monthly rates for visualization
// Uses the shared currency converter library

import { fetchYearlyMonthlyRates } from "../lib/currency-converter.js";

// Configure year range based on your data
const START_YEAR = 2020;
const END_YEAR = new Date().getFullYear();

// Fetch and export rates as JSON
const rates = await fetchYearlyMonthlyRates(START_YEAR.toString(), END_YEAR.toString());
process.stdout.write(JSON.stringify(rates, null, 2));
