import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f4ef] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-neutral-500 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
