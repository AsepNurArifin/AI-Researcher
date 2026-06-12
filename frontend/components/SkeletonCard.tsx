"use client";

interface SkeletonCardProps {
  count?: number;
  layout?: "grid" | "list";
}

export default function SkeletonCard({ count = 3, layout = "grid" }: SkeletonCardProps) {
  const items = Array.from({ length: count });

  if (layout === "list") {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-900/20 p-4 animate-pulse"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 rounded bg-slate-800 animate-shimmer" />
              <div className="h-3 w-1/5 rounded bg-slate-800 animate-shimmer" />
            </div>
            <div className="h-8 w-16 rounded-full bg-slate-800 animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/5 bg-slate-900/20 p-6 space-y-4 animate-pulse"
        >
          <div className="h-3 w-1/4 rounded bg-slate-800 animate-shimmer" />
          <div className="h-6 w-3/4 rounded bg-slate-800 animate-shimmer" />
          <div className="h-4 w-1/2 rounded bg-slate-800 animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
