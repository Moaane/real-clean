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
      <nav className="flex flex-wrap gap-4 border-b border-zinc-300 px-6 py-3 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="font-medium underline-offset-4 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
