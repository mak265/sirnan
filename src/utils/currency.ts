export function formatPhp(amount: number): string {
  const v = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

