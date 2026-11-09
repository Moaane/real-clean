import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";
import { Skeleton } from "@/components/ui";

async function Guard({ role, children }: { role: Role; children: ReactNode }) {
  await requireRole(role); // pemeriksaan ulang di server (proxy hanya optimistik)
  return children;
}

/** Membungkus area berlogin: cookie dibaca di dalam Suspense agar shell tetap bisa diprerender. */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12" aria-hidden="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-6 h-40 rounded-lg" />
        </div>
      }
    >
      <Guard role={role}>{children}</Guard>
    </Suspense>
  );
}
