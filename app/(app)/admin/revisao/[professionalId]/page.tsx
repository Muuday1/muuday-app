export const metadata = { title: 'Revisão de profissional | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, CircleAlert, Clock3, FileText, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { adminReviewProfessionalDecision } from '@/lib/actions/admin'
import { buildProfessionalCredentialFlags } from '@/lib/admin/professional-credential-checks'

async function submitReviewDecision(formData: FormData) {
  'use server'
  const professionalId = String(formData.get('professionalId') || '')
  const decision = String(formData.get('decision') || '') as 'approved' | 'rejected' | 'needs_changes'
  const notes = String(formData.get('notes') || '')
  const result = await adminReviewProfessionalDecision(professionalId, decision, notes)
  const suffix = result.success ? 'success' : `error:${encodeURIComponent(result.error)}`
  redirect(`/admin/revisao/${professionalId}?result=${suffix}`)
}

function parseResultMessage(resultRaw?: string) {
  if (!resultRaw) return null
  if (resultRaw === 'success') return { ok: true, text: 'Decisão aplicada com sucesso.' }
  if (resultRaw.startsWith('error:')) {
    return { ok: false, text: decodeURIComponent(resultRaw.slice('error:'.length)) }
  }
  return null
}

export default async function AdminReviewProfessionalPage({
  params,
  searchParams,
}: {
  params: { professionalId: string }
  searchParams?: { result?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/buscar')

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id,user_id,status,tier,category,subcategories,tags,bio,whatsapp_number,cover_photo_url,video_intro_url,social_links,admin_review_notes,created_at,profiles!professionals_user_id_fkey(full_name,email,country,timezone)',
    )
    .eq('id', params.professionalId)
    .maybeSingle()

  if (!professional) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <h1 className="text-xl font-bold text-neutral-900">Profissional não encontrado</h1>
        <p className="mt-2 text-sm text-neutral-600">Verifique o identificador e tente novamente.</p>
      </div>
    )
  }

  const { data: services } = await supabase
    .from('professional_services')
    .select('name,description,duration_minutes,price_brl,is_active')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: true })

  const { data: application } = await supabase
    .from('professional_applications')
    .select(
      'headline,category,specialty_name,specialty_custom,specialty_validation_message,focus_areas,primary_language,secondary_languages,target_audiences,taxonomy_suggestions,qualifications_structured,other_languages',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const { data: credentials } = await supabase
    .from('professional_credentials')
    .select('id,file_url,file_name,credential_type,verified,uploaded_at,scan_status,scan_checked_at')
    .eq('professional_id', professional.id)
    .order('uploaded_at', { ascending: false })

  const result = parseResultMessage(searchParams?.result)
  const owner = Array.isArray(professional.profiles) ? professional.profiles[0] : professional.profiles
  const semiAuto = buildProfessionalCredentialFlags({ application, credentials })

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Revisão de perfil profissional</h1>
          <p className="mt-1 text-sm text-neutral-500">Ações: Aprovar, Rejeitar ou Solicitar ajustes.</p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
        >
          Voltar para Admin
        </Link>
      </div>

      {result ? (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            result.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {result.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-brand-500" />
              <h2 className="font-semibold text-neutral-900">Resumo</h2>
            </div>
            <p className="text-sm text-neutral-700">
              <strong>{owner?.full_name || 'Profissional'}</strong> • {owner?.email || '-'}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Status atual: <strong>{String(professional.status || 'draft')}</strong> • Tier selecionado:{' '}
              <strong>{String(professional.tier || 'basic')}</strong>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Categoria: <strong>{String(professional.category || '-')}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-neutral-900">Perfil público</h2>
            <p className="text-sm text-neutral-700">{professional.bio || 'Sem bio informada.'}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <p className="text-xs text-neutral-500">WhatsApp: {professional.whatsapp_number || '-'}</p>
              <p className="text-xs text-neutral-500">Cover: {professional.cover_photo_url ? 'Sim' : 'Não'}</p>
              <p className="text-xs text-neutral-500">Vídeo intro: {professional.video_intro_url ? 'Sim' : 'Não'}</p>
              <p className="text-xs text-neutral-500">
                Links sociais:{' '}
                {professional.social_links && typeof professional.social_links === 'object'
                  ? Object.keys(professional.social_links as Record<string, string>).length
                  : 0}
              </p>
            </div>
          </div>

          {application ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-neutral-900">Dados estruturados do cadastro</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <p className="text-xs text-neutral-600">Headline: {application.headline || '-'}</p>
                <p className="text-xs text-neutral-600">Categoria: {application.category || '-'}</p>
                <p className="text-xs text-neutral-600">Especialidade: {application.specialty_name || '-'}</p>
                <p className="text-xs text-neutral-600">Idioma principal: {application.primary_language || '-'}</p>
              </div>
              <p className="mt-2 text-xs text-neutral-600">
                Público atendido:{' '}
                {Array.isArray(application.target_audiences) && application.target_audiences.length > 0
                  ? application.target_audiences.join(', ')
                  : '-'}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Idiomas secundários:{' '}
                {Array.isArray(application.secondary_languages) && application.secondary_languages.length > 0
                  ? application.secondary_languages.join(', ')
                  : '-'}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Outros idiomas:{' '}
                {Array.isArray(application.other_languages) && application.other_languages.length > 0
                  ? application.other_languages.join(', ')
                  : '-'}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-neutral-900">Serviços</h2>
            {!services || services.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {services.map(service => (
                  <div key={`${service.name}-${service.duration_minutes}`} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-800">{service.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {service.duration_minutes || 60} min • R$ {Number(service.price_brl || 0).toFixed(2)} •{' '}
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">{service.description || 'Sem descrição.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              <h2 className="font-semibold text-neutral-900">Credenciais enviadas</h2>
            </div>
            {!credentials || credentials.length === 0 ? (
              <p className="text-sm text-neutral-500">Sem credenciais anexadas.</p>
            ) : (
              <ul className="space-y-2">
                {credentials.map(item => (
                  <li key={item.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-800">
                        {item.file_name || item.credential_type || 'Documento'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.verified ? 'Verificado' : 'Pendente'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.scan_status === 'clean'
                              ? 'bg-green-50 text-green-700'
                              : item.scan_status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {item.scan_status || 'pending_scan'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      Enviado em {new Date(item.uploaded_at || professional.created_at).toLocaleString('pt-BR')}
                    </p>
                    {item.scan_checked_at ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Scan em {new Date(item.scan_checked_at).toLocaleString('pt-BR')}
                      </p>
                    ) : null}
                    <a
                      href={`/api/professional/credentials/download/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Abrir arquivo
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-brand-500" />
              <h2 className="font-semibold text-neutral-900">Analise semi-automatica (flags)</h2>
            </div>
            <p className="text-xs text-neutral-500">
              Esta analise gera alertas para suporte da decisao do admin. Nao reprova automaticamente.
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              Total: <strong>{semiAuto.summary.total}</strong> • Alto: <strong>{semiAuto.summary.high}</strong> • Medio:{' '}
              <strong>{semiAuto.summary.medium}</strong> • Baixo: <strong>{semiAuto.summary.low}</strong>
            </p>
            {semiAuto.flags.length === 0 ? (
              <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                Nenhuma inconsistencia automatica encontrada nesta revisao.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {semiAuto.flags.map(flag => (
                  <li
                    key={flag.code}
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      flag.severity === 'high'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : flag.severity === 'medium'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <span className="font-semibold uppercase">{flag.severity}</span> • {flag.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-neutral-900">Decisão de revisão</h2>
            <form action={submitReviewDecision} className="space-y-3">
              <input type="hidden" name="professionalId" value={professional.id} />
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Notas para o profissional
                </span>
                <textarea
                  name="notes"
                  defaultValue={professional.admin_review_notes || ''}
                  rows={6}
                  maxLength={1200}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="Descreva ajustes necessários (quando houver)."
                />
              </label>
              <button
                type="submit"
                name="decision"
                value="approved"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </button>
              <button
                type="submit"
                name="decision"
                value="needs_changes"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                <Clock3 className="h-4 w-4" />
                Solicitar ajustes
              </button>
              <button
                type="submit"
                name="decision"
                value="rejected"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}
