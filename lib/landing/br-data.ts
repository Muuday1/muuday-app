/**
 * Brazilian landing page content data.
 *
 * This file holds all Portuguese copy for the homepage so that:
 * 1. Translators can work without touching JSX.
 * 2. Future market-specific landings (MX, PT, UK) can swap this file.
 * 3. CMS migration (Sanity) becomes a drop-in replacement.
 */

import { Search, CalendarCheck, Video, Globe, Clock } from 'lucide-react'

export const HERO_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
]

export const STATS = [
  { value: 100, suffix: '%', label: 'Online por vídeo', icon: Video },
  { value: 50, suffix: '+', label: 'Áreas de atuação', icon: Globe },
  { value: 24, suffix: '/7', label: 'Agende quando quiser', icon: Clock },
]

export const FOR_WHO = [
  {
    title: 'Para quem mora fora',
    body: 'Psicólogos, nutricionistas e coaches que entendem sua realidade de brasileiro no exterior.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
  },
  {
    title: 'Para quem viaja',
    body: 'Agende sessões de qualquer lugar. Seu profissional está a um clique, independente do fuso.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
  },
  {
    title: 'Para profissionais',
    body: 'Expanda sua clientela para brasileiros no mundo todo. Defina seus horários e preços.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  },
]

export const HOW_STEPS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Filtros por especialidade, idioma, país e disponibilidade.',
    icon: Search,
    color: 'green' as const,
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha dia, horário e tipo de sessão. Confirmação instantânea.',
    icon: CalendarCheck,
    color: 'blue' as const,
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Videochamada integrada. Sem Zoom, Teams ou WhatsApp.',
    icon: Video,
    color: 'slate' as const,
  },
]

export const COMPARISON_ROWS = [
  { traditional: 'Horários em fusos diferentes', muuday: 'Agendamento automático no seu fuso' },
  { traditional: 'Idioma pode ser barreira', muuday: '100% em português' },
  { traditional: 'Sem contexto da vida no exterior', muuday: 'Profissionais que vivem ou viveram fora' },
  { traditional: 'Várias ferramentas', muuday: 'Busca, agendamento e vídeo em um só lugar' },
]

export const FAQ_ITEMS = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer: 'Não. Você pode procurar sem cadastro. Só precisa de conta para agendar, salvar favoritos ou mandar mensagem.',
  },
  {
    question: 'Os atendimentos são sempre online?',
    answer: 'Sim, todos por videochamada. Assim você pode atender ou ser atendido de qualquer lugar.',
  },
  {
    question: 'Posso agendar recorrência ou várias datas?',
    answer: 'Sim. Uma vez, toda semana, ou várias datas diferentes. Você escolhe.',
  },
  {
    question: 'Como funciona a entrada de profissionais?',
    answer: 'É simples: você cria seu perfil, define serviços e preços, e publica sua disponibilidade. A equipe revisa antes de aprovar.',
  },
]

export const COUNTRIES = [
  ['🇵🇹', 'Portugal'],
  ['🇬🇧', 'Reino Unido'],
  ['🇩🇪', 'Alemanha'],
  ['🇫🇷', 'França'],
  ['🇮🇪', 'Irlanda'],
  ['🇳🇱', 'Holanda'],
  ['🇮🇹', 'Itália'],
  ['🇪🇸', 'Espanha'],
  ['🇺🇸', 'EUA'],
  ['🇨🇦', 'Canadá'],
  ['🇦🇺', 'Austrália'],
  ['🇯🇵', 'Japão'],
  ['🇧🇷', 'Brasil'],
  ['🇨🇭', 'Suíça'],
  ['🇸🇪', 'Suécia'],
  ['🇳🇴', 'Noruega'],
]
