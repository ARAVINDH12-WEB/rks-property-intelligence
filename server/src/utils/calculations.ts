// Unit conversion & Indian Real Estate Financial Calculations

export interface AreaConversions {
  sqft: number;
  sqm: number;
  acres: number;
  cents: number;
  grounds: number;
  guntas: number;
}

/**
 * Calculates area across standard Indian real-estate land measurement units
 */
export function calculateAreaConversions(sqft: number): AreaConversions {
  const safeSqft = Number(sqft) || 0;
  return {
    sqft: safeSqft,
    sqm: Number((safeSqft * 0.092903).toFixed(2)),
    acres: Number((safeSqft / 43560).toFixed(4)),
    cents: Number((safeSqft / 435.6).toFixed(2)),
    grounds: Number((safeSqft / 2400).toFixed(2)), // 1 Ground = 2,400 sq.ft (TN standard)
    guntas: Number((safeSqft / 1089).toFixed(2)),   // 1 Gunta = 1,089 sq.ft (KA/TS standard)
  };
}

/**
 * Auto-calculates total property price: Area (Sq.Ft) * Rate (/Sq.Ft)
 */
export function calculateTotalPrice(areaSqft: number, ratePerSqft: number): number {
  return Number((Number(areaSqft) * Number(ratePerSqft)).toFixed(2));
}

/**
 * Formats a number to Indian numbering standard (e.g. ₹1,24,80,000 or ₹1.248 Cr)
 */
export function formatIndianCurrency(amount: number, compact: boolean = false): string {
  const num = Number(amount) || 0;
  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)} K`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}
