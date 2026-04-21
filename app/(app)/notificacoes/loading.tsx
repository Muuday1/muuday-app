import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Notificações" subtitle="Acompanhe atualizações da sua conta." />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
