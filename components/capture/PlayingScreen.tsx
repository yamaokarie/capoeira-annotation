import { useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

function formatSpeed(rate: number) {
  return `${rate % 1 === 0 ? rate.toFixed(0) : rate}×`;
}

interface PlayingScreenProps {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onSkip: (deltaSeconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  formatTime: (secs: number) => string;
}

export function PlayingScreen({
  playing,
  onPlayingChange,
  currentTime,
  duration,
  onSeek,
  onSkip,
  onSetPlaybackRate,
  formatTime,
}: PlayingScreenProps) {
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const [speedIndex, setSpeedIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const isDesktop = useIsDesktop();

  const speedButton = (
    <button
      onClick={() => {
        const nextIndex = (speedIndex + 1) % SPEEDS.length;
        setSpeedIndex(nextIndex);
        onSetPlaybackRate(SPEEDS[nextIndex]);
      }}
      aria-label="Change playback speed"
      style={{
        height: "30px",
        width: "56px",
        flex: "0 0 auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-pill)",
        backgroundColor: "rgba(0, 0, 0, 0.28)",
        backdropFilter: "blur(8px)",
        color: "var(--on-dark)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.2px",
        fontVariantNumeric: "tabular-nums lining-nums",
      }}
    >
      {formatSpeed(SPEEDS[speedIndex])}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
      <div style={{ position: "relative", width: "100%" }}>
        <div
          style={{
            display: "grid",
            // Mobile: the whole row (speed/−5s/play/+5s) is left-aligned to
            // x:0, flush with the timeline row's own `formatTime(currentTime)`
            // label directly below (both rows are full-width siblings with no
            // side padding of their own, so x:0 is the same point for both) —
            // sizing the columns to their own content (rather than equal 1fr
            // tracks, which previously starved the left column and clipped
            // the speed button) keeps every button visible regardless of
            // viewport width. Desktop: speed moves out to its own
            // absolutely-positioned element (below) so this grid's two side
            // columns hold just −5s/+5s — symmetric, so centering lands the
            // play button truly in the middle of the timeline.
            gridTemplateColumns: "auto auto auto",
            justifyContent: isDesktop ? "center" : "flex-start",
            alignItems: "center",
            // Mobile only: left-aligning (above) means the row's total
            // content width no longer has slack on both sides to absorb
            // into — at a flat 26px gap the four items (316.56px including
            // gaps) overflow past the right edge on anything narrower than
            // ~369px, which includes the very common 360px Android width,
            // not just legacy 320px phones. Shrinks smoothly below that via
            // `calc(100vw ...)` (safe here because this row's width already
            // tracks the viewport 1:1 on mobile — see --side-padding-video)
            // down to a 320px width, past which it settles at a readable
            // ~8px rather than compressing further. Unchanged (still a flat
            // 26px) at >=373px, so nothing shifts for any modern phone at
            // 375px+, and desktop is untouched either way.
            columnGap: isDesktop ? "26px" : "clamp(8px, calc((100vw - 295px) / 3), 26px)",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "26px" }}>
            {!isDesktop && speedButton}

            <button
              onClick={() => onSkip(-5)}
              aria-label="Back 5 seconds"
              style={{
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
              }}
            >
              −5s
            </button>
          </div>

          <button
            onClick={() => onPlayingChange(!playing)}
            aria-label={playing ? "Pause" : "Play"}
            style={{
              width: "62px",
              height: "62px",
              flex: "0 0 auto",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--cream)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: playing ? 0 : "3px",
              boxShadow: "0 10px 30px -6px rgba(0, 0, 0, 0.5)",
            }}
          >
            {playing ? <PauseIcon size={26} color="#0c0a09" /> : <PlayIcon size={26} color="#0c0a09" />}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <button
              onClick={() => onSkip(5)}
              aria-label="Forward 5 seconds"
              style={{
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
              }}
            >
              +5s
            </button>
          </div>
        </div>

        {isDesktop && (
          // Left-aligned to x:0 of this row, which matches the timeline row
          // below (the `formatTime(currentTime)` label starts at the same
          // x:0) — both rows are full-width siblings with no side padding of
          // their own, so this lines the speed tag up with that time marker.
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}>
            {speedButton}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "11px", width: "100%" }}>
        <span
          style={{
            width: "34px",
            flex: "0 0 auto",
            textAlign: "left",
            color: "var(--on-dark)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 500,
          }}
        >
          {formatTime(currentTime)}
        </span>
        <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
          {/* Plain background track + a separately-rounded fill div, both
              sitting behind the (fully transparent) input — rather than
              painting progress via a `background`/`backgroundImage` on the
              input's own box. That old approach relied on `border-radius` +
              `background-clip: content-box` on the input itself, and browsers
              compute a range input's rounded corners off its full padded
              box (28px tall, for the invisible touch target) rather than the
              6px-tall visible band clipped inside it — the corner curve cut
              diagonally into that thin band near each end, mitering it to a
              point instead of a clean rounded cap. Separate divs sized to
              exactly 6px avoid that entirely, matching how
              `.context-scrub-input` (Why screen) gets a true rounded pill. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "rgba(255, 255, 255, 0.32)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              width: `${pct}%`,
              height: "6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fff",
              pointerEvents: "none",
            }}
          />
          <input
            type="range"
            className={dragging ? "scrub-input is-dragging" : "scrub-input"}
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(currentTime, duration || 1)}
            onChange={(e) => onSeek(Number(e.target.value))}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            style={{ width: "100%" }}
          />
        </div>
        <span
          style={{
            width: "34px",
            flex: "0 0 auto",
            textAlign: "right",
            color: "var(--on-dark-soft)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
