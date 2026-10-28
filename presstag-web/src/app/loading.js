export default function Loading() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="min-h-[55vh] w-full py-8"
    >
      <div className="mb-8 flex items-center gap-3 text-sm font-medium text-gray-600">
        <span
          aria-hidden="true"
          className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-[var(--primary-color)] motion-safe:animate-spin"
        />
        <span>Loading page…</span>
      </div>

      <div aria-hidden="true" className="space-y-5">
        <div className="h-8 w-3/4 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-gray-100 motion-safe:animate-pulse" />
        <div className="aspect-[16/7] w-full rounded-xl bg-gray-200 motion-safe:animate-pulse" />
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full rounded bg-gray-100 motion-safe:animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-100 motion-safe:animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-gray-100 motion-safe:animate-pulse" />
        </div>
      </div>
    </section>
  );
}
