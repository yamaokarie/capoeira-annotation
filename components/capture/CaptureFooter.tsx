import type { ReactNode } from "react";

// Pins the back/primary button row to the bottom of the mobile frame
// (16px from the bottom), independent of how much content sits above it —
// shared by Surprising/Tags/Ending so the row lands in the same place on
// all three regardless of chip-grid height.
export function CaptureFooter({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "16px",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "412px",
          boxSizing: "border-box",
          padding: `0 var(--side-padding)`,
          display: "flex",
          gap: "var(--gap-sm)",
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
