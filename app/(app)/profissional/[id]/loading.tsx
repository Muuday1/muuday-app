export default function ProfessionalProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Cover skeleton */}
      <div className="h-48 w-full bg-slate-200 animate-pulse md:h-64" />

      <div className="mx-auto max-w-4xl px-4">
        {/* Profile header skeleton */}
        <div className="relative -mt-16 mb-6 flex flex-col items-center gap-3 md:flex-row md:items-end md:gap-4">
          <div className="h-32 w-32 shrink-0 rounded-lg border-4 border-white bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="h-7 w-48 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-9 w-9 rounded-md bg-slate-200 animate-pulse" />
          </div>
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 h-5 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 h-5 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — booking panel */}
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 h-5 w-36 rounded bg-slate-200 animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
                <div className="h-12 w-full rounded-md bg-slate-200 animate-pulse" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-2 h-5 w-28 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="mt-1 h-6 w-24 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
