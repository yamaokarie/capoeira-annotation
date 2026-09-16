import { ArrowIcon, CloseIcon } from "@/components/ui/icons";

interface CaptureTopbarProps {
  frozenAt?: number | null;
  formatTime?: (secs: number) => string;
  onCancel: () => void;
  // Desktop (>=1024px) only — see .capture-topbar-back in globals.css.
  // WhyScreen/SurprisingScreen/TagsScreen/EndingScreen no longer render
  // their own back button at all (removed 2026-09-16, mobile included);
  // this is the only back button left in the capture flow.
  onBack?: () => void;
  // "full" (default): back button + Frozen badge + close button in one
  // row — used as-is on mobile. The other three variants each render one
  // piece of that same row, so app/page.tsx's desktop capture-shell can
  // place them independently: "back" stays pinned at the top of the left
  // (video) column, "frozenBadge" sits just above the video frame itself
  // (wrapped by the caller to match its left edge), and "close" stays in
  // the right-hand panel — see the 2026-09-16 CLAUDE.md entries.
  variant?: "full" | "back" | "frozenBadge" | "close";
}

export function CaptureTopbar({ frozenAt, formatTime, onCancel, onBack, variant = "full" }: CaptureTopbarProps) {
  const backButton = onBack ? (
    <button
      className="icon-btn capture-topbar-back"
      onClick={onBack}
      aria-label="Back to previous step"
      style={{
        width: "var(--height-circular)",
        height: "var(--height-circular)",
        flex: "0 0 auto",
        borderRadius: "var(--radius-pill)",
        backgroundColor: "transparent",
        border: "1px solid var(--hairline-strong)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
        <ArrowIcon size={17} color="var(--on-dark)" />
      </span>
    </button>
  ) : null;

  const frozenBadge =
    frozenAt != null && formatTime ? (
      <div
        style={{
          // inline-flex, not flex: as a standalone block (the "frozenBadge"
          // variant, page.tsx) this sits directly in a flex column, whose
          // default align-items:stretch would otherwise stretch a
          // block-level flex container to the column's full width instead
          // of shrinking to the pill's actual content size.
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "6px 11px",
          borderRadius: "var(--radius-pill)",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          border: "1px solid var(--hairline-light)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.96px",
          color: "var(--on-dark)",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--peach)",
            flex: "0 0 auto",
          }}
        />
        Frozen · {formatTime(frozenAt)}
      </div>
    ) : null;

  // "back"/"close" both get an explicit var(--height-circular) row height
  // (instead of shrink-wrapping their own button, 40px vs the close
  // button's smaller 34px) so their shared 16px marginBottom lands content
  // below them — the video column's Frozen badge, the panel's headline —
  // at the exact same y regardless of which button occupies the row. See
  // the 2026-09-16 CLAUDE.md entry on column alignment.
  if (variant === "back") {
    return (
      <div
        style={{
          height: "var(--height-circular)",
          display: "flex",
          alignItems: "center",
          marginBottom: "16px",
          // Cancels .capture-shell-video's own --side-padding-video (the
          // only place this variant is ever rendered), so the button sits
          // flush with the column's true left edge — the same edge the
          // Frozen badge and video are flush with — instead of indented by
          // that padding.
          marginLeft: "calc(-1 * var(--side-padding-video))",
        }}
      >
        {backButton}
      </div>
    );
  }

  if (variant === "frozenBadge") {
    return frozenBadge;
  }

  const closeButton = (
    <button
      className="icon-btn"
      onClick={onCancel}
      aria-label="Cancel and return to playing"
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        border: "1px solid var(--hairline-light)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <CloseIcon size={16} color="var(--on-dark)" />
    </button>
  );

  if (variant === "close") {
    return (
      <div
        style={{
          height: "var(--height-circular)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        {closeButton}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)" }}>
        {backButton}
        {frozenBadge || <span />}
      </div>
      {closeButton}
    </div>
  );
}
