import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Prontuário" subtitle="Informações do cliente." />
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 space-y-3">
          <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-24 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  )
}
