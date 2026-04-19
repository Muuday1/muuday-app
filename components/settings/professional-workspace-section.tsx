'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  Settings,
  Wallet,
} from 'lucide-react'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import { tierLabel } from './workspace-helpers'
import type { ProfessionalWorkspaceSummary } from './workspace-helpers'

interface ProfessionalWorkspaceSectionProps {
  summary: ProfessionalWorkspaceSummary | null
  onboardingEvaluation: ProfessionalOnboardingEvaluation | null
  pendingConfirmationsCount?: number
}

export function ProfessionalWorkspaceSection({
  summary,
  onboardingEvaluation,
  pendingConfirmationsCount,
}: ProfessionalWorkspaceSectionProps) {
  const alerts: Array<{ id: string; level: 'warning' | 'critical'; title: string; description: string }> = []

  if (summary) {
    if (summary.status !== 'approved') {
      alerts.push({
        id: 'status-not-approved',
        level: summary.status === 'rejected' || summary.status === 'suspended' ? 'critical' : 'warning',
        title: 'Conta profissional com restrição operacional',
        description:
          summary.status === 'pending_review'
            ? 'Seu perfil ainda está em revisão. Algumas ações ficam bloqueadas até aprovação.'
            : 'Seu perfil não está aprovado. Revise dados de perfil e status de compliance.',
      })
    }

    if (!summary.firstBookingEnabled) {
      alerts.push({
        id: 'first-booking-gate',
        level: 'warning',
        title: 'Primeiro agendamento bloqueado',
        description:
          summary.gateNote ||
          'Finalize os requisitos de go-live para liberar o primeiro agendamento.',
      })
    }

    if (summary.availabilityCount === 0) {
      alerts.push({
        id: 'availability-empty',
        level: 'critical',
        title: 'Sem disponibilidade ativa',
        description: 'Adicione horários de atendimento para receber novos agendamentos.',
      })
    }
  }

  return (
    <>
      {summary && (
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              Plano: {tierLabel(summary.tier)}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              Status: {summary.status}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-neutral-700 sm:grid-cols-2">
            <p>Pendências de confirmação: {summary.pendingConfirmations}</p>
            <p>Requests abertos: {summary.openRequests}</p>
            <p>Disponibilidade ativa: {summary.availabilityCount}</p>
            <p>Confirmação: {summary.confirmationMode}</p>
            <p>Antecedência mínima: {summary.minNoticeHours}h</p>
            <p>Janela máxima: {summary.maxWindowDays} dias</p>
          </div>
        </div>
      )}

      {onboardingEvaluation && (
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-neutral-900">
              Onboarding C1-C10 (Wave 2)
            </h2>
            <Link
              href="/onboarding-profissional"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Abrir checklist completo
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.values(onboardingEvaluation.gates).map(gate => (
              <div
                key={gate.id}
                className={`rounded-xl border px-3 py-2 ${
                  gate.passed
                    ? 'border-green-200 bg-green-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    gate.passed ? 'text-green-800' : 'text-amber-800'
                  }`}
                >
                  {gate.title}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    gate.passed ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {gate.passed
                    ? 'OK'
                    : gate.blockers[0]?.description || 'Bloqueado por pendências'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-2xl border px-4 py-3 ${
                alert.level === 'critical'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  alert.level === 'critical' ? 'text-red-800' : 'text-amber-800'
                }`}
              >
                {alert.title}
              </p>
              <p
                className={`mt-1 text-xs ${
                  alert.level === 'critical' ? 'text-red-700' : 'text-amber-700'
                }`}
              >
                {alert.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/editar-perfil-profissional"
          className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
        >
          <div className="mb-2 flex items-center gap-2 text-neutral-800">
            <Briefcase className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold">Perfil e servicos</p>
          </div>
          <p className="text-xs text-neutral-500">Categoria, bio, idiomas, preço e duração.</p>
        </Link>

        <Link
          href="/disponibilidade"
          className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
        >
          <div className="mb-2 flex items-center gap-2 text-neutral-800">
            <CalendarClock className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold">Calendário</p>
          </div>
          <p className="text-xs text-neutral-500">Agenda semanal, bloqueios e horários ativos.</p>
        </Link>

        <Link
          href="/configuracoes-agendamento"
          className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
        >
          <div className="mb-2 flex items-center gap-2 text-neutral-800">
            <Settings className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold">Regras de booking</p>
          </div>
          <p className="text-xs text-neutral-500">Notice, janela, recorrência e modo de confirmação.</p>
        </Link>

        <Link
          href="/financeiro"
          className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
        >
          <div className="mb-2 flex items-center gap-2 text-neutral-800">
            <Wallet className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold">Financeiro</p>
          </div>
          <p className="text-xs text-neutral-500">Receitas operacionais (stub Wave 2) e saude financeira.</p>
        </Link>
      </div>

      {pendingConfirmationsCount ? (
        <p className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Você possui pendências de confirmação ativas na agenda.
        </p>
      ) : null}
    </>
  )
}
