import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";
import { Skeleton } from "@/components/ui";

async function Guard({ role, children }: { role: Role; children: ReactNode }) {
  await requireRole(role); // re-checked on the server (the proxy is optimistic only)
  return children;
}

/** Wraps the logged-in area: the cookie is read inside Suspense so the shell can still be prerendered. */
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
