import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { formatPreciseTime } from "@/lib/time";

// Minimum gap to keep between the "Move freeze to" tag and either edge of
// its container, so it never touches (let alone crosses) the frame's edge.
const TAG_EDGE_MARGIN_PX = 8;

// Must match .context-scrub-input's thumb width/dot size in globals.css.
const THUMB_WIDTH_PX = 20;
const DOT_SIZE_PX = 10;

// A native range input's thumb doesn't travel the full track width — its
// *center* travels from thumbWidth/2 (at min) to trackWidth - thumbWidth/2
// (at max), so it never hangs off either end. Positioning the frozen dot
// with a naive `frac * trackWidth` (as before) only coincides with the
// thumb at the track's exact midpoint; anywhere else — including right
// after committing a freeze point, where frozenAt and value are the same
// number — the dot would visibly land a few to ~10px off from the thumb
// it's supposed to mark. Mirror the browser's own formula so they always
// coincide exactly.
function thumbCenterPx(frac: number, containerWidth: number): number {
  return frac * (containerWidth - THUMB_WIDTH_PX) + THUMB_WIDTH_PX / 2;
}

interface ContextScrubberProps {
  frozenAt: number;
  duration: number;
  // Current preview/playback position — kept in sync by the parent with
  // actual playback (including play/pause via YouTube's own native
  // controls on the Why screen's card variant, not just drags/nudges here).
  value: number;
  // Re-seeks the actual video so its preview frame reflects wherever the
  // head/nudge lands — committing the new freeze point is separate (see
  // onRepositionFreeze) so neither a drag-in-progress nor a burst of nudge
  // taps repeatedly moves the saved freeze point.
  onSeek: (seconds: number) => void;
  playing: boolean;
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

// How long to wait after the last nudge-button tap before offering to
// commit — long enough that tapping +0.1s/-0.1s repeatedly in quick
// succession doesn't flash the "Move freeze to" tag after every tap. A
// drag release or a native pause doesn't need this: those already have a
// clear "I've stopped" moment (pointerup / playing turning false).
const NUDGE_SETTLE_DELAY_MS = 700;

// Timeline showing the frozen moment (fixed, pulsating red dot) under the
// video, plus: a draggable head (tracks live playback so it stays visible
// even if the video is resumed via its own native controls) and a row of
// +/-1s / +/-0.1s nudge buttons for exact adjustments a drag can't easily
// land. Either input previews a new freeze point without committing it —
// "Move freeze to m:ss" is what actually commits, shown once things settle
// (drag release / pause immediately, nudge taps after a brief pause).
export function ContextScrubber({
  frozenAt,
  duration,
  value,
  onSeek,
  playing,
  onRepositionFreeze,
}: ContextScrubberProps) {
  const max = duration || Math.max(frozenAt, 1);
  const dotFrac = Math.min(1, frozenAt / max);
  const valueFrac = Math.min(1, value / max);

  const [dragging, setDragging] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    };
  }, []);

  // The tag's width varies with its text ("Move freeze to 0:04.5" vs
  // "...to 12:34.5"), so centering it on the target point with a fixed
  // pixel margin (the old approach) let it run off the container's edge
  // whenever the target sat near either end of a longer video. Measure the
  // tag's actual rendered width and clamp its *left edge* to stay fully
  // inside the container instead of clamping its center.
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const [tagLeft, setTagLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = trackWrapRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nudge = (delta: number) => {
    const next = Math.min(max, Math.max(0, value + delta));
    onSeek(next);
    setNudgeCooldown(true);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudgeCooldown(false), NUDGE_SETTLE_DELAY_MS);
  };

  // Only once things have settled — not mid-drag, not mid-playback, not
  // mid-nudge-burst — offer to move the freeze there instead.
  const showReposition =
    !dragging && !playing && !nudgeCooldown && Math.abs(value - frozenAt) > 0.4;
  const atMin = value <= 0;
  const atMax = value >= max;

  // Runs synchronously before paint, so the tag never visibly flashes at
  // an unclamped position first.
  useLayoutEffect(() => {
    if (!showReposition) return;
    const tag = tagRef.current;
    if (!tag || !containerWidth) return;
    const tagWidth = tag.offsetWidth;
    const center = thumbCenterPx(valueFrac, containerWidth);
    const maxLeft = Math.max(TAG_EDGE_MARGIN_PX, containerWidth - tagWidth - TAG_EDGE_MARGIN_PX);
    const left = Math.min(Math.max(center - tagWidth / 2, TAG_EDGE_MARGIN_PX), maxLeft);
    setTagLeft(left);
  }, [showReposition, valueFrac, value, containerWidth]);

  const dotLeft = containerWidth
    ? thumbCenterPx(dotFrac, containerWidth) - DOT_SIZE_PX / 2
    : 0;

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
      {/* Own wrapper (no padding) so its height is exactly the input's —
          the dot's `top: 50%` needs to center on the track alone, not on
          the track plus the nudge-button row below it. */}
      <div ref={trackWrapRef} style={{ position: "relative" }}>
        <input
          type="range"
          className={dragging ? "context-scrub-input is-dragging" : "context-scrub-input"}
          min={0}
          max={max}
          step={0.1}
          value={value}
          onChange={(e) => onSeek(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          style={{ display: "block" }}
          aria-label="Scrub surrounding context"
        />
        {showReposition && (
          <button
            ref={tagRef}
            className="reposition-tag"
            onClick={() => onRepositionFreeze(value)}
            style={{
              position: "absolute",
              top: "-38px",
              left: `${tagLeft}px`,
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
            Move freeze to {formatPreciseTime(value)}
          </button>
        )}
        {/* pointerEvents: none so this (and the reposition tag above it,
            when overlapping) never block dragging the input beneath. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: `${dotLeft}px`,
            transform: "translateY(-50%)",
            width: `${DOT_SIZE_PX}px`,
            height: `${DOT_SIZE_PX}px`,
            borderRadius: "50%",
            backgroundColor: "#e2483d",
            boxShadow: "0 0 0 2px rgba(252, 251, 249, 0.92), 0 1px 4px rgba(0, 0, 0, 0.4)",
            pointerEvents: "none",
            zIndex: 1,
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
          marginTop: "6px",
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
