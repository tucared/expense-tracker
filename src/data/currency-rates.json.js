// Currency rates data loader: fetches BRL/EUR exchange rates from ECB
// Fetches daily rates for accurate ASOF (as-of) conversion
// Returns map of date (YYYY-MM-DD) to exchange rate

const ECB_API_BASE = "https://data-api.ecb.europa.eu/service/data/EXR/D.BRL.EUR.SP00.A";
const API_TIMEOUT = 10000; // 10 seconds

// Configure year range based on your data
const START_YEAR = 2020;
const END_YEAR = new Date().getFullYear();

/**
 * Fetch all exchange rates for a given year
 * @param {number} year - The year to fetch
 * @returns {Promise<Object>} - Map of date (YYYY-MM-DD) to exchange rate
 */
async function fetchYearRates(year) {
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
    const rates = parseECBXML(xmlText);

    console.warn(`Fetched ${Object.keys(rates).length} daily rates for ${year}`);

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

// Fetch rates for all years
const allRates = {};

for (let year = START_YEAR; year <= END_YEAR; year++) {
  try {
    const yearRates = await fetchYearRates(year);
    Object.assign(allRates, yearRates);
  } catch (error) {
    console.error(`Failed to fetch rates for ${year}: ${error.message}`);
    // Continue with other years even if one fails
  }
}

console.warn(`Total: ${Object.keys(allRates).length} daily BRL/EUR rates (${START_YEAR}-${END_YEAR})`);
process.stdout.write(JSON.stringify(allRates, null, 2));
