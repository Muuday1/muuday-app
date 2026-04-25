import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata: Metadata = {
  title: 'Política de Cookies | Muuday',
  description: 'Entenda como a Muuday usa cookies, quais categorias existem e como gerenciar suas preferências.',
}

export default function CookiesPolicyPage() {
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
          Política de Cookies
        </h1>
        <p className="mt-3 text-sm text-slate-500" suppressHydrationWarning>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-slate mt-10 max-w-none">
          <h2>O que são cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles
            ajudam a lembrar preferências, manter sua sessão e entender como o site é usado.
          </p>

          <h2>Como usamos cookies</h2>
          <p>
            Usamos cookies <strong>necessários</strong> para o funcionamento do site. Além disso, podemos usar cookies
            de <strong>analytics</strong> e <strong>marketing</strong> somente conforme sua escolha (opt-in/opt-out),
            levando em conta práticas regulatórias do país em que você acessa.
          </p>

          <h2>Categorias de cookies</h2>
          <ul>
            <li>
              <strong>Necessários</strong>: essenciais para recursos básicos (ex.: autenticação, segurança, navegação).
              Sempre ativos.
            </li>
            <li>
              <strong>Analytics</strong>: nos ajudam a entender uso e melhorar experiência (ex.: métricas de páginas).
            </li>
            <li>
              <strong>Marketing</strong>: usados para medir e personalizar campanhas e comunicações.
            </li>
          </ul>

          <h2>Gerenciar preferências</h2>
          <p>
            Você pode ajustar suas preferências a qualquer momento pelo link “Gerenciar cookies” no rodapé do site. Se
            preferir, você também pode remover cookies nas configurações do seu navegador — isso pode impactar recursos
            que dependem de cookies necessários.
          </p>

          <h2>Base legal e variações por país</h2>
          <p>
            Regras e exigências podem variar por jurisdição (ex.: GDPR/UE, LGPD/Brasil, CCPA/EUA). Por isso, exibimos um
            aviso de cookies e pedimos escolhas de consentimento/opt-out de acordo com o país detectado no momento do
            acesso. Quando houver dúvida, adotamos uma abordagem conservadora para cookies não essenciais.
          </p>

          <h2>Contato</h2>
          <p>
            Se você tiver dúvidas sobre esta Política de Cookies, fale com a gente pela página de{' '}
            <Link href="/ajuda">Ajuda</Link>.
          </p>
        </div>
      </div>
    </PublicPageLayout>
  )
}
