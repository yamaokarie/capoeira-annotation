// Shared with CaptureTopbar's frozen badge so a nudge on ContextScrubber
// (which can move the freeze point by as little as 0.1s) and the badge
// showing where it landed always agree on the same rounding — and so
// sub-second nudges are visible at all, not swallowed by whole-second
// formatting.
export function formatPreciseTime(secs: number): string {
  const clamped = Math.max(0, secs);
  let mins = Math.floor(clamped / 60);
  let sec = Math.round((clamped - mins * 60) * 10) / 10;
  if (sec >= 60) {
    sec -= 60;
    mins += 1;
  }
  return `${mins}:${sec.toFixed(1).padStart(4, "0")}`;
}
