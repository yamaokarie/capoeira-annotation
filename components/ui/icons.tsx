// Line-glyph icons, ported from design_handoff_capoeira_annotation/cap-ui.jsx
// to keep exact stroke weights/paths — not a general icon library.

interface IconProps {
  size?: number;
  color?: string;
}

export function PlayIcon({ size = 22, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function PauseIcon({ size = 22, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="7" y="5" width="3.4" height="14" rx="1" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="1" />
    </svg>
  );
}

export function MicIcon({ size = 30, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <line x1="12" y1="17.5" x2="12" y2="21" />
    </svg>
  );
}

export function SpeakerIcon({
  size = 20,
  color = "currentColor",
  muted = false,
}: IconProps & { muted?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z" />
      <g className={`speaker-glyph${muted ? " speaker-glyph-hidden" : ""}`}>
        <path d="M16.2 9.3a4 4 0 0 1 0 5.4" />
        <path d="M18.7 6.8a7.5 7.5 0 0 1 0 10.4" />
      </g>
      <g className={`speaker-glyph${muted ? "" : " speaker-glyph-hidden"}`}>
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      </g>
    </svg>
  );
}

export function KbdIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="6.5" width="19" height="11" rx="2.2" />
      <path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M8 13.5h8" />
    </svg>
  );
}

export function RedoIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 9a7 7 0 1 0 1.5 5" />
      <path d="M19 4.5V9h-4.5" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}
