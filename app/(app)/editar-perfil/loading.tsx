export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-4 w-80 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </div>
  )
}
