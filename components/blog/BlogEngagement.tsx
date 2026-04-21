'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart, MessageCircle, Send, User } from 'lucide-react'
import {
  getBlogComments,
  getBlogLikeCount,
  addBlogComment,
  toggleBlogLike,
} from '@/lib/actions/blog-engagement'
import { ScrollReveal } from '@/components/landing/ScrollReveal'

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('muuday_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('muuday_visitor_id', id)
  }
  return id
}

type Comment = {
  id: string
  name: string
  content: string
  created_at: string
}

export function BlogEngagement({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [likeCount, setLikeCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const visitorId = getVisitorId()

  const loadData = useCallback(async () => {
    const [commentsData, countData] = await Promise.all([
      getBlogComments(articleSlug),
      getBlogLikeCount(articleSlug),
    ])
    setComments(commentsData)
    setLikeCount(countData)
  }, [articleSlug])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const likedKey = `muuday_blog_like_${articleSlug}`
    setHasLiked(localStorage.getItem(likedKey) === '1')
  }, [articleSlug])

  async function handleLike() {
    const result = await toggleBlogLike(articleSlug, visitorId)
    if (result.success) {
      const likedKey = `muuday_blog_like_${articleSlug}`
      if (result.liked) {
        setHasLiked(true)
        setLikeCount((c) => c + 1)
        localStorage.setItem(likedKey, '1')
      } else {
        setHasLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
        localStorage.removeItem(likedKey)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const result = await addBlogComment(articleSlug, name, email, content)

    if (result.success) {
      setName('')
      setEmail('')
      setContent('')
      setMessage('Comentário enviado!')
      await loadData()
    } else {
      setMessage(result.error || 'Erro ao enviar.')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="mt-16 space-y-12">
      {/* Likes */}
      <ScrollReveal variant="slideUp">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition ${
              hasLiked
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
            }`}
            aria-label={hasLiked ? 'Remover curtida' : 'Curtir artigo'}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
            {likeCount} {likeCount === 1 ? 'curtida' : 'curtidas'}
          </button>
        </div>
      </ScrollReveal>

      {/* Comments */}
      <ScrollReveal variant="slideUp" delay={0.1}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-slate-900" />
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-slate-900">
              Comentários
            </h3>
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {comments.length}
            </span>
          </div>

          {/* Comment list */}
          <div className="mt-6 space-y-4">
            {comments.length === 0 && (
              <p className="text-sm text-slate-500">
                Seja o primeiro a comentar.
              </p>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {comment.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {comment.content}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
            </div>
            <textarea
              placeholder="Escreva seu comentário..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={2000}
              rows={4}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {content.length}/2000 caracteres
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#9FE870] px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-[#8fd65f] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
            {message && (
              <p
                className={`text-sm ${
                  message.includes('Erro') || message.includes('Preencha')
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </ScrollReveal>
    </div>
  )
}
