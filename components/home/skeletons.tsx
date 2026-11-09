import { Skeleton } from "@/components/ui";

export function SectionSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24" aria-hidden="true">
      <Skeleton className="h-12 w-2/3 max-w-xl" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Skeleton className="aspect-[4/3] rounded-lg" />
        <Skeleton className="aspect-[4/3] rounded-lg" />
        <Skeleton className="aspect-[4/3] rounded-lg" />
      </div>
    </div>
  );
}
