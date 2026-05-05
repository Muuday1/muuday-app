'use client'

import { Clock, MessageSquare, Shield } from 'lucide-react'
import type { CaseDetailClientProps } from '../CaseDetailClient'

interface CaseTimelineProps {
  timeline: CaseDetailClientProps['timeline']
}

export function CaseTimeline({ timeline }: CaseTimelineProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        Timeline
      </h3>
      <div className="space-y-4">
        {timeline.length > 0 ? (
          timeline.map(event => (
            <div key={`${event.event_type}-${event.id}`} className="flex gap-3">
              <div className="mt-0.5">
                {event.event_type === 'message' ? (
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Shield className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-700">
                    {event.event_type === 'message'
                      ? (event.profiles?.full_name || event.sender_id?.slice(0, 8) || 'Desconhecido')
                      : (event.profiles?.full_name || event.performed_by?.slice(0, 8) || 'Sistema')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(event.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {event.event_type === 'message' ? (
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{event.content}</p>
                ) : (
                  <p className="text-sm text-slate-600">
                    {event.action_type === 'resolved' && 'Caso resolvido'}
                    {event.action_type === 'assigned' && 'Caso atribuído'}
                    {event.action_type === 'unassigned' && 'Atribuição removida'}
                    {event.action_type === 'status_changed' && `Status alterado: ${(event.metadata as any)?.from_status} → ${(event.metadata as any)?.to_status}`}
                    {event.action_type === 'message' && 'Mensagem enviada'}
                    {!['resolved', 'assigned', 'unassigned', 'status_changed', 'message'].includes(event.action_type || '') && event.action_type}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
        )}
      </div>
    </div>
  )
}
