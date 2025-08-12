export function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border bg-white">
      <div className="aspect-[4/3] bg-neutral-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-200" />
        <div className="h-3 w-2/3 rounded bg-neutral-200" />
      </div>
    </div>
  );
}
