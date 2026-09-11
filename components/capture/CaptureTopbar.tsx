import { CloseIcon } from "@/components/ui/icons";

interface CaptureTopbarProps {
  frozenAt?: number | null;
  formatTime?: (secs: number) => string;
  onCancel: () => void;
}

export function CaptureTopbar({ frozenAt, formatTime, onCancel }: CaptureTopbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}
    >
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
