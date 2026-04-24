import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata: Metadata = {
  title: 'Termos de Uso | Muuday',
  description: 'Leia os termos e condições de uso da plataforma Muuday.',
}

export default function TermosDeUsoPage() {
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
          Termos de Uso
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-slate mt-10 max-w-none">
          <h2>1. Aceitação dos termos</h2>
          <p>
            Ao acessar e usar a plataforma Muuday, você concorda em cumprir estes Termos de Uso. Se não concordar
            com qualquer parte destes termos, não utilize nossos serviços.
          </p>

          <h2>2. Definições</h2>
          <ul>
            <li><strong>Plataforma</strong>: site e serviços oferecidos pela Muuday.</li>
            <li><strong>Usuário</strong>: pessoa que busca e agenda serviços profissionais.</li>
            <li><strong>Profissional</strong>: prestador de serviços cadastrado na plataforma.</li>
            <li><strong>Sessão</strong>: atendimento agendado entre usuário e profissional via videochamada.</li>
          </ul>

          <h2>3. Cadastro e conta</h2>
          <p>
            Para usar determinados recursos, você precisa criar uma conta fornecendo informações verdadeiras e
            atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso.
          </p>

          <h2>4. Serviços oferecidos</h2>
          <p>
            A Muuday atua como intermediadora tecnológica, conectando usuários a profissionais. Não prestamos
            diretamente os serviços profissionais anunciados na plataforma.
          </p>

          <h2>5. Pagamentos</h2>
          <p>
            Os pagamentos são processados por gateways de pagamento terceirizados. A Muuday pode reter o valor até a
            realização da sessão, como medida de segurança para ambas as partes.
          </p>
          <ul>
            <li>Cancelamentos seguem a política de cada profissional;</li>
            <li>Reembolsos são analisados caso a caso;</li>
            <li>Taxas de processamento podem ser aplicadas conforme o método de pagamento.</li>
          </ul>

          <h2>6. Conduta do usuário</h2>
          <p>É proibido:</p>
          <ul>
            <li>Usar a plataforma para fins ilegais ou não autorizados;</li>
            <li>Assediar, ameaçar ou discriminar outros usuários ou profissionais;</li>
            <li>Compartilhar conteúdo ofensivo, difamatório ou que viole direitos autorais;</li>
            <li>Tentar acessar áreas restritas da plataforma sem autorização.</li>
          </ul>

          <h2>7. Responsabilidades</h2>
          <p>
            A Muuday não se responsabiliza pela qualidade dos serviços prestados pelos profissionais. As avaliações
            e comentários na plataforma são de responsabilidade de quem os publica.
          </p>

          <h2>8. Modificações</h2>
          <p>
            Podemos alterar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas
            por e-mail ou notificação na plataforma.
          </p>

          <h2>9. Lei aplicável</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any dispute shall be resolved in the courts
            of London, United Kingdom.
          </p>

          <h2>10. Contato</h2>
          <p>
            Dúvidas sobre estes termos? Entre em contato pela página de{' '}
            <Link href="/ajuda">Ajuda</Link>.
          </p>
        </div>
      </div>
    </PublicPageLayout>
  )
}
