import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function make(paths: ReactNode) {
  return function Icon({ size = 20, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const IconArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconCheck = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const IconCheckDouble = make(<path d="M2 12.5L6.5 17 15 7.5M11 15.5l1.5 1.5L22 7.5" />);
export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const IconClockOff = make(
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 3.1A9 9 0 0121 12c0 1.3-.3 2.6-.8 3.7M17.7 17.7A9 9 0 016.3 6.3" />
    <path d="M12 7v2.5M12 12v0l3 2" />
  </>,
);
export const IconUser = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </>,
);
export const IconRoute = make(
  <>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h7a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h7" />
  </>,
);
export const IconSparkle = make(
  <>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16v4M17 18h4" />
  </>,
);
export const IconShield = make(
  <>
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </>,
);
export const IconX = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IconUndo = make(
  <>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 010 12h-3" />
  </>,
);
export const IconChevronDown = make(<path d="M6 9l6 6 6-6" />);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconEye = make(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const IconEyeOff = make(
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.7C3.7 8.5 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </>,
);
export const IconAlert = make(
  <>
    <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);
export const IconInfo = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);
export const IconPhone = make(
  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
);
export const IconMail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </>,
);
export const IconHome = make(
  <>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v10h12V10" />
  </>,
);

export const IconCalendar = make(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </>,
);
export const IconReceipt = make(
  <>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </>,
);
export const IconGrid = make(
  <>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </>,
);
export const IconUsers = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" />
    <path d="M16 4.7a3.5 3.5 0 010 6.6M18 14.8c2 .7 3.5 2.3 3.5 5.2" />
  </>,
);
export const IconTag = make(
  <>
    <path d="M3 12V4h8l10 10-8 8L3 12z" />
    <circle cx="7.5" cy="8.5" r="1" />
  </>,
);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconPencil = make(
  <>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" />
    <path d="M14.5 6.5l3 3" />
  </>,
);
export const IconTrash = make(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </>,
);
export const IconMapPin = make(
  <>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>,
);
export const IconBuilding = make(
  <>
    <path d="M5 21V4h9v17M14 9h5v12M3 21h18" />
    <path d="M8 8h3M8 12h3M8 16h3" />
  </>,
);
export const IconChevronLeft = make(<path d="M15 6l-6 6 6 6" />);
export const IconChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const IconLogout = make(
  <>
    <path d="M10 4H5v16h5" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </>,
);
export const IconDroplet = make(<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />);
export const IconLeaf = make(
  <>
    <path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15" />
    <path d="M5 19c3-5 6-7 10-9" />
  </>,
);
export const IconBroom = make(
  <>
    <path d="M14 3l-4 9" />
    <path d="M7 12h6l3 9H6l1-9z" />
  </>,
);

export function IconSpinner({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
      {...props}
    >
      <path d="M12 3a9 9 0 109 9" />
    </svg>
  );
}

export function LogoMark({ size = 32, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="16" fill="var(--primary)" />
      <path
        d="M16 7l2 5.5L23.5 14.5 18 16.5 16 22l-2-5.5L8.5 14.5 14 12.5 16 7z"
        stroke="var(--on-primary)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export const IconMinus = make(<path d="M5 12h14" />);
