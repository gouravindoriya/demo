/**
 * Test cases demonstrating edge case handling
 * Run in browser console or with Jest
 */

import {
  parseRates,
  toNumberOrNull,
  findByLabel,
  validateData,
} from './dataParser.js';

// Test 1: Missing price field (marked as "-")
const TEST_MISSING_FIELD = `
  2766  GOLD 99.50 RTGS 10-GM  -  154325  155012  152480
  2768  SILVER CUT 9999 RTGS-1 KG  -  248099  248898  242225
`;

console.log('=== Test 1: Missing Price Fields ===');
const result1 = parseRates(TEST_MISSING_FIELD, { logWarnings: true });
console.log('Parsed:', result1);
console.log('Item 1 buy price:', result1[0].buy); // Should be null
console.log('Item 1 sell price:', result1[0].sell); // Should be 154325
console.log('---');

// Test 2: Variable field count
const TEST_VARIABLE_FIELDS = `
  2750  GOLD COMEX($)  4616.60  4617.35  4629.90  4540.50
  2751  SILVER COMEX($)  73.34  73.37  73.62
  2752  INR EX(₹)  95.13  95.18
`;

console.log('=== Test 2: Variable Field Count ===');
const result2 = parseRates(TEST_VARIABLE_FIELDS, { 
  minFields: 2,
  maxFields: 6,
  logWarnings: true 
});
console.log('Parsed:', result2);
console.log('GOLD has 4 fields:', result2[0].rawPrices.length);
console.log('SILVER has 3 fields:', result2[1].rawPrices.length);
console.log('INR has 2 fields:', result2[2].rawPrices.length);
console.log('---');

// Test 3: Label variations (different months)
const FULL_DATA = `
  2750  GOLD COMEX($)  4616.60  4617.35  4629.90  4540.50
  2751  SILVER COMEX($)  73.34  73.37  73.62  71.19
  2752  INR EX(₹)  95.13  95.18  95.33  94.82
  2755  GOLD 99.50-10 GM  151975  153475  153962  151930
  2767  SILVER CUT 9999-1 KG  242099  247099  248500  242725
  3228  GOLD JEWAR 22 CT  141405  142905  143541  141196
`;

console.log('=== Test 3: Label Aliases ===');
const parsed3 = parseRates(FULL_DATA);

// Should find GOLD COMEX despite format variations
const goldComex = findByLabel(parsed3, 'goldComex');
console.log('Found GOLD COMEX:', goldComex ? goldComex.label : 'NOT FOUND');

// Should find alternative silver labels
const silverGwalior = findByLabel(parsed3, 'silverCut');
console.log('Found SILVER CUT:', silverGwalior ? silverGwalior.label : 'NOT FOUND');

// Should find jewelry gold as fallback
const goldJewar = findByLabel(parsed3, 'goldJewar22');
console.log('Found GOLD JEWAR 22 CT:', goldJewar ? goldJewar.label : 'NOT FOUND');
console.log('---');

// Test 4: Missing commodity (graceful degradation)
console.log('=== Test 4: Missing Commodity ===');
const notFound = findByLabel(parsed3, 'silverRTGS');
console.log('SILVER RTGS (not in data):', notFound); // Should be null
console.log('Component would display "-" for this rate');
console.log('---');

// Test 5: Validation
console.log('=== Test 5: Data Validation ===');
const testDataWithIssues = [
  {
    id: '2750',
    label: 'GOLD COMEX($)',
    rawPrices: [4616.60, 4617.35, 4629.90, 4540.50],
    buy: 4616.60,
    sell: 4617.35,
  },
  {
    id: 'XXXX', // Invalid ID
    label: 'BAD ITEM',
    rawPrices: [null, null, null, null],
    buy: null,
    sell: null,
  },
  {
    id: '2751',
    label: 'SILVER COMEX($)',
    rawPrices: [73.34, 73.37, 73.62, 71.19],
    buy: 73.34,
    sell: 73.37,
  },
];

const validationIssues = validateData(testDataWithIssues);
console.log('Validation issues found:', validationIssues.length);
validationIssues.forEach(issue => {
  console.log(`  [${issue.severity}] Item ${issue.index}: ${issue.message}`);
});
console.log('---');

// Test 6: Edge case - Empty response
console.log('=== Test 6: Empty Response ===');
const emptyResult = parseRates('', { logWarnings: true });
console.log('Parsed empty string:', emptyResult); // Should be []
console.log('---');

// Test 7: Edge case - Malformed rows
console.log('=== Test 7: Malformed Rows ===');
const malformedData = `
  2750  GOLD COMEX($)  4616.60  4617.35  4629.90  4540.50
  THIS IS GARBAGE DATA
  2751  SILVER COMEX($)  73.34  73.37  73.62  71.19
  2752  INCOMPLETE ROW  100
`;

const malformedResult = parseRates(malformedData, { logWarnings: true });
console.log('Successfully parsed rows out of malformed data:', malformedResult.length);
console.log('(Garbage and incomplete rows were skipped gracefully)');
console.log('---');

// Test 8: Practical example - handling month-to-month changes
console.log('=== Test 8: Month-to-Month API Changes ===');

// Month 1 format
const month1 = `
  2750  GOLD COMEX($)  4616.60  4617.35  4629.90  4540.50
  2751  SILVER COMEX($)  73.34  73.37  73.62  71.19
  2755  GOLD 99.50-10 GM  151975  153475  153962  151930
`;

// Month 2 format (some labels changed, one item added)
const month2 = `
  2750  GOLD COMEX (USD)  4700.00  4701.50  4715.00  4650.00
  2751  SILVER COMEX (USD)  75.00  75.50  76.00  73.00
  2756  GOLD 24K BULLION  160000  161000  162000  159000
  2755  GOLD 99.50 10GM  152000  154000  155000  151000
`;

console.log('Month 1 - Parse and locate GOLD COMEX:');
const m1Data = parseRates(month1);
const m1Gold = findByLabel(m1Data, 'goldComex');
console.log('  Found:', m1Gold.label, '- Sell:', m1Gold.sell);

console.log('Month 2 - Parse and locate GOLD COMEX (different label):');
const m2Data = parseRates(month2);
const m2Gold = findByLabel(m2Data, 'goldComex');
console.log('  Found:', m2Gold.label, '- Sell:', m2Gold.sell);
console.log('  ✓ Same commodity key found despite label variation');

console.log('Month 2 - New commodity added:');
const newItem = m2Data.find(item => item.label.includes('24K'));
console.log('  New item available:', newItem.label);
console.log('  ✓ Gracefully handled without errors');
