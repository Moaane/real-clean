import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function AkunLayout({ children }: LayoutProps<"/akun">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
