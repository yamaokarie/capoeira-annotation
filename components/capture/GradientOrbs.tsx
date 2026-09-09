const ORBS = [
  { color: "var(--orb-mint)", top: "-10%", left: "-15%", size: "220px", duration: "13s", delay: "0s" },
  { color: "var(--orb-peach)", top: "10%", right: "-20%", size: "260px", duration: "16s", delay: "-4s" },
  { color: "var(--orb-lavender)", bottom: "5%", left: "-10%", size: "240px", duration: "14s", delay: "-8s" },
  { color: "var(--orb-sky)", bottom: "-15%", right: "-10%", size: "200px", duration: "15s", delay: "-2s" },
] as const;

// Generic atmospheric background for dark capture panels — colors are
// fixed from the palette and don't sample the video frame.
export function GradientOrbs() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "top" in orb ? orb.top : undefined,
            bottom: "bottom" in orb ? orb.bottom : undefined,
            left: "left" in orb ? orb.left : undefined,
            right: "right" in orb ? orb.right : undefined,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            backgroundColor: orb.color,
            filter: "blur(38px)",
            mixBlendMode: "screen",
            opacity: 0.5,
            animation: `orb-drift ${orb.duration} ease-in-out infinite`,
            animationDelay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}
