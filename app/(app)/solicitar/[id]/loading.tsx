import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 md:p-7 space-y-4">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-32 rounded bg-slate-200 animate-pulse" />
        <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
      </div>
    </PageContainer>
  )
}
