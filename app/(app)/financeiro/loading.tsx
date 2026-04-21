import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Financeiro" subtitle="Acompanhe ganhos, pagamentos pendentes e volume de agendamentos." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border border-slate-200/80 bg-white p-5">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="h-8 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white p-5">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="h-8 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white p-5">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="h-8 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200/80 bg-white p-5 mb-6">
        <div className="h-5 w-40 rounded bg-slate-200 animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200/80 bg-white p-4">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white p-4">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  )
}
