#!/bin/bash
# Setup & Deployment Checklist
# Run through this list to verify everything is working

## PRE-DEPLOYMENT CHECKS

### ✓ Code Quality
- [ ] No TypeScript errors: `eslint src/`
- [ ] Builds successfully: `npm run build`
- [ ] No console errors in dev: `npm run dev`
- [ ] No warnings about missing imports

### ✓ Test Coverage
- [ ] Open browser console
- [ ] Copy code from `src/__tests__/dataParser.test.js`
- [ ] Paste and run in console
- [ ] Verify 8+ test cases pass
- [ ] Check console logs are helpful

### ✓ Documentation
- [ ] Read [README_EDGE_CASE_SYSTEM.md](./README_EDGE_CASE_SYSTEM.md)
- [ ] Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Check [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ ] Understand [EDGE_CASE_HANDLER.md](./EDGE_CASE_HANDLER.md)
- [ ] See examples in [dataParser.test.js](./src/__tests__/dataParser.test.js)

### ✓ Backwards Compatibility
- [ ] App UI looks the same
- [ ] Same commodity rates display
- [ ] No missing data compared to old version
- [ ] Refresh rate unchanged

## FOR NEW DEVELOPERS

### ✓ Onboarding
1. [ ] Read [README_EDGE_CASE_SYSTEM.md](./README_EDGE_CASE_SYSTEM.md) (5 min)
2. [ ] Skim [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (10 min)
3. [ ] Run test cases in console (5 min)
4. [ ] Try adding a commodity to COMMODITY_ALIASES (20 min)
5. [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) (15 min)

### ✓ Key Files to Know
- `src/services/dataParser.js` - Core parser logic
- `src/App.jsx` - React component using parser
- `COMMODITY_ALIASES` in dataParser.js - Commodity label mappings
- Test cases in `dataParser.test.js` - Edge case examples

## WHEN API FORMAT CHANGES

### ✓ Debug Steps
1. [ ] Check browser console for warnings
2. [ ] Look for `[Parser] Row could not be parsed:` messages
3. [ ] Verify rates are still being updated
4. [ ] Check diagnostics panel (bottom of page in dev)

### ✓ If Commodity Labels Changed
1. [ ] Note the new label from API response
2. [ ] Edit `src/services/dataParser.js`
3. [ ] Find the commodity key in `COMMODITY_ALIASES`
4. [ ] Add new label to the aliases array
5. [ ] Verify it displays in UI
6. [ ] No code changes needed anywhere else!

### ✓ If Field Count Changed
1. [ ] Count price fields in new API response
2. [ ] Edit `src/App.jsx` line with parseRates call
3. [ ] Update `minFields` and `maxFields` options
4. [ ] Example: `parseRates(data, { minFields: 2, maxFields: 8 })`
5. [ ] Test and verify

### ✓ If New Commodity Added
1. [ ] Note the commodity ID and label
2. [ ] It will parse automatically ✓
3. [ ] To display it in UI, add to COMMODITY_ALIASES
4. [ ] Use `findByLabel(rates, 'yourKey')` in component

### ✓ If Commodity Removed
1. [ ] Check console - no errors expected
2. [ ] `findByLabel()` will return null
3. [ ] Component will show "-" for that rate
4. [ ] No action needed - graceful degradation

## EXTENDING THE SYSTEM

### ✓ Add New Commodity to Display

**Step 1: Add Alias**
```javascript
// In src/services/dataParser.js
COMMODITY_ALIASES = {
  // ... existing ...
  myNewCommodity: [
    'EXACT LABEL FROM API',
    'ALTERNATIVE LABEL 1',
    'ALTERNATIVE LABEL 2'
  ]
}
```

**Step 2: Use in Component**
```javascript
// In src/App.jsx
const item = findByLabel(rates, 'myNewCommodity');
const value = item ? formatValue(item.sell) : '-';
```

### ✓ Adjust Parser Strictness

**More lenient (2-8 fields):**
```javascript
// In applyData function in App.jsx
parseRates(textChunk, {
  minFields: 2,
  maxFields: 8,
  allowPartialData: true,
  logWarnings: true
})
```

**More strict (exactly 4 fields):**
```javascript
parseRates(textChunk, {
  minFields: 4,
  maxFields: 4,
  allowPartialData: false,
  logWarnings: true
})
```

### ✓ Add Custom Validation

```javascript
// In src/services/dataParser.js
// Extend validateData function:

if (item.buy > item.sell) {
  issues.push({
    index: idx,
    field: 'prices',
    severity: 'warning',
    message: `Buy (${item.buy}) > Sell (${item.sell})`
  });
}
```

## TROUBLESHOOTING GUIDE

### Problem: "Item not displaying in UI"
```
1. Check commodityKey is correct
2. Verify label exists in COMMODITY_ALIASES
3. Check label matches API response
4. Try exact string first, then variations
5. Run: Object.keys(COMMODITY_ALIASES) to see all keys
```

### Problem: "Parser warnings in console"
```
1. Check API response format
2. Count price fields (should be 3-6)
3. Verify field separator (tab or space)
4. Check for malformed rows
5. Update minFields/maxFields if needed
```

### Problem: "All values showing as '-'"
```
1. Check parseRates is being called
2. Verify rates array has items: console.log(rates)
3. Check minFields/maxFields match API
4. Verify price values are being parsed
5. Check for parse errors in console
```

### Problem: "Memory leaks or slow performance"
```
1. Check REFRESH_MS (currently 1000ms) - increase if too frequent
2. Verify componentStateUpdates aren't creating loops
3. Check diagnostics for excessive parsing
4. Look at browser DevTools Memory tab
5. Profile with Chrome DevTools (F12 → Performance)
```

### Problem: "Need to support new format"
```
1. Add to COMMODITY_ALIASES (simplest)
2. Adjust parser options (if field count changes)
3. Add validation rules (if structure changes)
4. All without modifying component code!
```

## MONITORING CHECKLIST

### ✓ Daily
- [ ] No console errors
- [ ] Rates update regularly
- [ ] Data formatting looks correct
- [ ] No parsing warnings

### ✓ Weekly
- [ ] Check latest API response
- [ ] Verify all commodities display
- [ ] Monitor parsed item count
- [ ] Review any new labels

### ✓ Monthly
- [ ] Audit COMMODITY_ALIASES against actual labels
- [ ] Review validation warnings
- [ ] Check for new commodities to add
- [ ] Plan any parser adjustments

## PERFORMANCE TUNING

### Current Settings
```javascript
REFRESH_MS = 1000           // Refresh every 1 second
minFields = 3               // Minimum 3 price fields
maxFields = 6               // Maximum 6 price fields
allowPartialData = true     // Allow incomplete rows
logWarnings = true          // Log issues to console
```

### For Heavy Traffic
```javascript
REFRESH_MS = 5000           // Reduce to every 5 seconds
PARSE_WORKERS = 2           // (Future: use Web Workers)
CACHE_RESULTS = true        // (Future: cache recent results)
```

### For Development
```javascript
logWarnings = true          // Keep enabled for debugging
DEV_MODE = true             // Show diagnostics panel
VERBOSE_LOGS = true         // More detailed console logs
```

## COMMON TASKS

### Task: Add 3 new commodities
**Time:** ~10 minutes
**Steps:**
1. Get labels from API
2. Add 3 entries to COMMODITY_ALIASES
3. Use findByLabel in component
4. Test in UI

### Task: Handle new field format (5 instead of 4)
**Time:** ~2 minutes
**Change:** One line in parseRates options
```javascript
// From:
parseRates(data, { minFields: 3, maxFields: 6 })
// To:
parseRates(data, { minFields: 3, maxFields: 7 })
```

### Task: Debug why item not displaying
**Time:** ~5 minutes
**Steps:**
1. Check console for warnings
2. Verify label in COMMODITY_ALIASES
3. Try exact match first
4. Add debug logs if needed

## DEPLOYMENT COMMANDS

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production Build
npm run build            # Create optimized build

# Quality Checks
npm run lint             # Check for code issues
npm run build            # Verify builds successfully

# Testing
# Open browser console and copy test cases
# From: src/__tests__/dataParser.test.js
```

## FILES TO KEEP IN SYNC

When making changes, remember to update:

```
src/services/dataParser.js
├─ COMMODITY_ALIASES (when labels change)
├─ Parser options (when field count changes)
└─ Validation rules (when needing new checks)

src/App.jsx
├─ parseRates call options (if parser needs tuning)
├─ findByLabel calls (if displaying new commodities)
└─ Formatting logic (if display changes)

Documentation/
├─ QUICK_REFERENCE.md (if API changes significantly)
├─ ARCHITECTURE.md (if structure changes)
└─ EDGE_CASE_HANDLER.md (if new patterns emerge)
```

## GETTING HELP

### Quick Questions
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### How Something Works
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

### Setup & Config
→ [EDGE_CASE_HANDLER.md](./EDGE_CASE_HANDLER.md)

### Real Examples
→ [src/__tests__/dataParser.test.js](./src/__tests__/dataParser.test.js)

### Complete Overview
→ [README_EDGE_CASE_SYSTEM.md](./README_EDGE_CASE_SYSTEM.md)

## FINAL CHECKLIST

Before going live:

- [ ] Build passes: `npm run build`
- [ ] No console errors in dev: `npm run dev`
- [ ] All test cases work in console
- [ ] Documentation is accessible
- [ ] Team understands COMMODITY_ALIASES
- [ ] Know how to adjust parser options
- [ ] Have monitoring plan (check console)
- [ ] Know where to find help (docs)

✅ **You're ready to deploy!**

---

**Last Updated:** April 30, 2026  
**Status:** Production Ready  
**Questions?** See documentation index above
