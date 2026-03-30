export type WorkspaceAlertLevel = 'info' | 'warning' | 'critical'

export type WorkspaceAlert = {
  id: string
  level: WorkspaceAlertLevel
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  blocking?: boolean
}

type ProfessionalRecord = {
  status?: string | null
  bio?: string | null
  category?: string | null
  session_price_brl?: number | string | null
  session_duration_minutes?: number | null
  first_booking_enabled?: boolean | null
  first_booking_gate_note?: string | null
  tier?: string | null
}

type ProfessionalSettingsRecord = {
  confirmation_mode?: string | null
  timezone?: string | null
  minimum_notice_hours?: number | null
  max_booking_window_days?: number | null
  enable_recurring?: boolean | null
}

type AlertInput = {
  professional: ProfessionalRecord | null
  settings: ProfessionalSettingsRecord | null
  pendingConfirmations: number
  openRequests: number
  hasCalendarIntegration: boolean
  hasActiveAvailability: boolean
  hasAcceptedBookings: boolean
}

function hasCompleteProfile(professional: ProfessionalRecord | null) {
  if (!professional) return false
  const hasBio = Boolean((professional.bio || '').trim())
  const hasCategory = Boolean((professional.category || '').trim())
  const hasPrice = Number(professional.session_price_brl || 0) > 0
  const hasDuration = Number(professional.session_duration_minutes || 0) > 0
  return hasBio && hasCategory && hasPrice && hasDuration
}

export function buildProfessionalWorkspaceAlerts({
  professional,
  settings,
  pendingConfirmations,
  openRequests,
  hasCalendarIntegration,
  hasActiveAvailability,
  hasAcceptedBookings,
}: AlertInput): WorkspaceAlert[] {
  if (!professional) {
    return [
      {
        id: 'missing-professional-profile',
        level: 'critical',
        title: 'Perfil profissional nao encontrado',
        description: 'Complete o onboarding profissional para desbloquear o workspace.',
        actionHref: '/completar-perfil',
        actionLabel: 'Completar onboarding',
        blocking: true,
      },
    ]
  }

  const alerts: WorkspaceAlert[] = []

  if (professional.status !== 'approved') {
    const statusMap: Record<string, string> = {
      draft: 'Seu perfil ainda esta em rascunho e nao aparece na busca.',
      pending_review: 'Seu perfil esta em revisao antes de ir para o ar.',
      rejected: 'Seu perfil foi rejeitado e precisa ajustes para nova revisao.',
      suspended: 'Seu perfil foi suspenso temporariamente pela operacao.',
    }
    alerts.push({
      id: 'professional-status',
      level: professional.status === 'rejected' || professional.status === 'suspended' ? 'critical' : 'warning',
      title: 'Status da conta profissional',
      description:
        statusMap[String(professional.status)] || 'Seu perfil ainda nao esta totalmente ativo.',
      actionHref: '/configuracoes',
      actionLabel: 'Revisar status',
      blocking: professional.status !== 'pending_review',
    })
  }

  if (!hasCompleteProfile(professional)) {
    alerts.push({
      id: 'profile-incomplete',
      level: 'warning',
      title: 'Perfil incompleto',
      description:
        'Faltam dados essenciais de perfil, categoria ou precificacao para melhorar conversao.',
      actionHref: '/editar-perfil-profissional',
      actionLabel: 'Completar perfil',
      blocking: true,
    })
  }

  if (!hasActiveAvailability) {
    alerts.push({
      id: 'availability-missing',
      level: 'critical',
      title: 'Sem disponibilidade ativa',
      description: 'Ative dias e horarios para poder receber agendamentos.',
      actionHref: '/disponibilidade',
      actionLabel: 'Configurar disponibilidade',
      blocking: true,
    })
  }

  if (!hasAcceptedBookings && !professional.first_booking_enabled) {
    const note = (professional.first_booking_gate_note || '').trim()
    alerts.push({
      id: 'first-booking-gate',
      level: 'warning',
      title: 'Primeiro agendamento bloqueado',
      description:
        note ||
        'Seu primeiro agendamento ainda depende de liberacao operacional.',
      actionHref: '/configuracoes',
      actionLabel: 'Ver detalhes',
      blocking: true,
    })
  }

  if (pendingConfirmations > 0 && String(settings?.confirmation_mode) === 'manual') {
    alerts.push({
      id: 'manual-confirmation-pending',
      level: 'critical',
      title: 'Confirmacoes pendentes',
      description: `${pendingConfirmations} agendamento(s) aguardando sua decisao dentro do SLA.`,
      actionHref: '/agenda?view=pending',
      actionLabel: 'Abrir pendencias',
    })
  }

  if (openRequests > 0) {
    alerts.push({
      id: 'request-booking-open',
      level: 'info',
      title: 'Solicitacoes aguardando resposta',
      description: `${openRequests} solicitacao(oes) de horario aguardando proposta ou decisao.`,
      actionHref: '/agenda?view=requests',
      actionLabel: 'Abrir solicitacoes',
    })
  }

  if (!hasCalendarIntegration) {
    alerts.push({
      id: 'calendar-not-connected',
      level: 'info',
      title: 'Calendario externo nao conectado',
      description:
        'Conectar calendario reduz conflitos e melhora confiabilidade da agenda.',
      actionHref: '/agenda?view=settings',
      actionLabel: 'Ver integracao',
    })
  }

  return alerts
}
