/**
 * Skeleton shown while the server component fetches the page of contacts.
 *
 * It lives in the `(list)` route group on purpose: a `loading.tsx` directly
 * under `contacts/` would wrap `[id]` too, flushing the HTML shell before the
 * detail page can call `notFound()` — which would turn its 404 into a 200.
 */
export default function ContactsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-10 sm:px-6" aria-busy="true">
      <span className="sr-only">Loading contacts…</span>

      <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="h-9 w-full animate-pulse rounded-md bg-secondary" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-card h-64 animate-pulse rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-secondary/70" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-secondary/70" />
                <div className="h-3 w-24 rounded bg-secondary/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
