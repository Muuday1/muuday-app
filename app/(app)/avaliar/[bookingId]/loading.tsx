import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="sm">
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-24 rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
      </div>
    </PageContainer>
  )
}
