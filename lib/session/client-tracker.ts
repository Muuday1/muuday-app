/**
 * Client-side helper to emit session lifecycle events.
 * Thin wrapper around fetch to POST /api/sessao/event.
 */

export type ClientSessionEventType =
  | 'session_join_attempted'
  | 'session_joined'
  | 'session_left'
  | 'session_started'
  | 'session_ended'
  | 'session_failed'
  | 'media_published'
  | 'media_subscribed'

export async function emitSessionEvent(
  bookingId: string,
  eventType: ClientSessionEventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch('/api/sessao/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, eventType, metadata }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.warn('[clientTracker] Event rejected:', eventType, body.error || res.status)
    }
  } catch (err) {
    // Silent fail — telemetry must never break the UX
    console.warn('[clientTracker] Event failed:', eventType, err)
  }
}
