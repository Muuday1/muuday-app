import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Casos" subtitle="Fila de disputas e casos pendentes." />
      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="h-5 w-40 rounded bg-slate-200 animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
