import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type PhotoProps = {
  /** Path under /public, e.g. "/images/landing/hero.webp". */
  src: string;
  /** Meaningful alt text. Use "" only for purely decorative photos. */
  alt: string;
  /** Reserved aspect ratio, e.g. "4 / 3". Prevents layout shift in both photo and fallback states. */
  ratio: string;
  sizes: string;
  icon?: IconName;
  priority?: boolean;
  className?: string;
};

/**
 * Photo slot. Renders the file from /public when it exists; otherwise a token-colored
 * illustration panel with the same ratio, so the page looks finished before photos are added.
 */
export function Photo({ src, alt, ratio, sizes, icon = "sparkle", priority, className }: PhotoProps) {
  const exists = existsSync(path.join(process.cwd(), "public", src));
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg bg-surface-2", className)}
      style={{ aspectRatio: ratio }}
    >
      {exists ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary-soft to-surface-2 text-primary-bright"
        >
          <Icon name={icon} size={64} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
