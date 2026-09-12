import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatPreciseTime } from "@/lib/time";

interface ContextScrubberProps {
  frozenAt: number;
  duration: number;
  // Re-seeks the actual video so its preview frame reflects the pending
  // nudge — commit is separate (see onRepositionFreeze) so a burst of taps
  // doesn't repeatedly move the saved freeze point.
  onSeek: (seconds: number) => void;
  onRepositionFreeze: (seconds: number) => void;
}

const NUDGE_BUTTON_STYLE: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.2px",
  color: "rgba(255, 255, 255, 0.92)",
  fontVariantNumeric: "tabular-nums",
  padding: "6px 8px",
};

// How long to wait after the last nudge tap before offering to commit —
// long enough that tapping +0.1s/-0.1s repeatedly in quick succession
// doesn't flash the "Move freeze to" tag after every single tap.
const SETTLE_DELAY_MS = 700;

// Timeline showing the frozen moment (fixed, pulsating red dot) plus a row
// of +/-1s / +/-0.1s buttons to nudge it. Nudging re-seeks the video (so its
// preview frame updates live) but only *previews* a new freeze point — nudge
// again and it keeps adjusting from wherever you left off. Only once nudging
// pauses for a beat does the "Move freeze to m:ss" tag appear, which is what
// actually commits the change. Replaces an earlier draggable-scrubber design
// (a native range input dragged across the whole video) that made fine
// adjustments hard to land and was confusing alongside these buttons.
export function ContextScrubber({
  frozenAt,
  duration,
  onSeek,
  onRepositionFreeze,
}: ContextScrubberProps) {
  const max = duration || Math.max(frozenAt, 1);
  const dotFrac = Math.min(1, frozenAt / max);

  const [pending, setPending] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  const previewValue = pending ?? frozenAt;
  const previewFrac = Math.min(1, previewValue / max);

  const nudge = (delta: number) => {
    const next = Math.min(max, Math.max(0, previewValue + delta));
    onSeek(next);
    setPending(next);
    setSettled(false);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettled(true), SETTLE_DELAY_MS);
  };

  const commitReposition = () => {
    if (pending === null) return;
    onRepositionFreeze(pending);
    setPending(null);
    setSettled(false);
    if (settleTimer.current) clearTimeout(settleTimer.current);
  };

  const showReposition = settled && pending !== null && Math.abs(pending - frozenAt) > 0.001;
  const atMin = previewValue <= 0;
  const atMax = previewValue >= max;

  return (
    <div
      style={{
        position: "relative",
        width: "calc(100% + 2 * var(--side-padding-video))",
        marginLeft: "calc(-1 * var(--side-padding-video))",
        padding: "0 12px",
        marginBottom: "16px",
      }}
    >
      <div style={{ position: "relative", height: "24px", display: "flex", alignItems: "center" }}>
        <div
          aria-hidden
          style={{
            width: "100%",
            height: "6px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "rgba(255, 255, 255, 0.32)",
          }}
        />
        {showReposition && (
          <button
            className="reposition-tag"
            onClick={commitReposition}
            style={{
              position: "absolute",
              top: "-38px",
              left: `clamp(52px, calc(100% * ${previewFrac}), calc(100% - 52px))`,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--cream)",
              color: "#0c0a09",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 6px 18px -6px rgba(0, 0, 0, 0.55)",
              zIndex: 2,
              animation: "reposition-tag-in 0.15s ease-out",
            }}
          >
            Move freeze to {formatPreciseTime(pending ?? frozenAt)}
          </button>
        )}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: `calc(100% * ${dotFrac} - 5px)`,
            transform: "translateY(-50%)",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#e2483d",
            boxShadow: "0 0 0 2px rgba(252, 251, 249, 0.92), 0 1px 4px rgba(0, 0, 0, 0.4)",
            pointerEvents: "none",
          }}
        >
          <span
            className="context-dot-pulse"
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              border: "3px solid #e2483d",
              filter: "blur(3px)",
              animation: "dot-pulse-soft 2.4s ease-out infinite",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={() => nudge(-1)}
          disabled={atMin}
          aria-label="Nudge freeze back 1 second"
          style={{ ...NUDGE_BUTTON_STYLE, opacity: atMin ? 0.35 : 1 }}
        >
          −1s
        </button>
        <button
          onClick={() => nudge(-0.1)}
          disabled={atMin}
          aria-label="Nudge freeze back 0.1 seconds"
          style={{ ...NUDGE_BUTTON_STYLE, opacity: atMin ? 0.35 : 1 }}
        >
          −0.1s
        </button>
        <button
          onClick={() => nudge(0.1)}
          disabled={atMax}
          aria-label="Nudge freeze forward 0.1 seconds"
          style={{ ...NUDGE_BUTTON_STYLE, opacity: atMax ? 0.35 : 1 }}
        >
          +0.1s
        </button>
        <button
          onClick={() => nudge(1)}
          disabled={atMax}
          aria-label="Nudge freeze forward 1 second"
          style={{ ...NUDGE_BUTTON_STYLE, opacity: atMax ? 0.35 : 1 }}
        >
          +1s
        </button>
      </div>
    </div>
  );
}
