import { describe, it, expect } from 'vitest'
import { formatMinorUnits, minorToMajor, formatPayoutStatus, formatKycStatus } from './format-utils'

// ---------------------------------------------------------------------------
// formatMinorUnits
// ---------------------------------------------------------------------------

describe('formatMinorUnits', () => {
  it('formats BRL correctly with bigint input', () => {
    const result = formatMinorUnits(BigInt(15000), 'BRL')
    expect(result).toMatch(/R\$\s?150[,.]00/)
  })

  it('formats BRL correctly with number input', () => {
    const result = formatMinorUnits(15000, 'BRL')
    expect(result).toMatch(/R\$\s?150[,.]00/)
  })

  it('formats BRL correctly with string input', () => {
    const result = formatMinorUnits('15000', 'BRL')
    expect(result).toMatch(/R\$\s?150[,.]00/)
  })

  it('defaults to BRL when currency omitted', () => {
    const result = formatMinorUnits(10000)
    expect(result).toContain('R$')
  })

  it('handles zero amount', () => {
    const result = formatMinorUnits(0, 'BRL')
    expect(result).toMatch(/R\$\s?0[,.]00/)
  })

  it('handles fractional reais', () => {
    const result = formatMinorUnits(12345, 'BRL')
    expect(result).toMatch(/R\$\s?123[,.]45/)
  })

  it('formats USD correctly', () => {
    const result = formatMinorUnits(5000, 'USD')
    expect(result).toMatch(/US\$\s?50[,.]00|\$\s?50[,.]00/)
  })

  it('handles negative amounts', () => {
    const result = formatMinorUnits(-5000, 'BRL')
    expect(result).toContain('-')
    expect(result).toMatch(/50[,.]00/)
  })
})

// ---------------------------------------------------------------------------
// minorToMajor
// ---------------------------------------------------------------------------

describe('minorToMajor', () => {
  it('converts bigint to major units', () => {
    expect(minorToMajor(BigInt(15000))).toBe(150)
  })

  it('converts number to major units', () => {
    expect(minorToMajor(15000)).toBe(150)
  })

  it('converts string to major units', () => {
    expect(minorToMajor('15000')).toBe(150)
  })

  it('handles zero', () => {
    expect(minorToMajor(0)).toBe(0)
  })

  it('handles fractional amounts', () => {
    expect(minorToMajor(12345)).toBe(123.45)
  })

  it('handles negative amounts', () => {
    expect(minorToMajor(-5000)).toBe(-50)
  })
})

// ---------------------------------------------------------------------------
// formatPayoutStatus
// ---------------------------------------------------------------------------

describe('formatPayoutStatus', () => {
  it('formats pending', () => {
    expect(formatPayoutStatus('pending')).toEqual({
      label: 'Pendente',
      color: 'text-amber-600 bg-amber-50',
    })
  })

  it('formats processing', () => {
    expect(formatPayoutStatus('processing')).toEqual({
      label: 'Em processamento',
      color: 'text-blue-600 bg-blue-50',
    })
  })

  it('formats completed', () => {
    expect(formatPayoutStatus('completed')).toEqual({
      label: 'Concluído',
      color: 'text-green-600 bg-green-50',
    })
  })

  it('formats failed', () => {
    expect(formatPayoutStatus('failed')).toEqual({
      label: 'Falhou',
      color: 'text-red-600 bg-red-50',
    })
  })

  it('formats returned', () => {
    expect(formatPayoutStatus('returned')).toEqual({
      label: 'Devolvido',
      color: 'text-red-600 bg-red-50',
    })
  })

  it('falls back for unknown status', () => {
    expect(formatPayoutStatus('unknown_status')).toEqual({
      label: 'unknown_status',
      color: 'text-slate-600 bg-slate-50',
    })
  })
})

// ---------------------------------------------------------------------------
// formatKycStatus
// ---------------------------------------------------------------------------

describe('formatKycStatus', () => {
  it('formats pending', () => {
    expect(formatKycStatus('pending')).toEqual({
      label: 'Pendente',
      color: 'text-amber-600 bg-amber-50',
    })
  })

  it('formats in_review', () => {
    expect(formatKycStatus('in_review')).toEqual({
      label: 'Em análise',
      color: 'text-blue-600 bg-blue-50',
    })
  })

  it('formats approved', () => {
    expect(formatKycStatus('approved')).toEqual({
      label: 'Aprovado',
      color: 'text-green-600 bg-green-50',
    })
  })

  it('formats rejected', () => {
    expect(formatKycStatus('rejected')).toEqual({
      label: 'Rejeitado',
      color: 'text-red-600 bg-red-50',
    })
  })

  it('defaults to pending for null', () => {
    expect(formatKycStatus(null)).toEqual({
      label: 'Pendente',
      color: 'text-amber-600 bg-amber-50',
    })
  })

  it('defaults to pending for undefined', () => {
    expect(formatKycStatus(undefined)).toEqual({
      label: 'Pendente',
      color: 'text-amber-600 bg-amber-50',
    })
  })

  it('falls back for unknown status', () => {
    expect(formatKycStatus('unknown_status')).toEqual({
      label: 'unknown_status',
      color: 'text-slate-600 bg-slate-50',
    })
  })
})
