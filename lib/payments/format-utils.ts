/**
 * Payment formatting utilities — minor units to human-readable strings
 *
 * All amounts in the payments engine are stored as BIGINT minor units
 * (e.g. R$ 150.00 = 15000). These helpers convert for UI display.
 */

/**
 * Convert minor units (e.g. 15000) to a formatted currency string.
 *
 * Example: formatMinorUnits(15000, 'BRL') → "R$ 150,00"
 */
export function formatMinorUnits(amount: bigint | number | string, currency = 'BRL'): string {
  const value = typeof amount === 'bigint' ? Number(amount) : Number(amount)
  const major = value / 100

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    return `${currency} ${major.toFixed(2)}`
  }
}

/**
 * Convert minor units to a simple number for charts/math.
 *
 * Example: minorToMajor(15000) → 150.00
 */
export function minorToMajor(amount: bigint | number | string): number {
  const value = typeof amount === 'bigint' ? Number(amount) : Number(amount)
  return value / 100
}

/**
 * Format a payout status label for display.
 */
export function formatPayoutStatus(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50' },
    processing: { label: 'Em processamento', color: 'text-blue-600 bg-blue-50' },
    completed: { label: 'Concluído', color: 'text-green-600 bg-green-50' },
    failed: { label: 'Falhou', color: 'text-red-600 bg-red-50' },
    returned: { label: 'Devolvido', color: 'text-red-600 bg-red-50' },
  }
  return map[status] || { label: status, color: 'text-slate-600 bg-slate-50' }
}

/**
 * Format KYC status label.
 */
export function formatKycStatus(status: string | null | undefined): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50' },
    in_review: { label: 'Em análise', color: 'text-blue-600 bg-blue-50' },
    approved: { label: 'Aprovado', color: 'text-green-600 bg-green-50' },
    rejected: { label: 'Rejeitado', color: 'text-red-600 bg-red-50' },
  }
  return map[status || 'pending'] || { label: status || 'Pendente', color: 'text-slate-600 bg-slate-50' }
}
