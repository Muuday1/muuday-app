export default function BuscarLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header skeleton */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="h-8 w-32 rounded-lg bg-neutral-200 animate-pulse" />
          <div className="ml-auto h-8 w-24 rounded-lg bg-neutral-200 animate-pulse" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="h-10 w-full max-w-xl rounded-xl bg-neutral-200 animate-pulse" />
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-8">
        {/* Filters sidebar skeleton */}
        <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
          <div className="h-6 w-32 rounded bg-neutral-200 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 w-full rounded bg-neutral-200 animate-pulse" />
            ))}
          </div>
          <div className="h-6 w-32 rounded bg-neutral-200 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-full rounded bg-neutral-200 animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Results grid skeleton */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-neutral-200 animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-neutral-200 animate-pulse" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 rounded bg-neutral-200 animate-pulse" />
                <div className="h-4 w-32 rounded bg-neutral-200 animate-pulse" />
                <div className="h-4 w-full max-w-md rounded bg-neutral-200 animate-pulse" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="h-8 w-24 rounded-lg bg-neutral-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
