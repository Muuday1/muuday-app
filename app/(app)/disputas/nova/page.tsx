export const metadata = { title: 'Abrir Caso | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { openCase } from '@/lib/actions/disputes'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default async function NovaDisputaPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}) {
  const { bookingId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's bookings for dropdown
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_at, professionals!bookings_professional_id_fkey(profiles!professionals_user_id_fkey(full_name))')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  async function handleSubmit(formData: FormData) {
    'use server'
    const bookingId = formData.get('bookingId') as string
    const type = formData.get('type') as string
    const reason = formData.get('reason') as string

    if (!bookingId || !type || !reason) {
      return
    }

    const result = await openCase(bookingId, type, reason)
    if (result.success) {
      redirect('/disputas')
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <Link
        href="/disputas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para disputas
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Abrir caso</h1>
        <p className="mt-1 text-sm text-slate-500">Descreva o problema para que possamos ajudar.</p>
      </div>

      <form action={handleSubmit} className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Abra um caso apenas quando não conseguir resolver diretamente com o profissional.
            Tentamos resolver em até 48h úteis.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Agendamento relacionado</label>
          <select
            name="bookingId"
            defaultValue={bookingId || ''}
            required
            className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
          >
            <option value="">Selecione um agendamento</option>
            {bookings?.map((b: any) => {
              const profName = b.professionals?.profiles?.full_name || 'Profissional'
              return (
                <option key={b.id} value={b.id}>
                  {profName} — {new Date(b.scheduled_at).toLocaleDateString('pt-BR')}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo de caso</label>
          <select
            name="type"
            required
            className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
          >
            <option value="">Selecione</option>
            <option value="cancelation_dispute">Cancelamento</option>
            <option value="no_show_claim">No-show</option>
            <option value="quality_issue">Problema de qualidade</option>
            <option value="refund_request">Solicitação de reembolso</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Descrição</label>
          <textarea
            name="reason"
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Descreva o que aconteceu com detalhes..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-[#9FE870] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f]"
        >
          Abrir caso
        </button>
      </form>
    </div>
  )
}
