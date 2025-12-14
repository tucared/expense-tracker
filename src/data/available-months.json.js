import { getAvailableMonths } from "../lib/notion-months.js";

// Data loader that exports available months for client-side use
const months = await getAvailableMonths();

process.stdout.write(JSON.stringify(months, null, 2));
