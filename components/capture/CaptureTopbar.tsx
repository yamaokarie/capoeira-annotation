import { ArrowIcon, CloseIcon } from "@/components/ui/icons";

interface CaptureTopbarProps {
  frozenAt?: number | null;
  formatTime?: (secs: number) => string;
  onCancel: () => void;
  // Desktop (>=1024px) only — see .capture-topbar-back in globals.css.
  // Below 1024px each screen (WhyScreen/SurprisingScreen/TagsScreen/
  // EndingScreen) still renders its own back button inline next to its
  // primary action, unchanged; this is a second copy shown only at
  // desktop width, grouped with the Frozen badge at the top instead
  // (that inline one is hidden there via .capture-inline-back).
  onBack?: () => void;
}

export function CaptureTopbar({ frozenAt, formatTime, onCancel, onBack }: CaptureTopbarProps) {
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
        {onBack && (
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
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
              <ArrowIcon size={17} color="var(--on-dark)" />
            </span>
          </button>
        )}
        {frozenAt != null && formatTime ? (
          <div
            style={{
              display: "flex",
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
              }}
            />
            Frozen · {formatTime(frozenAt)}
          </div>
        ) : (
          <span />
        )}
      </div>
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
    </div>
  );
}
