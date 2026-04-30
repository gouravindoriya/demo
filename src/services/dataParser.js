/**
 * Robust API data parser with edge case handling
 * Handles: missing fields, format variations, missing items, label changes
 */

// Field validation schema
const FIELD_SCHEMA = {
  id: { type: 'string', required: true, pattern: /^\d{4}$/ },
  label: { type: 'string', required: true },
  price1: { type: 'number', required: false, nullable: true },
  price2: { type: 'number', required: false, nullable: true },
  price3: { type: 'number', required: false, nullable: true },
  price4: { type: 'number', required: false, nullable: true },
};

// Price field mapping (flexible naming)
const PRICE_FIELD_ALIASES = {
  buy: ['buy', 'price1', 'bid', 'open'],
  sell: ['sell', 'price2', 'ask', 'current'],
  high: ['high', 'price3', 'max'],
  low: ['low', 'price4', 'min'],
};

// Commodity label alternatives (handle when labels change)
const COMMODITY_ALIASES = {
  goldComex: ['GOLD COMEX', 'GOLD COMEX($)', 'GOLD COMEX (USD)', 'GOLD-COMEX'],
  silverComex: ['SILVER COMEX', 'SILVER COMEX($)', 'SILVER COMEX (USD)', 'SILVER-COMEX'],
  inrExchange: ['INR EX', 'INR EXCHANGE', 'INR EX(₹)', 'INREX'],
  goldJune: ['GOLD JUNE', 'GOLD JUN', 'GOLD JUNE MCX', 'GOLDJUN-MCX'],
  silverJuly: ['SILVER JUL', 'SILVER JULY', 'SILVER JUL MCX', 'SILVERJUL-MCX'],
  gold9950: ['GOLD 99.50-10 GM', 'GOLD 99.50 10GM', 'GOLD 10GM', 'GOLD BULLION 10GM'],
  silverCut: ['SILVER CUT 9999-1 KG', 'SILVER CUT 9999 1KG', 'SILVER 1KG', 'SILVER BULLION 1KG'],
  swastikSilver: ['SWASTIK SILVER-1 KG', 'SWASTIK SILVER 1KG', 'SWASTIK SILVER'],
  goldJewar18: ['GOLD JEWAR 18 CT', 'GOLD JEWAR 18CT', 'GOLD JEWELLERY 18CT'],
  goldJewar20: ['GOLD JEWAR 20 CT', 'GOLD JEWAR 20CT', 'GOLD JEWELLERY 20CT'],
  goldJewar22: ['GOLD JEWAR 22 CT', 'GOLD JEWAR 22CT', 'GOLD JEWELLERY 22CT'],
  goldRTGS: ['GOLD 99.50 RTGS 10-GM', 'GOLD RTGS 10GM', 'GOLD RTGS'],
  silverRTGS: ['SILVER CUT 9999 RTGS-1 KG', 'SILVER RTGS 1KG', 'SILVER RTGS'],
};

/**
 * Convert string to number, handling "-" and invalid values
 */
