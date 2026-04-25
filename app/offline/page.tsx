import { ReloadButton } from './ReloadButton'

export const metadata = {
  title: 'Offline — Muuday',
  description: 'Você está offline. Alguns recursos podem não estar disponíveis.',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-3xl font-bold text-slate-800">Você está offline</h1>
      <p className="mb-8 max-w-md text-slate-600">
        Parece que você perdeu a conexão com a internet. Alguns recursos da Muuday
        ainda funcionam, mas para agendar sessões e acessar seu perfil você precisa
        estar online.
      </p>
      <ReloadButton />
    </div>
  )
}
