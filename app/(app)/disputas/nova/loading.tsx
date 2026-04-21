import { PageContainer, PageHeader } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Abrir disputa" subtitle="Descreva o problema para que possamos ajudar." />
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-32 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-32 rounded bg-slate-200 animate-pulse" />
      </div>
    </PageContainer>
  )
}
