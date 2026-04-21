import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#9FE870]/8 rounded-lg flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-slate-500 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 bg-[#9FE870] hover:bg-[#8ed85f] text-slate-900 font-semibold px-6 py-3 rounded-md transition-all text-sm"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
