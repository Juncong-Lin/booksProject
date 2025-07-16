export function formatCurrency(priceCents) {
  return `$${(Math.round(priceCents) / 100).toFixed(2)}`;
}

// New function to format price ranges from lower_price and higher_price
export function formatPriceRange(lowerPrice, higherPrice) {
  if (!lowerPrice && !higherPrice) {
    return 'USD: #NA';
  }
  
  const lower = formatCurrency(lowerPrice || 0);
  const higher = formatCurrency(higherPrice || lowerPrice || 0);
  
  // Return properly formatted price range using $ symbol
  return lowerPrice === higherPrice ? 
    `${lower}` : 
    `${lower} - ${higher}`;
}