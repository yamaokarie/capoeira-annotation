"use client";

import { useEffect, useState } from "react";
import { isVerticalVideo } from "@/lib/videoOrientation";

export type VideoOrientation = "portrait" | "landscape";

// `aspect` is an optional free-text field on the Videos table — trust it
// when it clearly says which way the video goes, otherwise measure.
function orientationFromAspect(aspect: string | undefined): VideoOrientation | null {
  if (!aspect) return null;
  if (/vertical|portrait|9\s*[:x/]\s*16/i.test(aspect)) return "portrait";
  if (/horizontal|landscape|widescreen|16\s*[:x/]\s*9/i.test(aspect)) return "landscape";
  return null;
}

// Returns null while the thumbnail is still being measured (see
// lib/videoOrientation.ts), so callers can hold off on committing to a
// layout instead of flashing the wrong one.
export function useVideoOrientation(
  youtubeId: string | undefined,
  aspect?: string
): VideoOrientation | null {
  const hinted = orientationFromAspect(aspect);
  const [measured, setMeasured] = useState<{ id: string; value: VideoOrientation } | null>(null);

  useEffect(() => {
    if (hinted || !youtubeId) return;
    let cancelled = false;
    isVerticalVideo(youtubeId).then((vertical) => {
      if (!cancelled) setMeasured({ id: youtubeId, value: vertical ? "portrait" : "landscape" });
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId, hinted]);

  if (hinted) return hinted;
  if (!youtubeId) return "landscape";
  return measured?.id === youtubeId ? measured.value : null;
}
