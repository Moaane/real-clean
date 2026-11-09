import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoClean - Jasa Kebersihan Rumah & Kos Panggilan",
  description:
    "Booking jasa kebersihan panggilan untuk rumah dan kos-kosan. Pilih paket, tanggal, dan jam. Tim kami datang ke lokasi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#konten"
          className="sr-only rounded-pill bg-primary px-5 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
