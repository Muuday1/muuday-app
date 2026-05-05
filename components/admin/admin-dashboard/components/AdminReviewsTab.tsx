'use client'

import { MessageSquare, CheckCircle, XCircle, Eye, Star } from 'lucide-react'
import type { AdminDashboardData } from '@/lib/actions/admin'

interface AdminReviewsTabProps {
  reviews: AdminDashboardData['reviews']
  actionLoading: string | null
  toggleReviewVisibility: (id: string, visible: boolean) => void
  handleDeleteReview: (id: string) => void
}

export function AdminReviewsTab({
  reviews,
  actionLoading,
  toggleReviewVisibility,
  handleDeleteReview,
}: AdminReviewsTabProps) {
  return (
    <div className="space-y-3">
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg border border-slate-200/80 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900">
                    {review.profiles?.full_name || 'Usuário'}
                  </p>
                  <span className="text-slate-300">→</span>
                  <p className="text-sm text-slate-600">
                    {(review.professionals as unknown as { profiles: { full_name: string } })?.profiles?.full_name || 'Profissional'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                review.is_visible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {review.is_visible ? 'Publicada' : 'Pendente'}
              </span>
            </div>

            {review.comment && (
              <p className="text-sm text-slate-600 mb-4 bg-slate-50/70 rounded-md p-3">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}

            <div className="flex gap-2">
              {!review.is_visible ? (
                <>
                  <button
                    onClick={() => toggleReviewVisibility(review.id, true)}
                    disabled={actionLoading === review.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {actionLoading === review.id ? '...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={actionLoading === review.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {actionLoading === review.id ? '...' : 'Rejeitar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleReviewVisibility(review.id, false)}
                  disabled={actionLoading === review.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {actionLoading === review.id ? '...' : 'Ocultar'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
