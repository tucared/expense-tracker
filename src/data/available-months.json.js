import { generateMonthList } from "../lib/month-utils.js";

const months = generateMonthList();

process.stdout.write(JSON.stringify(months, null, 2));
