import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
            <div className="h-64 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-3">
            <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
