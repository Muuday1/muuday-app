function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export type IcsEvent = {
  uid: string
  startUtc: Date
  endUtc: Date
  summary: string
  description?: string
  location?: string
  url?: string
}

export function generateIcsContent(events: IcsEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Muuday//Calendar//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTART:${formatIcsDate(event.startUtc)}`,
      `DTEND:${formatIcsDate(event.endUtc)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
    )
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`)
    }
    if (event.url) {
      lines.push(`URL:${event.url}`)
    }
    lines.push(
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
