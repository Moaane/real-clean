import { Brand } from "./site-header";
import { Icon, type IconName } from "./icons";

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "shield", text: "Petugas terverifikasi dan berpengalaman" },
  { icon: "calendar", text: "Pilih tanggal dan jam sesuai kebutuhan" },
  { icon: "check", text: "Hasil kerja difoto dan diperiksa sebelum selesai" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-12 text-on-primary lg:flex">
        <Brand />
        <div className="flex flex-col gap-6">
          <h2 className="max-w-sm text-3xl font-extrabold leading-tight">
            Rumah dan kos bersih, tanpa repot.
          </h2>
          <ul className="flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-on-primary/15">
                  <Icon name={p.icon} size={18} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-80">Jasa kebersihan panggilan untuk rumah &amp; kos-kosan.</p>
      </aside>
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Brand className="mb-8 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
