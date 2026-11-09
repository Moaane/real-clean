import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Brand } from "@/components/site-header";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/layanan", label: "Paket", icon: "layers" },
  { href: "/admin/jam", label: "Jam Operasional", icon: "clock" },
  { href: "/admin/karyawan", label: "Karyawan", icon: "users" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-6">
          <Brand />
          <span className="badge badge-soft">Admin</span>
          <nav aria-label="Menu admin" className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-foreground"
              >
                <Icon name={l.icon} size={18} />
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
