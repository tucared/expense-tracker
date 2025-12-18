import * as fs from "node:fs";
import * as path from "node:path";

const ECB_API_BASE = "https://data-api.ecb.europa.eu/service/data/EXR/D.BRL.EUR.SP00.A";
const CACHE_DIR = "src/.observablehq/cache/data";
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Convert an amount to EUR using ECB historical exchange rates
 * @param {number} amount - The amount to convert
 * @param {string} currency - The source currency (e.g., "BRL")
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<number>} - The converted amount in EUR
 */
export async function convertToEUR(amount, currency, date) {
  // If already in EUR or no conversion needed, return as-is
  if (currency === "EUR" || !currency) {
    return amount;
  }

  // Only BRL is supported for now
  if (currency !== "BRL") {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Validate date format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn(`Invalid date format: ${date}, skipping conversion`);
    return amount;
  }

  // Extract year-month for caching
  const yearMonth = date.substring(0, 7); // "2025-01"

  try {
    // Fetch rates for the month
    const rates = await fetchMonthRates(yearMonth);

    // Get rate for specific date with fallback
    const rate = getRateForDate(date, rates);

    // Convert: BRL amount / rate = EUR amount
    // ECB rate format: 1 EUR = X BRL, so divide to convert BRL to EUR
    const converted = amount / rate;

    console.warn(
      `Converted ${amount} BRL to ${converted.toFixed(2)} EUR using rate ${rate} (1 EUR = ${rate} BRL) on ${date}`
    );

    return converted;
  } catch (error) {
    console.warn(
      `Failed to convert ${amount} BRL on ${date}: ${error.message}`
    );
    // Return original amount (unconverted) - graceful degradation
    return amount;
  }
}

/**
 * Fetch first available rate per month for a range of years (optimized for allowances)
 * Caches per year for better organization
 * @param {string} startYear - Starting year (YYYY)
 * @param {string} endYear - Ending year (YYYY)
 * @returns {Promise<Object>} - Map of yearMonth to exchange rate
 */
export async function fetchYearlyMonthlyRates(startYear, endYear) {
  const allMonthlyRates = {};
  const start = parseInt(startYear);
  const end = parseInt(endYear);

  // Fetch and cache per year
  for (let year = start; year <= end; year++) {
    const yearRates = await fetchYearRates(year.toString());
    Object.assign(allMonthlyRates, yearRates);
  }

  console.warn(`Loaded ${Object.keys(allMonthlyRates).length} monthly BRL/EUR rates (${startYear}-${endYear})`);
  return allMonthlyRates;
}

/**
 * Fetch rates for a single year (with per-year caching)
 * @param {string} year - Year in YYYY format
 * @returns {Promise<Object>} - Map of yearMonth to exchange rate for this year
 */
async function fetchYearRates(year) {
  const cacheFile = path.join(CACHE_DIR, `ecb-rates-${year}.json`);

  // Try to read from cache
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      return cached.rates;
    }
  } catch (error) {
    console.warn(`Failed to read cache for ${year}, fetching fresh data`);
  }

  // Fetch from ECB API for this year
  const url = `${ECB_API_BASE}?startPeriod=${year}&endPeriod=${year}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `ECB API returned ${response.status}: ${response.statusText}`
      );
    }

    const xmlText = await response.text();
    const allRates = parseECBXML(xmlText);

    // Extract first available date per month (sorted chronologically)
    const sortedDates = Object.keys(allRates).sort();
    const monthlyRates = {};

    for (const date of sortedDates) {
      const yearMonth = date.substring(0, 7);
      if (!monthlyRates[yearMonth]) {
        monthlyRates[yearMonth] = allRates[date];
      }
    }

    // Cache the results
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const cacheData = {
        year,
        fetchedAt: new Date().toISOString(),
        rates: monthlyRates,
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.warn(`Cached ECB rates for ${year} (${Object.keys(monthlyRates).length} months)`);
    } catch (error) {
      console.warn(`Failed to cache rates for ${year}: ${error.message}`);
    }

    return monthlyRates;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error(`ECB API request timed out after ${API_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Fetch all exchange rates for a given month, with caching
 * @param {string} yearMonth - The month in YYYY-MM format
 * @returns {Promise<Object>} - Map of date to exchange rate
 */
async function fetchMonthRates(yearMonth) {
  const cacheFile = path.join(CACHE_DIR, `ecb-rates-${yearMonth}.json`);

  // Try to read from cache
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      console.warn(`Using cached ECB rates for ${yearMonth}`);
      return cached.rates;
    }
  } catch (error) {
    console.warn(`Failed to read cache for ${yearMonth}, fetching fresh data`);
    // Continue to fetch fresh data
  }

  // Fetch from ECB API
  console.warn(`Fetching ECB rates for ${yearMonth} from API...`);
  const url = `${ECB_API_BASE}?startPeriod=${yearMonth}&endPeriod=${yearMonth}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `ECB API returned ${response.status}: ${response.statusText}`
      );
    }

    const xmlText = await response.text();
    const rates = parseECBXML(xmlText);

    // Cache the results
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const cacheData = {
        month: yearMonth,
        fetchedAt: new Date().toISOString(),
        rates: rates,
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.warn(`Cached ECB rates for ${yearMonth}`);
    } catch (error) {
      console.warn(`Failed to cache rates: ${error.message}`);
      // Continue without caching - not critical
    }

    return rates;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error(`ECB API request timed out after ${API_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Parse ECB XML response to extract exchange rates
 * @param {string} xmlText - The XML response from ECB API
 * @returns {Object} - Map of date (YYYY-MM-DD) to exchange rate
 */
function parseECBXML(xmlText) {
  const rates = {};

  // Simple regex-based parsing for ECB's predictable XML format
  // Format: <generic:Obs><generic:ObsDimension value="2024-01-15"/><generic:ObsValue value="5.4321"/></generic:Obs>
  const obsRegex =
    /<generic:ObsDimension[^>]*value="([^"]+)"[^>]*\/>\s*<generic:ObsValue[^>]*value="([^"]+)"/g;

  let match;
  while ((match = obsRegex.exec(xmlText)) !== null) {
    const date = match[1];
    const rate = parseFloat(match[2]);

    if (date && !isNaN(rate)) {
      rates[date] = rate;
    }
  }

  if (Object.keys(rates).length === 0) {
    throw new Error("No rates found in ECB XML response");
  }

  return rates;
}

/**
 * Get exchange rate for a specific date using ASOF (as-of) logic
 * If exact date not found, uses the most recent previous date with a rate
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {Object} rates - Map of date to exchange rate
 * @returns {number} - The exchange rate
 */
function getRateForDate(date, rates) {
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
    console.warn(
      `Rate for ${date} not found, using ASOF date ${asofDate} (rate: ${rates[asofDate]})`
    );
    return rates[asofDate];
  }

  // No rate found before this date
  throw new Error(
    `No exchange rate found for ${date} or any previous date`
  );
}
