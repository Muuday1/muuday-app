export default function PerfilLoading() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-neutral-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-neutral-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-neutral-200 animate-pulse" />
        </div>
      </div>

      {/* Form sections skeleton */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 h-5 w-32 rounded bg-neutral-200 animate-pulse" />
          <div className="space-y-3">
            <div>
              <div className="mb-1 h-4 w-20 rounded bg-neutral-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-neutral-200 animate-pulse" />
            </div>
            <div>
              <div className="mb-1 h-4 w-20 rounded bg-neutral-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-neutral-200 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 h-5 w-40 rounded bg-neutral-200 animate-pulse" />
          <div className="space-y-3">
            <div>
              <div className="mb-1 h-4 w-24 rounded bg-neutral-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-neutral-200 animate-pulse" />
            </div>
            <div>
              <div className="mb-1 h-4 w-24 rounded bg-neutral-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-neutral-200 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="h-10 w-32 rounded-xl bg-neutral-200 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
