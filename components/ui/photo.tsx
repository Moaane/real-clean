import Image from "next/image";
import { existsSync } from "node:fs";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import { IconSparkle, type IconProps } from "@/components/icons";

/** Cek berkas di public/images (path relatif terhadap root proyek, tempat server dijalankan). */
export const fotoAda = (name: string) => existsSync(`public/images/${name}.webp`);

/**
 * Foto dari `public/images/<name>.webp`. Bila berkas belum ada, tampil bingkai
 * placeholder dengan rasio yang sama sehingga layout tidak bergeser.
 */
export function Photo({
  name,
  alt = "",
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  icon: Icon = IconSparkle,
}: {
  name: string;
  alt?: string;
  /** Wajib memuat rasio, mis. `aspect-[4/3]`, dan radius. */
  className?: string;
  sizes?: string;
  priority?: boolean;
  icon?: ComponentType<IconProps>;
}) {
  const exists = fotoAda(name);
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {exists ? (
        <Image src={`/images/${name}.webp`} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="absolute inset-0 flex items-center justify-center text-primary-bright/60"
        >
          <Icon size={56} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
