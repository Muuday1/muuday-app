export default function LoadingBuscarPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-9 w-72 bg-neutral-200 rounded-lg mb-3" />
        <div className="h-4 w-96 max-w-full bg-neutral-100 rounded-lg" />
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="h-12 flex-1 bg-neutral-100 rounded-xl" />
          <div className="h-12 w-32 bg-neutral-200 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6 items-start">
        <aside className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
          <div className="h-5 w-24 bg-neutral-200 rounded-lg" />
          <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 w-full bg-neutral-100 rounded-xl" />
            <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          </div>
          <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          <div className="h-10 w-full bg-neutral-100 rounded-xl" />
          <div className="h-10 w-full bg-neutral-200 rounded-xl" />
        </aside>

        <section>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-9 w-28 bg-neutral-100 rounded-full" />
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-56 bg-neutral-100 rounded-lg" />
            <div className="h-10 w-56 bg-neutral-100 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-neutral-200 rounded mb-2" />
                    <div className="h-4 w-28 bg-neutral-100 rounded mb-3" />
                    <div className="h-4 w-full bg-neutral-100 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-neutral-100 rounded mb-3" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                      <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                      <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
