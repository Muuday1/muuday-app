const FORBIDDEN_PAYMENT_KEY_NAMES = new Set([
  'cardnumber',
  'pan',
  'cvc',
  'cvv',
  'securitycode',
  'expmonth',
  'expyear',
  'expiry',
  'expirationdate',
  'iban',
  'routingnumber',
  'bankaccountnumber',
  'accountnumber',
  'cardholdernumber',
])

function normalizeKeyName(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function assertValue(value: unknown, path: string, depth: number) {
  if (depth > 6) return
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertValue(value[i], `${path}[${i}]`, depth + 1)
    }
    return
  }

  if (typeof value !== 'object') return

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeKeyName(key)
    if (FORBIDDEN_PAYMENT_KEY_NAMES.has(normalizedKey)) {
      throw new Error(
        `Forbidden sensitive payment field detected in payload: ${path}.${key}`,
      )
    }
    assertValue(nestedValue, `${path}.${key}`, depth + 1)
  }
}

export function assertNoSensitivePaymentPayload(
  payload: unknown,
  contextLabel = 'payment_payload',
) {
  assertValue(payload, contextLabel, 0)
}
