export type AvailabilityRow = {
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export type ModernAvailabilityRow = {
  professional_id: string
  weekday: number
  start_time_local: string
  end_time_local: string
}

/**
 * Merge modern availability_rules rows with legacy availability rows.
 * For each professional, prefers availability_rules if present;
 * otherwise falls back to legacy availability.
 */
export function mergeAvailabilitySources(
  modernRows: ModernAvailabilityRow[],
  legacyRows: AvailabilityRow[],
): AvailabilityRow[] {
  const modernByPro = new Map<string, ModernAvailabilityRow[]>()
  for (const row of modernRows) {
    const list = modernByPro.get(row.professional_id) || []
    list.push(row)
    modernByPro.set(row.professional_id, list)
  }

  const result: AvailabilityRow[] = []
  for (const [professionalId, modernList] of modernByPro) {
    for (const row of modernList) {
      result.push({
        professional_id: professionalId,
        day_of_week: row.weekday,
        start_time: row.start_time_local,
        end_time: row.end_time_local,
      })
    }
  }

  const legacyByPro = new Map<string, AvailabilityRow[]>()
  for (const row of legacyRows) {
    const list = legacyByPro.get(row.professional_id) || []
    list.push(row)
    legacyByPro.set(row.professional_id, list)
  }

  for (const [professionalId, legacyList] of legacyByPro) {
    if (modernByPro.has(professionalId)) continue
    result.push(...legacyList)
  }

  return result
}
