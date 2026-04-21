import Link from 'next/link'

export default function ProfissionalEmAnalisePage() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200/80 bg-white p-8">
      <h1 className="mb-3 font-display text-3xl font-bold text-slate-900">Cadastro enviado para análise</h1>
      <p className="mb-4 text-slate-500">
        Recebemos seus dados profissionais. Nossa equipe vai revisar as informações e validar sua especialidade.
      </p>
      <p className="mb-6 text-slate-500">
        Você receberá um e-mail quando for aprovado para completar as demais informações e finalizar a ativação da
        conta profissional.
      </p>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Dica: verifique também sua caixa de spam e promoções para não perder o e-mail de aprovação.
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-[#9FE870] px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#8ed85f]"
        >
          Ir para login
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-slate-200/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Voltar para home
        </Link>
      </div>
    </div>
  )
}
