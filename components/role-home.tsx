import type { Role } from "@/generated/prisma/enums";
import { logout } from "@/lib/actions/auth";
import { requireRole } from "@/lib/auth";

// Placeholder landing page per role; real dashboards arrive in later milestones.
export async function RoleHome({ role, title }: { role: Role; title: string }) {
  const user = await requireRole(role);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p>
        Masuk sebagai <strong>{user.nama}</strong> ({user.email}), role{" "}
        <code>{user.role}</code>.
      </p>
      <form action={logout}>
        <button type="submit" className="rounded border border-zinc-400 px-4 py-2">
          Keluar
        </button>
      </form>
    </main>
  );
}
