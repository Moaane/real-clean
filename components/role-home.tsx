import type { Role } from "@/generated/prisma/enums";
import { logout } from "@/lib/actions/auth";
import { requireRole } from "@/lib/auth";

// Placeholder landing page per role; real dashboards arrive in later milestones.
export async function RoleHome({ role, title }: { role: Role; title: string }) {
  const user = await requireRole(role);
  return (
    <main className="page max-w-2xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="card flex flex-col gap-4">
        <p>
          Masuk sebagai <strong>{user.nama}</strong> ({user.email}){" "}
          <span className="badge badge-soft">{user.role}</span>
        </p>
        <form action={logout}>
          <button type="submit" className="btn btn-outline">
            Keluar
          </button>
        </form>
      </div>
    </main>
  );
}
