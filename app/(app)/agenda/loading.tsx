export default function AgendaLoading() {
  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-slate-200 animate-pulse" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {/* Calendar header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-200 animate-pulse" />
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-slate-200/80 bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Upcoming sessions skeleton */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 h-5 w-40 rounded bg-slate-200 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-slate-200/80 py-3 first:border-0">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
