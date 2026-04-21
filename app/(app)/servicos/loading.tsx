import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Serviços" subtitle="Gerencie seus serviços e disponibilidade." />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-5 space-y-3">
            <div className="h-5 w-1/3 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
