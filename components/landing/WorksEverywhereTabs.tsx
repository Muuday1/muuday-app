'use client'

import { useState } from 'react'
import { Search, CalendarDays, MessageCircle, CreditCard, ArrowRight, CheckCircle } from 'lucide-react'

const TABS = [
  {
    key: 'buscar',
    icon: Search,
    label: 'Buscar',
    title: 'Encontre o especialista ideal em segundos',
    body: 'Filtre por especialidade, idioma, país e disponibilidade. Compare perfis, preços e avaliações antes de agendar.',
    features: ['Filtros avançados por especialidade', 'Avaliações verificadas', 'Preços transparentes', 'Perfil completo com vídeo'],
  },
  {
    key: 'agendar',
    icon: CalendarDays,
    label: 'Agendar',
    title: 'Agendamento automático no seu fuso',
    body: 'Escolha dia, horário e tipo de sessão. A plataforma converte automaticamente para o fuso do profissional.',
    features: ['Conversão de fuso automática', 'Agendamento recorrente', 'Lembretes por e-mail', 'Sincronização com calendário'],
  },
  {
    key: 'atender',
    icon: MessageCircle,
    label: 'Atender',
    title: 'Videochamada integrada e segura',
    body: 'Sessões por vídeo direto na plataforma. Sem precisar de Zoom, Teams ou WhatsApp. Tudo em um só lugar.',
    features: ['Videochamada HD integrada', 'Chat durante a sessão', 'Compartilhamento de tela', 'Gravação opcional'],
  },
  {
    key: 'pagar',
    icon: CreditCard,
    label: 'Pagar',
    title: 'Pagamento seguro e parcelado',
    body: 'Pague com cartão de crédito, débito ou Pix. O valor só é liberado para o profissional após a sessão.',
    features: ['Cartão, Pix e boleto', 'Parcelamento em até 12x', 'Dinheiro protegido até a sessão', 'Nota fiscal automática'],
  },
]

export function WorksEverywhereTabs() {
  const [active, setActive] = useState('buscar')
  const tab = TABS.find((t) => t.key === active)!

  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition ${
              active === t.key
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-8 p-8 md:p-12 md:grid-cols-2">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">{tab.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{tab.body}</p>
        </div>
        <div className="space-y-3">
          {tab.features.map((feat) => (
            <div key={feat} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-[#9FE870]" />
              <span className="text-sm font-medium text-slate-700">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
