import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="xl">
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="h-96 rounded bg-slate-200 animate-pulse" />
      </div>
    </PageContainer>
  )
}
