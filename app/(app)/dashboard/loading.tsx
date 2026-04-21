export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-slate-200 animate-pulse" />
      </div>

      {/* Alert card skeleton */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-64 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-full max-w-lg rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
            <div className="mt-2 h-7 w-12 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 h-5 w-32 rounded bg-slate-200 animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-slate-200/80 py-3 first:border-0">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 h-5 w-28 rounded bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
