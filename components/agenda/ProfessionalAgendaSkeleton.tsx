export default function ProfessionalAgendaSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* View switcher skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-9 w-28 rounded-md bg-slate-200" />
        <div className="h-9 w-28 rounded-md bg-slate-200" />
        <div className="h-9 w-28 rounded-md bg-slate-200" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="h-24 rounded-lg bg-slate-100 p-4">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
        </div>
        <div className="h-24 rounded-lg bg-slate-100 p-4">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
        </div>
        <div className="h-24 rounded-lg bg-slate-100 p-4">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
        </div>
      </div>

      {/* Bookings list skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-32 rounded-lg bg-slate-100 p-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-md bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-200" />
            </div>
          </div>
        </div>
        <div className="h-32 rounded-lg bg-slate-100 p-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-md bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
