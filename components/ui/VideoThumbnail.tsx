import { PlayIcon } from "@/components/ui/icons";
import type { VideoOrientation } from "@/hooks/useVideoOrientation";

interface VideoThumbnailProps {
  src?: string;
  // null = still being measured: shows the placeholder rather than
  // guessing a layout and swapping it a moment later.
  orientation: VideoOrientation | null;
  durationLabel?: string;
}

// Fixed 16:9 frame for any video. Landscape fills it (cover). Portrait
// sits centered, uncropped, over a blurred and darkened copy of itself.
//
// Portrait note: YouTube's hqdefault.jpg is a 4:3 image with the 9:16
// frame already centered on YouTube's own blurred padding, so the sharp
// layer is a 9:16 box with `object-fit: cover`. That crops exactly
// YouTube's padding and keeps the whole portrait frame, which is what
// `contain` would do if the source were the bare portrait image.
//
// The play indicator shows when any ancestor that directly contains this
// frame is hovered or keyboard-focused (see .vthumb in globals.css).
export function VideoThumbnail({ src, orientation, durationLabel }: VideoThumbnailProps) {
  return (
    <span className="vthumb" data-orientation={orientation ?? "pending"}>
      {!src || !orientation ? (
        <span className="vthumb-placeholder" />
      ) : orientation === "portrait" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="vthumb-backdrop" src={src} alt="" />
          <span className="vthumb-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="vthumb-cover" src={src} alt="" />
      )}
      <span aria-hidden className="vthumb-play">
        <PlayIcon size={14} />
      </span>
      {durationLabel && <span className="vthumb-duration">{durationLabel}</span>}
    </span>
  );
}
