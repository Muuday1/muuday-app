export type NotificationChannel = 'in_app' | 'email' | 'push'

export type NotificationCategoryPrefs = {
  channels: NotificationChannel[]
}

export type NotificationCategoryKey = 'bookings' | 'sessions' | 'finance' | 'marketing'

export type NotificationPreferences = {
  booking_emails: boolean
  session_reminders: boolean
  news_promotions: boolean
  chat_messages: boolean
  categories?: Partial<Record<NotificationCategoryKey, NotificationCategoryPrefs>>
  quiet_hours?: {
    enabled: boolean
    start: string
    end: string
  }
}

export type UserRole = 'usuario' | 'profissional' | 'admin' | null

export type ProfessionalWorkspaceSummary = {
  id: string
  status: string
  tier: string
  firstBookingEnabled: boolean
  gateNote: string
  pendingConfirmations: number
  openRequests: number
  availabilityCount: number
  confirmationMode: string
  minNoticeHours: number
  maxWindowDays: number
  serviceCount: number
  specialtyCount: number
  billingCardOnFile: boolean
  payoutOnboardingStarted: boolean
  payoutKycCompleted: boolean
}

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  booking_emails: true,
  session_reminders: true,
  news_promotions: true,
  chat_messages: true,
  categories: {
    bookings: { channels: ['in_app', 'email', 'push'] },
    sessions: { channels: ['in_app', 'email', 'push'] },
    finance: { channels: ['in_app', 'email'] },
    marketing: { channels: ['email'] },
  },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

export const NOTIFICATION_ITEMS: {
  key: keyof NotificationPreferences
  label: string
  desc: string
}[] = [
  {
    key: 'booking_emails',
    label: 'E-mails de agendamento',
    desc: 'Confirmações, cancelamentos, pagamentos e avaliações',
  },
  {
    key: 'session_reminders',
    label: 'Lembretes de sessão',
    desc: 'Lembrete 24h e 1h antes da sessão',
  },
  {
    key: 'chat_messages',
    label: 'Mensagens do chat',
    desc: 'Notificações push quando receber mensagens novas',
  },
  {
    key: 'news_promotions',
    label: 'Novidades e promoções',
    desc: 'Atualizações da plataforma, dicas e ofertas',
  },
]

export const NOTIFICATION_CATEGORIES: {
  key: NotificationCategoryKey
  label: string
  desc: string
  defaultChannels: NotificationChannel[]
}[] = [
  {
    key: 'bookings',
    label: 'Agendamentos',
    desc: 'Confirmações, cancelamentos, solicitações de horário',
    defaultChannels: ['in_app', 'email', 'push'],
  },
  {
    key: 'sessions',
    label: 'Sessões',
    desc: 'Lembretes, início e fim de sessão',
    defaultChannels: ['in_app', 'email', 'push'],
  },
  {
    key: 'finance',
    label: 'Financeiro',
    desc: 'Repasse processado, pagamento falhou',
    defaultChannels: ['in_app', 'email'],
  },
  {
    key: 'marketing',
    label: 'Novidades e promoções',
    desc: 'Atualizações da plataforma, dicas e ofertas',
    defaultChannels: ['email'],
  },
]

export function tierLabel(tier: string) {
  if (tier === 'premium') return 'PREMIUM'
  if (tier === 'professional') return 'PROFESSIONAL'
  return 'BÁSICO'
}

export function professionalAlerts(summary: ProfessionalWorkspaceSummary | null) {
  if (!summary) return []
  const alerts: Array<{ id: string; level: 'warning' | 'critical'; title: string; description: string }> = []

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

  return alerts
}
