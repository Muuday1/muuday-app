export default function ConfiguracoesLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-200 animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-t-lg bg-slate-200 animate-pulse" />
        ))}
      </div>

      {/* Settings content skeleton */}
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 h-5 w-36 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="h-6 w-11 rounded-full bg-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-3">
            <div>
              <div className="mb-1 h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full max-w-md rounded-md bg-slate-200 animate-pulse" />
            </div>
            <div>
              <div className="mb-1 h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full max-w-md rounded-md bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
