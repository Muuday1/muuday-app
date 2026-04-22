'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Send, Loader2 } from 'lucide-react'
import { sendMessage, getMessages, markConversationAsRead } from '@/lib/actions/chat'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  content: string
  sent_at: string
}

interface MessageThreadProps {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  otherName: string
  bookingId: string
}

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  otherName,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Realtime subscription for new messages (replaces 5s polling)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage].sort(
              (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
            )
          })
          // Mark as read since user is actively viewing the thread
          void markConversationAsRead(conversationId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Also mark as read on mount (in case user navigated here with unread messages)
  useEffect(() => {
    void markConversationAsRead(conversationId)
  }, [conversationId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || isSending) return

    setIsSending(true)
    setError(null)

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      content,
      sent_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMessage])
    setInput('')

    const result = await sendMessage(conversationId, content)

    if (result.success) {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId
            ? { ...m, id: result.data.messageId, sent_at: result.data.sentAt }
            : m,
        ),
      )
    } else {
      setError(result.error || 'Erro ao enviar mensagem.')
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(content)
    }

    setIsSending(false)
    inputRef.current?.focus()
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-slate-300">Envie a primeira mensagem abaixo.</p>
          </div>
        ) : (
          sortedMessages.map(msg => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-[#9FE870] text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isMe ? 'text-[#9FE870]/20' : 'text-slate-400'
                    }`}
                  >
                    {formatInTimeZone(new Date(msg.sent_at), 'America/Sao_Paulo', 'HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-200/80 p-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Mensagem para ${otherName}...`}
          maxLength={2000}
          className="flex-1 rounded-md border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#9FE870] text-white transition hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
