export const metadata = { title: 'Onboarding Profissional | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { submitProfessionalForReviewAction } from '@/lib/actions/professional-onboarding'

function statusClasses(passed: boolean) {
  return passed
    ? 'border-green-200 bg-green-50 text-green-800'
    : 'border-amber-200 bg-amber-50 text-amber-800'
}

function searchResultLabel(result: string | undefined) {
  if (!result) return null
  if (result === 'submitted') return 'Perfil enviado para revisao com sucesso.'
  if (result === 'blocked') return 'Ainda existem pendencias obrigatorias para envio.'
  if (result === 'error') return 'Nao foi possivel enviar para revisao. Tente novamente.'
  if (result === 'missing-profile') return 'Perfil profissional nao encontrado.'
  if (result === 'missing-state') return 'Nao foi possivel calcular estado de onboarding.'
  return null
}

export default async function OnboardingProfissionalPage({
  searchParams,
}: {
  searchParams?: { result?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'profissional') {
    redirect('/buscar')
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.id) {
    redirect('/completar-perfil')
  }

  const onboardingState = await loadProfessionalOnboardingState(supabase, professional.id)
  if (!onboardingState) {
    redirect('/completar-perfil')
  }

  const { evaluation } = onboardingState

  const result = searchResultLabel(searchParams?.result)

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900">
          Onboarding profissional C1-C10
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Checklist machine-checkable da Wave 2 para submissao, go-live, primeiro booking e payout.
        </p>
      </div>

      {result && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {result}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.values(evaluation.gates).map(gate => (
          <div key={gate.id} className={`rounded-2xl border p-4 ${statusClasses(gate.passed)}`}>
            <p className="text-sm font-semibold">{gate.title}</p>
            <p className="mt-1 text-xs">
              {gate.passed ? 'Aprovado' : gate.blockers[0]?.description || 'Bloqueado'}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="mb-3 font-display text-xl font-semibold text-neutral-900">Estagios</h2>
        <div className="space-y-3">
          {evaluation.stages.map(stage => (
            <div key={stage.id} className={`rounded-xl border p-3 ${statusClasses(stage.complete)}`}>
              <p className="text-sm font-semibold">{stage.title}</p>
              {!stage.complete && stage.blockers.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {stage.blockers.map(blocker => (
                    <li key={`${stage.id}-${blocker.code}`}>
                      {blocker.description}{' '}
                      {blocker.actionHref ? (
                        <Link href={blocker.actionHref} className="font-semibold underline">
                          Corrigir
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="mb-3 font-display text-xl font-semibold text-neutral-900">
          Matriz de requisitos (C10)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2">Campo</th>
                <th className="px-3 py-2">Conta</th>
                <th className="px-3 py-2">Draft</th>
                <th className="px-3 py-2">Review</th>
                <th className="px-3 py-2">Go-live</th>
                <th className="px-3 py-2">1o booking</th>
                <th className="px-3 py-2">Payout</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.matrix.map(row => (
                <tr key={row.field} className="border-t border-neutral-100">
                  <td className="px-3 py-2 font-medium text-neutral-800">{row.field}</td>
                  <td className="px-3 py-2">{row.required_at_account_creation ? 'Sim' : '-'}</td>
                  <td className="px-3 py-2">{row.required_for_valid_profile_draft ? 'Sim' : '-'}</td>
                  <td className="px-3 py-2">{row.required_for_review_submission ? 'Sim' : '-'}</td>
                  <td className="px-3 py-2">{row.required_for_go_live ? 'Sim' : '-'}</td>
                  <td className="px-3 py-2">
                    {row.required_for_first_booking_acceptance ? 'Sim' : '-'}
                  </td>
                  <td className="px-3 py-2">{row.required_for_payout ? 'Sim' : '-'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        row.met ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.met ? 'OK' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="mb-2 font-display text-lg font-semibold text-neutral-900">C8 Submit for review</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Envio para revisao usa gate machine-checkable (C2-C6).
        </p>
        <form action={submitProfessionalForReviewAction}>
          <button
            type="submit"
            disabled={!evaluation.summary.canSubmitForReview}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enviar para revisao
          </button>
        </form>
      </div>
    </div>
  )
}
