import { useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "26px",
        }}
      >
        <button
          onClick={() => {
            const nextIndex = (speedIndex + 1) % SPEEDS.length;
            setSpeedIndex(nextIndex);
            onSetPlaybackRate(SPEEDS[nextIndex]);
          }}
          aria-label="Change playback speed"
          style={{
            height: "30px",
            minWidth: "40px",
            padding: "0 11px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "rgba(0, 0, 0, 0.28)",
            backdropFilter: "blur(8px)",
            color: "var(--on-dark)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.2px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatSpeed(SPEEDS[speedIndex])}
        </button>

        <button
          onClick={() => onSkip(-5)}
          aria-label="Back 5 seconds"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.3px",
            color: "rgba(255, 255, 255, 0.92)",
            fontVariantNumeric: "tabular-nums",
            padding: "8px 6px",
          }}
        >
          −5s
        </button>

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

        <button
          onClick={() => onSkip(5)}
          aria-label="Forward 5 seconds"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.3px",
            color: "rgba(255, 255, 255, 0.92)",
            fontVariantNumeric: "tabular-nums",
            padding: "8px 6px",
          }}
        >
          +5s
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "11px", width: "100%" }}>
        <span
          style={{
            color: "var(--on-dark)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 500,
          }}
        >
          {formatTime(currentTime)}
        </span>
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
          style={{
            flex: 1,
            backgroundImage: `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.32) ${pct}%)`,
          }}
        />
        <span style={{ color: "var(--on-dark-soft)", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
