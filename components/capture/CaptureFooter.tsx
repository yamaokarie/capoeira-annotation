import type { ReactNode } from "react";

// Pins the back/primary button row to the bottom of the mobile frame
// (16px from the bottom), independent of how much content sits above it —
// shared by Surprising/Tags/Ending/Done so the row lands in the same place
// regardless of chip-grid height. At desktop widths (see .capture-footer-*
// in globals.css) this instead sits statically at the bottom of the
// capture-shell's right-hand panel column via margin-top:auto, scoped to
// that column's width rather than the full viewport.
export function CaptureFooter({ children }: { children: ReactNode }) {
  return (
    <div className="capture-footer-outer">
      <div className="capture-footer-inner">{children}</div>
    </div>
  );
}
