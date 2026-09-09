"use client";

import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  active?: boolean;
  bars?: number;
  color?: string;
  height?: number;
  width?: number | string;
  seedHeights?: number[] | null;
}

// Simulated live waveform — sine + random jitter via requestAnimationFrame.
// Placeholder only, per design.md: no real audio capture in this build.
export function Waveform({
  active = false,
  bars = 44,
  color = "var(--on-dark)",
  height = 46,
  width = 210,
  seedHeights = null,
}: WaveformProps) {
  const [levels, setLevels] = useState<number[]>(
    () => seedHeights || Array.from({ length: bars }, () => 0.12)
  );
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let t = 0;
    const tick = () => {
      t += 0.18;
      setLevels((prev) =>
        prev.map((_, i) => {
          const wobble = 0.5 + 0.5 * Math.sin(t + i * 0.55) * Math.sin(t * 0.4 + i);
          const spike = Math.random() * 0.5;
          return Math.max(0.1, Math.min(1, 0.28 + wobble * 0.45 + spike * 0.4));
        })
      );
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [active]);

  const shown = seedHeights && !active ? seedHeights : levels;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height, width }}>
      {shown.map((l, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            maxWidth: "5px",
            borderRadius: "var(--radius-pill)",
            background: color,
            opacity: active ? 1 : 0.55,
            height: `${Math.round(l * 100)}%`,
            transition: "height .12s ease",
          }}
        />
      ))}
    </div>
  );
}
