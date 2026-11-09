import { RoleGuard } from "@/components/akun/guard";

export default function AkunLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="pelanggan">{children}</RoleGuard>;
}