export const toNumberOrNull = (value) => {
  if (value === '-' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Parse a single commodity row with flexible field count
 * Handles variable number of price fields (2-6)
 */
export const parseRow = (segment, options = {}) => {
  const {
    minFields = 3,
    maxFields = 6,
    allowPartialData = true,
    logWarnings = true,
  } = options;

  const trimmed = segment.trim();
  
  // Match: ID (4 digits) + Label + remaining fields
  // Flexible to handle 2-6 price fields
  const match = trimmed.match(
    /^(\d{4})\s+(.+?)\s+([-\d.]+)\s+([-\d.]+)(?:\s+([-\d.]+))?(?:\s+([-\d.]+))?(?:\s+([-\d.]+))?(?:\s+([-\d.]+))?$/
  );

  if (!match) {
    if (logWarnings) {
      console.warn(`[Parser] Row could not be parsed: "${trimmed.substring(0, 50)}..."`);
    }
    return null;
  }

  const fieldCount = match.length - 3; // Exclude id and label from count
  
  if (fieldCount < minFields || fieldCount > maxFields) {
    if (!allowPartialData) {
      if (logWarnings) {
        console.warn(
          `[Parser] Row has ${fieldCount} fields (expected ${minFields}-${maxFields}): "${match[2]}"`
        );
      }
      return null;
    }
  }

  // Map captured groups to price fields
  const prices = [
    toNumberOrNull(match[3]),
    toNumberOrNull(match[4]),
    toNumberOrNull(match[5]),
    toNumberOrNull(match[6]),
    toNumberOrNull(match[7]),
    toNumberOrNull(match[8]),
  ].slice(0, fieldCount);

  return {
    id: match[1],
    label: match[2].trim(),
    rawPrices: prices,
    // Support multiple naming conventions
    buy: prices[0],
    sell: prices[1],
    high: prices[2],
    low: prices[3],
    price5: prices[4],
    price6: prices[5],
  };
};

/**
 * Find a commodity by label, with fallback aliases
 */
export const findByLabel = (items, commodityKey) => {
  if (!Array.isArray(items)) return null;

  const aliases = COMMODITY_ALIASES[commodityKey];
  if (!aliases) {
    console.warn(`[Parser] Unknown commodity key: ${commodityKey}`);
    return null;
  }

  // Try exact match first
  for (const alias of aliases) {
    const found = items.find((item) => item.label.includes(alias));
    if (found) return found;
  }

  // Try case-insensitive match
  const lowerAliases = aliases.map(a => a.toLowerCase());
  for (const item of items) {
    const lowerLabel = item.label.toLowerCase();
    if (lowerAliases.some(alias => lowerLabel.includes(alias))) {
      return item;
    }
  }

  return null;
};

/**
 * Main parser: convert raw API response to structured data
 */
export const parseRates = (raw, options = {}) => {
  const {
    minFields = 3,
    maxFields = 6,
    allowPartialData = true,
    skipMissingFields = false,
    logWarnings = true,
  } = options;

  if (!raw || typeof raw !== 'string') {
    if (logWarnings) {
      console.warn('[Parser] Invalid input: expected non-empty string');
    }
    return [];
  }

  // Normalize whitespace and line breaks
  const normalized = raw
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by 4-digit ID pattern
  const segments = normalized.split(/(?=\b\d{4}\s)/g);

  const parsedItems = segments
    .map((segment) => parseRow(segment, { minFields, maxFields, allowPartialData, logWarnings }))
    .filter(Boolean);

  if (logWarnings && parsedItems.length === 0) {
    console.warn('[Parser] No valid items parsed from response');
  }

  if (logWarnings && parsedItems.length !== segments.length) {
    const skipped = segments.length - parsedItems.length;
    console.warn(`[Parser] Skipped ${skipped} invalid row(s) out of ${segments.length}`);
  }

  return parsedItems;
};

/**
 * Validate parsed data against schema
 */
export const validateData = (items) => {
  const issues = [];

  items.forEach((item, idx) => {
    // Validate ID format
    if (!FIELD_SCHEMA.id.pattern.test(item.id)) {
      issues.push({
        index: idx,
        field: 'id',
        severity: 'error',
        message: `Invalid ID format: ${item.id}`,
      });
    }

    // Validate label exists
    if (!item.label || typeof item.label !== 'string') {
      issues.push({
        index: idx,
        field: 'label',
        severity: 'error',
        message: 'Missing or invalid label',
      });
    }

    // Check for at least some price data
    const hasPriceData = item.rawPrices.some(p => p !== null);
    if (!hasPriceData) {
      issues.push({
        index: idx,
        field: 'prices',
        severity: 'warning',
        message: `Item "${item.label}" has no valid price data`,
      });
    }
  });

  return issues;
};

/**
 * Get parser state/diagnostics
 */
export const getParserDiagnostics = (rawData, parsedData, validationIssues) => {
  return {
    rawInputLength: rawData?.length || 0,
    parsedCount: parsedData?.length || 0,
    issueCount: validationIssues?.length || 0,
    errors: validationIssues?.filter(i => i.severity === 'error') || [],
    warnings: validationIssues?.filter(i => i.severity === 'warning') || [],
    timestamp: new Date().toISOString(),
  };
};
