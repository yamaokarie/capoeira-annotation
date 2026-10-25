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
  // Why screen only — everywhere else the video/scrubber stays mounted for
  // continuity, but the frozen moment is already locked in, so dragging,
  // nudging, or resuming/pausing native playback must only preview (via
  // onSeek) and never surface the "Move freeze to" commit affordance.
  canReposition: boolean;
  // Optional out point. null (the default) keeps the moment a single
  // instant and the scrubber looks as it always has; "Add end point"
  // (Why only) sets one, after which the same drag/nudge/commit-tag flow
  // edits whichever of start/end is selected.
  endAt: number | null;
  onSetEnd: (seconds: number | null) => void;
}

const NUDGE_BUTTON_STYLE: CSSProperties = {
  background: "rgba(255, 255, 255, 0.07)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  letterSpacing: "0.2px",
  color: "#b5a898",
  fontVariantNumeric: "tabular-nums",
  padding: "8px 16px",
};

// How long to wait after the last nudge-button tap before offering to
// commit — long enough that tapping +0.1s/-0.1s repeatedly in quick
// succession doesn't flash the "Move freeze to" tag after every tap. A
// drag release or a native pause doesn't need this: those already have a
// clear "I've stopped" moment (pointerup / playing turning false).
const NUDGE_SETTLE_DELAY_MS = 700;

// Where "Add end point" drops the end when the playhead hasn't been moved
// past the freeze point — a plausible length for one exchange.
const DEFAULT_SPAN_SECONDS = 3;

// Start and end must stay at least this far apart.
const MIN_SPAN_SECONDS = 0.1;

