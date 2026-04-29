import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Planos" subtitle="Configuração de planos e limites." />
      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="h-5 w-40 rounded bg-slate-200 animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="h-6 w-11 rounded-full bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
