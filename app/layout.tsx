import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Real Clean", template: "%s | Real Clean" },
  description: "Jasa kebersihan rumah dan kos. Pilih paket, jadwal, lalu bayar secara online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable} data-scroll-behavior="smooth">
      <body className="min-h-dvh">
        <a href="#konten" className="skip-link">
          Lewati ke konten
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
