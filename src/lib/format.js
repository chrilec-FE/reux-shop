export function formatCurrency(value) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(Number(value) || 0);
}
