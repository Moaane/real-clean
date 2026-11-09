import type { Role } from "@/generated/prisma/enums";
import { logout } from "@/lib/actions/auth";
import { requireRole } from "@/lib/auth";
import { Icon } from "./icons";

// Placeholder landing page per role; real dashboards arrive in later milestones.
export async function RoleHome({ role, title }: { role: Role; title: string }) {
  const user = await requireRole(role);
  return (
    <main className="page max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <div className="card flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Icon name="user" size={24} />
          </span>
          <div>
            <p className="font-bold">{user.nama}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <span className="badge badge-soft ml-auto">{user.role}</span>
        </div>
        <p className="text-sm text-muted">Dashboard lengkap untuk peran ini akan hadir di milestone berikutnya.</p>
        <form action={logout}>
          <button type="submit" className="btn btn-outline">
            <Icon name="logout" size={18} />
            Keluar
          </button>
        </form>
      </div>
    </main>
  );
}