const SEGMENT_BUTTON_STYLE: CSSProperties = {
  background: "transparent",
  border: "none",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  padding: "6px 14px",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

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
  canReposition,
  endAt,
  onSetEnd,
}: ContextScrubberProps) {
  const max = duration || Math.max(frozenAt, endAt ?? 0, 1);
  const dotFrac = Math.min(1, frozenAt / max);
  const valueFrac = Math.min(1, value / max);
  const endFrac = endAt === null ? null : Math.min(1, endAt / max);

  const [editing, setEditing] = useState<"start" | "end">("start");
  const editingEnd = editing === "end" && endAt !== null;
  const target = editingEnd ? endAt : frozenAt;
  // A commit that would put start at/after end (or end at/before start) is
  // never offered.
  const validTarget = editingEnd
    ? value >= frozenAt + MIN_SPAN_SECONDS
    : endAt === null || value <= endAt - MIN_SPAN_SECONDS;

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
  // mid-nudge-burst — offer to move the freeze there instead. Never offered
  // at all outside the Why screen (canReposition false): the frozen moment
  // is already locked in there, so scrubbing/nudging is preview-only.
  const showReposition =
    canReposition &&
    !dragging &&
    !playing &&
    !nudgeCooldown &&
    validTarget &&
    Math.abs(value - target) > 0.4;
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

  const dotCenter = containerWidth ? thumbCenterPx(dotFrac, containerWidth) : 0;
  const dotLeft = dotCenter - DOT_SIZE_PX / 2;
  const endCenter =
    containerWidth && endFrac !== null ? thumbCenterPx(endFrac, containerWidth) : null;

  const addEnd = () => {
    const end =
      value - frozenAt > 0.4 ? value : Math.min(max, frozenAt + DEFAULT_SPAN_SECONDS);
    onSetEnd(end);
    onSeek(end);
    setEditing("end");
  };

  const removeEnd = () => {
    onSetEnd(null);
    setEditing("start");
    onSeek(frozenAt);
  };

  const selectSegment = (segment: "start" | "end") => {
    setEditing(segment);
    onSeek(segment === "end" && endAt !== null ? endAt : frozenAt);
  };

  const commit = () => {
    if (editingEnd) onSetEnd(value);
    else onRepositionFreeze(value);
  };

  const pointName = editingEnd ? "end" : "freeze";

  return (
    <div
      style={{
        position: "relative",
        width: "calc(100% + 2 * var(--side-padding-video))",
        marginLeft: "calc(-1 * var(--side-padding-video))",
        padding: "0 12px",
        marginTop: "-8px",
        marginBottom: "16px",
      }}
    >
      {/* Own wrapper (no padding) so its height is exactly the input's —
          the dot's `top: 50%` needs to center on the track alone, not on
          the track plus the nudge-button row below it. */}
      <div ref={trackWrapRef} style={{ position: "relative" }}>
        {/* Shaded span from the freeze point to the out point. Before the
            input in DOM order (and the input positioned) so it paints
            behind the thumb but shows through the translucent track. */}
        {endCenter !== null && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: `${dotCenter}px`,
              width: `${Math.max(0, endCenter - dotCenter)}px`,
              height: "6px",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(226, 72, 61, 0.7)",
              pointerEvents: "none",
            }}
          />
        )}
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
          style={{ display: "block", position: "relative" }}
          aria-label="Scrub surrounding context"
        />
        {showReposition && (
          <button
            ref={tagRef}
            className="reposition-tag"
            onClick={commit}
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
            {editingEnd ? "Set end to" : "Move freeze to"} {formatPreciseTime(value)}
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
        {endCenter !== null && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: `${endCenter - DOT_SIZE_PX / 2}px`,
              transform: "translateY(-50%)",
              width: `${DOT_SIZE_PX}px`,
              height: `${DOT_SIZE_PX}px`,
              borderRadius: "50%",
              backgroundColor: "var(--cream)",
              boxShadow: "0 0 0 2px #e2483d, 0 1px 4px rgba(0, 0, 0, 0.4)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
      </div>
      {/* Nudges sit centered in the middle column; the add-end / Start|End
          row below starts at the nudges' left edge and may run on into the
          right-hand column. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          marginTop: "var(--gap-md)",
        }}
      >
        <div
          style={{
            gridColumn: "2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <button
            onClick={() => nudge(-1)}
            disabled={atMin}
            aria-label={`Nudge ${pointName} back 1 second`}
            style={{ ...NUDGE_BUTTON_STYLE, opacity: atMin ? 0.35 : 1 }}
          >
            −1s
          </button>
          <button
            onClick={() => nudge(-0.1)}
            disabled={atMin}
            aria-label={`Nudge ${pointName} back 0.1 seconds`}
            style={{ ...NUDGE_BUTTON_STYLE, opacity: atMin ? 0.35 : 1 }}
          >
            −0.1s
          </button>
          <button
            onClick={() => nudge(0.1)}
            disabled={atMax}
            aria-label={`Nudge ${pointName} forward 0.1 seconds`}
            style={{ ...NUDGE_BUTTON_STYLE, opacity: atMax ? 0.35 : 1 }}
          >
            +0.1s
          </button>
          <button
            onClick={() => nudge(1)}
            disabled={atMax}
            aria-label={`Nudge ${pointName} forward 1 second`}
            style={{ ...NUDGE_BUTTON_STYLE, opacity: atMax ? 0.35 : 1 }}
          >
            +1s
          </button>
        </div>
        {/* Rows below the nudges each start at the nudges' left edge
            (columns 2–3) and may run on into the right-hand column. The
            add/remove text buttons sit on their own row, 28px down. */}
        {canReposition && endAt === null && (
          <button
            className="scrub-text-btn"
            onClick={addEnd}
            disabled={frozenAt >= max - MIN_SPAN_SECONDS}
            style={{ gridColumn: "2 / 4", justifySelf: "start", marginTop: "28px" }}
          >
            Add end point
          </button>
        )}
        {/* "Remove end" sits right of the chip, wrapping under it only if
            a very narrow phone has no room. */}
        {canReposition && endAt !== null && (
          <div
            style={{
              gridColumn: "2 / 4",
              justifySelf: "start",
              marginTop: "var(--gap-md)",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--gap-sm) var(--gap-md)",
            }}
          >
            <div
              role="group"
              aria-label="Point to adjust"
              style={{
                display: "inline-flex",
                padding: "3px",
                borderRadius: "var(--radius-pill)",
                background: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {(["start", "end"] as const).map((segment) => {
                const selected = (segment === "end") === editingEnd;
                return (
                  <button
                    key={segment}
                    onClick={() => selectSegment(segment)}
                    aria-pressed={selected}
                    style={{
                      ...SEGMENT_BUTTON_STYLE,
                      background: selected ? "var(--cream)" : "transparent",
                      color: selected ? "#0c0a09" : "#b5a898",
                    }}
                  >
                    {segment === "start" ? "Start" : "End"}{" "}
                    {formatPreciseTime(segment === "start" ? frozenAt : endAt)}
                  </button>
                );
              })}
            </div>
            <button className="scrub-text-btn" onClick={removeEnd} aria-label="Remove end point">
              Remove end
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
