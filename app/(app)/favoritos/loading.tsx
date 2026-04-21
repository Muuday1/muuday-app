import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Favoritos" subtitle="Profissionais que você salvou." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200/80 bg-white p-4 space-y-3">
            <div className="h-32 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-5 w-2/3 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
