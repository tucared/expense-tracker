// Google Sheets API loader for budgets with service account authentication
// Runs at build time in GitHub Actions

const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SHEETS_RANGE = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:C";

if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_SHEETS_ID) {
  console.warn("Google Sheets credentials not found. No budget data loaded.");
  console.log(JSON.stringify([]));
  process.exit(0);
}

// Parse service account credentials
let credentials;
try {
  credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
} catch (error) {
  console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT JSON:", error.message);
  console.log(JSON.stringify([]));
  process.exit(0);
}

// Generate JWT for service account authentication
async function getAccessToken() {
  const { client_email, private_key } = credentials;

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claim = {
    iss: client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Import crypto for signing
  const crypto = await import("crypto");

  const headerBase64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const claimBase64 = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signatureInput = `${headerBase64}.${claimBase64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(private_key, "base64url");

  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchBudgets() {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodeURIComponent(GOOGLE_SHEETS_RANGE)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  // Skip header row, parse remaining rows
  // Expected format: month, category, budget_eur
  const budgets = rows.slice(1).map((row) => ({
    month: row[0] || "",
    category: row[1] || "",
    budget_eur: parseFloat(row[2]) || 0,
  }));

  return budgets.filter((b) => b.month && b.category);
}

// Fetch budgets with fallback to sample data on error
let budgets;
try {
  budgets = await fetchBudgets();
  console.warn(`Fetched ${budgets.length} budgets from Google Sheets`);
} catch (error) {
  console.error(`Failed to fetch budgets: ${error.message}`);
  console.warn("Falling back to sample data");

  // Load sample data
  const fs = await import("fs");
  const path = await import("path");
  const samplePath = path.join(import.meta.dirname, "sample-budgets.json");
  const sampleData = fs.readFileSync(samplePath, "utf-8");
  budgets = JSON.parse(sampleData);
}

console.log(JSON.stringify(budgets));
