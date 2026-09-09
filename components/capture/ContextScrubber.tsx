import { useState } from "react";

interface ContextScrubberProps {
  frozenAt: number;
  duration: number;
  value: number;
  onScrub: (seconds: number) => void;
  // Actual YouTube play state (native controls included). When provided
  // together with `onRepositionFreeze`, enables the "Move to m:ss" tag —
  // omit both to keep this a plain preview scrubber (e.g. on Tags).
  playing?: boolean;
  onRepositionFreeze?: (seconds: number) => void;
}

function mmss(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Lets the annotator preview surrounding footage without losing the
// captured frozen timestamp — a fixed, pulsating red dot marks that
// moment. The draggable head is controlled by `value`, which the parent
// keeps in sync with actual playback position (including playback resumed
// via YouTube's own native controls, not just manual drags here).
export function ContextScrubber({
  frozenAt,
  duration,
  value,
  onScrub,
  playing,
  onRepositionFreeze,
}: ContextScrubberProps) {
  const [dragging, setDragging] = useState(false);
  const max = duration || Math.max(frozenAt, 1);
  // The dot is positioned against the input's own track (inset by the
  // 12px side padding below), not the full-bleed outer box.
  const dotFrac = Math.min(1, frozenAt / max);
  const valueFrac = Math.min(1, value / max);

  // Only once the head has settled somewhere other than the frozen moment —
  // not mid-drag, not mid-playback — offer to move the freeze there instead.
  const showReposition =
    Boolean(onRepositionFreeze) && !dragging && !playing && Math.abs(value - frozenAt) > 0.4;

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
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onScrub(Number(e.target.value))}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        style={{
          width: "100%",
          display: "block",
          accentColor: "var(--soft)",
        }}
        aria-label="Scrub surrounding context"
      />
      {showReposition && (
        <button
          onClick={() => onRepositionFreeze?.(value)}
          style={{
            position: "absolute",
            top: "-38px",
            left: `clamp(52px, calc(12px + (100% - 24px) * ${valueFrac}), calc(100% - 52px))`,
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
          Move freeze to {mmss(value)}
        </button>
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: `calc(12px + (100% - 24px) * ${dotFrac} - 5px)`,
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
  );
}
