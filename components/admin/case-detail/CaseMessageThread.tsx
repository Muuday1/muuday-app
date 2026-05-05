'use client'

import { MessageSquare, Send, User } from 'lucide-react'
import type { CaseDetailClientProps } from '../CaseDetailClient'

interface CaseMessageThreadProps {
  messages: CaseDetailClientProps['messages']
  messageText: string
  actionLoading: string | null
  onMessageTextChange: (value: string) => void
  onSendMessage: () => void
}

export function CaseMessageThread({
  messages,
  messageText,
  actionLoading,
  onMessageTextChange,
  onSendMessage,
}: CaseMessageThreadProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        Mensagens
      </h3>
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map(msg => (
            <div key={msg.id} className="flex gap-3">
              <div className="mt-0.5">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-700">
                    {msg.profiles?.full_name || msg.sender_id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{msg.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhuma mensagem.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={e => onMessageTextChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSendMessage()}
          placeholder="Escreva uma mensagem..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870]/50"
        />
        <button
          onClick={onSendMessage}
          disabled={actionLoading === 'message' || !messageText.trim()}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {actionLoading === 'message' ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
