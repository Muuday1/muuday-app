import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Planos" subtitle="Escolha o plano ideal para o seu perfil." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
            <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="h-10 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
