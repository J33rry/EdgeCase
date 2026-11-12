import { useId, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

/** EdgeCase mark: a hexagonal "e" in the brand orange. */
export function LogoMark({ size = 32, ...props }: IconProps) {
  const id = `ec-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden {...props}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="36" y2="36">
          <stop offset="0" stopColor="#FFC533" />
          <stop offset="1" stopColor="#FF9500" />
        </linearGradient>
      </defs>
      <path
        d="M20 3.5 34.3 11.75v16.5L20 36.5 5.7 28.25v-16.5L20 3.5Z"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="6"
        strokeLinejoin="round"
        strokeDasharray="78 12"
        strokeDashoffset="-34"
      />
      <path d="M12.5 20h15" stroke={`url(#${id})`} strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <span className="font-bold tracking-[-0.02em] text-white">EdgeCase</span>
    </span>
  );
}

export function PuzzleIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M10 3.5a2 2 0 1 1 4 0V5h3.5A1.5 1.5 0 0 1 19 6.5V10h1.5a2 2 0 1 1 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V19H6.5A1.5 1.5 0 0 1 5 17.5V14h1.5a2 2 0 1 0 0-4H5V6.5A1.5 1.5 0 0 1 6.5 5H10V3.5Z" />
    </svg>
  );
}

export function KebabIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

export function DocIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function SparkleIcon({ size, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...p}>
      <path d="M10 2.5 12 9l6.5 2-6.5 2-2 6.5L8 13l-6.5-2L8 9l2-6.5Z" fill="currentColor" />
      <path d="M19 2l.9 2.6L22.5 5.5l-2.6.9L19 9l-.9-2.6L15.5 5.5l2.6-.9L19 2Z" fill="currentColor" opacity=".85" />
    </svg>
  );
}

export function CloseIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CodeIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
    </svg>
  );
}

export function BugIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ListIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M7.5 9h9M7.5 12h9M7.5 15h9" />
    </svg>
  );
}

export function PlayIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M7 4.5v15l12-7.5-12-7.5Z" />
    </svg>
  );
}

export function CheckIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} strokeWidth={2.2}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function SendIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}

export function GithubIcon({ size, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.8c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
