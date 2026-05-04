export function viewLinkClass(activeView: string, currentView: string) {
  return activeView === currentView
    ? 'bg-[#9FE870] text-white border-[#9FE870]'
    : 'bg-white text-slate-600 border-slate-200 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
}

export function getConfirmationDeadline(booking: Record<string, any>): Date | null {
  const deadlineRaw = booking?.metadata?.confirmation_deadline_utc
  if (!deadlineRaw || typeof deadlineRaw !== 'string') return null

  const deadline = new Date(deadlineRaw)
  if (Number.isNaN(deadline.getTime())) return null
  return deadline
}

export function getSlaLabel(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now()
  if (diffMs <= 0) return 'SLA expirado'

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) return `Expira em ${diffHours}h`

  const diffDays = Math.ceil(diffHours / 24)
  return `Expira em ${diffDays} dia${diffDays === 1 ? '' : 's'}`
}

export function getRequestStatusUi(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: 'Aberta', className: 'bg-slate-100 text-slate-700' },
    offered: { label: 'Proposta enviada', className: 'bg-amber-50 text-amber-700' },
    accepted: { label: 'Aceita', className: 'bg-green-50 text-green-700' },
    converted: { label: 'Convertida', className: 'bg-green-50 text-green-700' },
    declined: { label: 'Recusada', className: 'bg-red-50 text-red-700' },
    expired: { label: 'Expirada', className: 'bg-slate-100 text-slate-500' },
    cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500' },
  }
  return map[status] || map.open
}

export function getDurationMinutes(startValue: string | null, endValue: string | null) {
  if (!startValue || !endValue) return 60
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return 60
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
}

export function bookingModeMeta(booking: Record<string, any>) {
  const bookingType = String(booking.booking_type || '')
  if (booking.recurrence_group_id || bookingType.startsWith('recurring')) {
    return { label: 'Recorrência', className: 'bg-blue-50 text-blue-700' }
  }
  if (booking.batch_booking_group_id) {
    return { label: 'Várias datas', className: 'bg-purple-50 text-purple-700' }
  }
  return null
}
