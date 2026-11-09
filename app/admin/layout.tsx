import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/layanan", label: "Paket" },
  { href: "/admin/jam", label: "Jam Operasional" },
  { href: "/admin/karyawan", label: "Karyawan" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-5 py-2 text-sm sm:px-6">
          <span className="badge badge-soft mr-2">Admin</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-primary-soft hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
