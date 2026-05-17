// Shared currency utilities used across the entire app

export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
};

/**
 * Get the currency symbol for a product based on its variants data.
 * Falls back to '$' if no currency info is stored.
 */
export const getProductCurrency = (product: any): string => {
  if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const code = product.variants[0]?.currency;
    if (code && CURRENCIES[code]) {
      return CURRENCIES[code].symbol;
    }
  }
  return '$';
};

/**
 * Format a price with the correct currency symbol for a product.
 */
export const formatPrice = (product: any, price?: number): string => {
  const symbol = getProductCurrency(product);
  const amount = price !== undefined ? price : product.price;
  return `${symbol}${Number(amount).toFixed(2)}`;
};
