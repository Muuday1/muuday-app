import Link from 'next/link'

export default function ProfissionalEmAnalisePage() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 font-display text-3xl font-bold text-neutral-900">Cadastro enviado para análise</h1>
      <p className="mb-4 text-neutral-600">
        Recebemos seus dados profissionais. Nossa equipe vai revisar as informações e validar sua especialidade.
      </p>
      <p className="mb-6 text-neutral-600">
        Você receberá um e-mail quando for aprovado para completar as demais informações e finalizar a ativação da
        conta profissional.
      </p>

      <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
        Dica: verifique também sua caixa de spam e promoções para não perder o e-mail de aprovação.
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Ir para login
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Voltar para home
        </Link>
      </div>
    </div>
  )
}
