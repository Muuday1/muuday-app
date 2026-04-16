import { redirect } from 'next/navigation'

export default function ConfiguracoesAgendamentoPage() {
  redirect('/agenda?view=availability_rules')
}
