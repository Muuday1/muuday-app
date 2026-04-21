import { PageContainer } from '@/components/ui/AppShell'

export default function Loading() {
  return (
    <PageContainer maxWidth="md" className="h-[calc(100vh-80px)] flex flex-col">
      <div className="rounded-lg border border-slate-200/80 bg-white flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="h-10 w-48 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200/80">
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  )
}
