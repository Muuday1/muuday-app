import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Mensagens" subtitle="Suas conversas." />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
