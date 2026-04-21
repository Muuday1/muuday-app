export const metadata = { title: 'Prontuário do Cliente | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getClientRecordByUser, getSessionNotesForClient } from '@/lib/actions/client-records'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, FileText, Calendar } from 'lucide-react'
import { ClientRecordForm } from '@/components/professional/ClientRecordForm'
import { SessionNoteForm } from '@/components/professional/SessionNoteForm'

export default async function ProntuarioClientePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profissional') redirect('/perfil')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional) redirect('/completar-perfil')

  const clientProfile = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  const recordResult = await getClientRecordByUser(userId)
  const record = recordResult.success ? (recordResult.data.record as any) : null

  const notesResult = await getSessionNotesForClient(userId)
  const notes = notesResult.success ? (notesResult.data.notes as any[]) : []

  // Get latest booking for session note form
  const { data: latestBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('professional_id', professional.id)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/prontuario"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para prontuários
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
          {clientProfile.data?.full_name || 'Cliente'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Prontuário e histórico de sessões.</p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#9FE870]" />
          <h2 className="font-display text-lg font-bold text-slate-900">Registro geral</h2>
        </div>
        <ClientRecordForm userId={userId} initialNotes={record?.notes || ''} />
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#9FE870]" />
          <h2 className="font-display text-lg font-bold text-slate-900">Notas de sessão</h2>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma nota de sessão registrada.</p>
        ) : (
          <div className="mb-4 space-y-3">
            {notes.map((note: any) => (
              <div key={note.id} className="rounded-md border border-slate-200/80 bg-slate-50/70 p-3">
                <p className="text-xs text-slate-400">
                  {formatInTimeZone(
                    new Date(note.created_at),
                    'America/Sao_Paulo',
                    'd MMM yyyy HH:mm',
                    { locale: ptBR },
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-700">{note.notes}</p>
              </div>
            ))}
          </div>
        )}

        {latestBooking && <SessionNoteForm bookingId={latestBooking.id} />}
      </div>
    </div>
  )
}
