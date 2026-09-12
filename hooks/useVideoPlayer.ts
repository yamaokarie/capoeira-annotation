import { useState } from "react";
import { formatPreciseTime } from "@/lib/time";

export function useVideoPlayer() {
  const [playing, setPlaying] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${mins}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    playing,
    setPlaying,
    formatTime,
    formatPreciseTime,
  };
}
