import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Muuday',
  description: 'Entenda como a Muuday coleta, usa e protege seus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <PublicPageLayout>
      <div className="mu-shell max-w-3xl py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-slate mt-10 max-w-none">
          <h2>1. Introdução</h2>
          <p>
            A Muuday valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos,
            usamos, armazenamos e protegemos suas informações pessoais quando você usa nossa plataforma.
          </p>

          <h2>2. Dados que coletamos</h2>
          <p>Podemos coletar os seguintes tipos de dados:</p>
          <ul>
            <li>
              <strong>Dados de cadastro</strong>: nome, e-mail, telefone, documento de identificação e foto de perfil.
            </li>
            <li>
              <strong>Dados de pagamento</strong>: informações de cartão de crédito processadas por gateways seguros (não armazenamos dados completos de cartão).
            </li>
            <li>
              <strong>Dados de uso</strong>: logs de acesso, interações na plataforma, preferências de idioma e fuso horário.
            </li>
            <li>
              <strong>Dados de profissionais</strong>: formação, especialidades, certificados e dados necessários para verificação.
            </li>
          </ul>

          <h2>3. Como usamos seus dados</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Prestar os serviços oferecidos pela plataforma;</li>
            <li>Processar agendamentos, pagamentos e reembolsos;</li>
            <li>Enviar notificações sobre sessões, mensagens e atualizações;</li>
            <li>Melhorar a experiência do usuário e a segurança da plataforma;</li>
            <li>Cumprir obrigações legais e regulatórias (LGPD, GDPR).</li>
          </ul>

          <h2>4. Compartilhamento de dados</h2>
          <p>
            Não vendemos seus dados pessoais. Compartilhamos informações apenas com:
          </p>
          <ul>
            <li>Profissionais contratados por você, conforme necessário para o agendamento;</li>
            <li>Provedores de pagamento (Stripe, etc.) para processamento de transações;</li>
            <li>Autoridades competentes, quando exigido por lei.</li>
          </ul>

          <h2>5. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e
            em repouso, controle de acesso e monitoramento contínuo.
          </p>

          <h2>6. Seus direitos</h2>
          <p>De acordo com a LGPD e outras legislações aplicáveis, você tem direito a:</p>
          <ul>
            <li>Acessar, corrigir ou excluir seus dados pessoais;</li>
            <li>Revogar consentimento para uso de dados;</li>
            <li>Solicitar portabilidade dos dados;</li>
            <li>Obter informações sobre com quem seus dados foram compartilhados.</li>
          </ul>

          <h2>7. Contato</h2>
          <p>
            Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato pela página de{' '}
            <Link href="/ajuda">Ajuda</Link>.
          </p>
        </div>
      </div>
    </PublicPageLayout>
  )
}
