export default function Loading() {
  return (
    <main className="animate-pulse space-y-6">
      <div className="h-48 w-full rounded-3xl border border-border bg-card p-8" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-56 rounded-3xl border border-border bg-card p-6" />
        <div className="h-56 rounded-3xl border border-border bg-card p-6" />
        <div className="h-56 rounded-3xl border border-border bg-card p-6" />
      </div>
    </main>
  );
}
