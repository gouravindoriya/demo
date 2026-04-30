# Quick Reference - API Edge Case Handler

## Core Functions

### `parseRates(rawData, options?)`
Parse tab-separated commodity data with flexible field handling.

```javascript
import { parseRates } from './services/dataParser';

const items = parseRates(apiResponse, {
  minFields: 3,        // Min price fields
  maxFields: 6,        // Max price fields  
  allowPartialData: true,
  logWarnings: true
});

// Returns: [
//   { id, label, buy, sell, high, low, rawPrices: [...] },
//   ...
// ]
```

### `findByLabel(items, commodityKey)`
Find commodity by logical key, with label alias fallbacks.

```javascript
import { findByLabel } from './services/dataParser';

const goldComex = findByLabel(rates, 'goldComex');
const silverGwalior = findByLabel(rates, 'silverCut');

// Returns: item or null
```

### `validateData(items)`
Validate parsed data and get issues list.

```javascript
import { validateData } from './services/dataParser';

const issues = validateData(parsedItems);
// Returns: [{ index, field, severity, message }, ...]
```

### `toNumberOrNull(value)`
Convert value to number, handling "-" and invalid inputs.

```javascript
import { toNumberOrNull } from './services/dataParser';

toNumberOrNull("100.50")  // → 100.5
toNumberOrNull("-")       // → null
toNumberOrNull("invalid") // → null
```

---

## Adding a Commodity Alias

### Step 1: Edit `src/services/dataParser.js`

```javascript
COMMODITY_ALIASES = {
  // Existing entries...
  
  // Add your new commodity
  myGoldVariant: [
    'GOLD VARIANT A',      // Primary label
    'GOLD VARIANT B',      // Alternative 1
    'VARIANT GOLD'         // Alternative 2
  ]
}
```

### Step 2: Use in component

```jsx
const item = findByLabel(rates, 'myGoldVariant');
const price = item ? formatValue(item.sell) : '-';
```

---

## Configuration Options

### Parser Options

```javascript
parseRates(data, {
  minFields: 3,              // Minimum price columns
  maxFields: 6,              // Maximum price columns
  allowPartialData: true,    // Allow rows with <minFields
  logWarnings: true          // Log parsing issues
})
```

### Field Names Available
- `id` - 4-digit commodity ID
- `label` - Commodity name/label
- `buy` - First price field
- `sell` - Second price field
- `high` - Third price field
- `low` - Fourth price field
- `price5`, `price6` - Additional fields if present
- `rawPrices` - Array of all prices [p1, p2, p3, ...]

---

## Common Patterns

### Safe Commodity Access
```javascript
const item = findByLabel(rates, 'goldComex');
if (item && item.sell !== null) {
  displayPrice(item.sell);
} else {
  displayPrice('-');
}
```

### Fallback Chain
```javascript
const primaryItem = findByLabel(rates, 'gold9950');
const secondaryItem = findByLabel(rates, 'goldJewar22');
const finalItem = primaryItem || secondaryItem;
const price = finalItem ? formatValue(finalItem.sell) : '-';
```

### Conditional Aliasing
```javascript
// Try multiple aliases in order
const item = findByLabel(rates, 'silverCut') || 
             findByLabel(rates, 'swastikSilver') ||
             findByLabel(rates, 'silverJuly');
```

### Iterate with Fallback
```javascript
const commodities = [
  { key: 'goldComex', title: 'Gold Comex', unit: '$' },
  { key: 'silverComex', title: 'Silver Comex', unit: '$' },
  { key: 'inrExchange', title: 'INR Exchange', unit: '₹' }
];

const cards = commodities.map(c => ({
  title: c.title,
  item: findByLabel(rates, c.key),
  value: findByLabel(rates, c.key) 
    ? formatValue(findByLabel(rates, c.key).sell)
    : '-'
}));
```

---

## Debugging

### Check Parsed Data
```javascript
console.log('Parsed items:', rates);
console.log('Item count:', rates.length);
console.log('First item:', rates[0]);
```

### Check Aliases
```javascript
import { COMMODITY_ALIASES } from './services/dataParser';
console.log('Available commodities:', Object.keys(COMMODITY_ALIASES));
console.log('GOLD aliases:', COMMODITY_ALIASES.goldComex);
```

### Check Validation Issues
```javascript
const issues = validateData(rates);
issues.forEach(issue => {
  console.log(`Item ${issue.index}: [${issue.severity}] ${issue.message}`);
});
```

### View Diagnostics (Dev Mode)
```javascript
if (diagnostics) {
  console.table({
    'Parsed Items': diagnostics.parsedCount,
    'Issues': diagnostics.issueCount,
    'Errors': diagnostics.errors.length,
    'Warnings': diagnostics.warnings.length
  });
}
```

---

## Available Commodity Keys

```javascript
'goldComex'        // GOLD COMEX / GOLD COMEX($) / etc
'silverComex'      // SILVER COMEX
'inrExchange'      // INR EX / INR EXCHANGE
'goldJune'         // GOLD JUNE / GOLD JUN
'silverJuly'       // SILVER JUL / SILVER JULY
'gold9950'         // GOLD 99.50-10 GM
'silverCut'        // SILVER CUT 9999-1 KG
'swastikSilver'    // SWASTIK SILVER-1 KG
'goldJewar18'      // GOLD JEWAR 18 CT
'goldJewar20'      // GOLD JEWAR 20 CT
'goldJewar22'      // GOLD JEWAR 22 CT
'goldRTGS'         // GOLD 99.50 RTGS 10-GM
'silverRTGS'       // SILVER CUT 9999 RTGS-1 KG
```

**To add more:** Edit `COMMODITY_ALIASES` in `dataParser.js`

---

## Error Handling

### Parser Errors (logged, don't crash)
```
[Parser] Row could not be parsed: "malformed text"
[Parser] No valid items parsed from response
[Parser] Skipped 3 invalid row(s) out of 15
```

### Validation Warnings
```
[Item "GOLD"] has no valid price data
[Item] Invalid ID format: XXXX
```

### Safe Fallbacks Built-in
- Missing items → `null` (component shows "-")
- Invalid prices → `null` (component shows "-")
- Malformed rows → Skipped (logged, not shown)
- Missing fields → `null` (component shows "-")

---

## Performance Tips

1. **Limit parse frequency**
   - Set `REFRESH_MS` appropriately (current: 1000ms)
   - Cache recent results when possible

2. **Minimize re-renders**
   - Use `useMemo` for derived data
   - Only update rates when data actually changes

3. **Monitor diagnostics**
   - Watch for "No valid items parsed" warnings
   - Check error counts in development

---

## Migration from Old Code

### Old Way
```javascript
const findByLabel = (term) => rates.find(item => item.label.includes(term));
const goldComex = findByLabel("GOLD COMEX");
const goldJune = findByLabel("GOLD JUNE") || findByLabel("GOLD JUN");
```

### New Way
```javascript
import { findByLabel } from './services/dataParser';
const goldComex = findByLabel(rates, 'goldComex');
const goldJune = findByLabel(rates, 'goldJune');
```

**Benefits:**
- ✅ Automatic fallback aliases
- ✅ Case-insensitive matching
- ✅ Label format agnostic
- ✅ Single source of truth

---

## Reporting Issues

When API format changes break something:

1. Check console for `[Parser]` warnings
2. Verify commodity key in `COMMODITY_ALIASES`
3. If new label format: Add to aliases
4. If new commodity: Add new key + aliases
5. If new field count: Adjust `minFields`/`maxFields`

All without redeploying!

---

Return to [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for full documentation.
