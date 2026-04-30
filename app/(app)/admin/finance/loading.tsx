import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Financeiro" subtitle="Visão geral financeira da plataforma." />
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-5">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse mb-3" />
              <div className="h-6 w-16 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white p-5">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
