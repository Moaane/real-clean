import { RoleGuard } from "@/components/akun/guard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="customer">{children}</RoleGuard>;
}
