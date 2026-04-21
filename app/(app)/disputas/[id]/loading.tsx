import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md">
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
