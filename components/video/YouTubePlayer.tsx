"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { SpeakerIcon } from "@/components/ui/icons";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

export interface YouTubePlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
}

interface YouTubePlayerProps {
  youtubeId: string;
  playing: boolean;
  frozenAt?: number | null;
  onFreeze?: () => void;
  // Fires on YouTube's own play/pause state, including plays started via
  // the iframe's native (cross-origin, otherwise invisible-to-us) center
  // button — e.g. resuming playback from a frozen frame on the Why screen.
  onPlayStateChange?: (playing: boolean) => void;
  // "card": floating inset 16:9 card, cropped iframe (no chrome-hiding
  // bands, no corner brackets). Used on every capture phase except
  // Playing (Why/Surprising/Tags/Ending) — the "default" variant's opaque
  // bands + corner-bracket frozen-state marks were reported as an unwanted
  // old-looking UI and are now scoped to Playing only, which never renders
  // them anyway (frozenAt is always null there — freezing jumps straight to
  // the Why phase). See design.md's Video Frame Treatment section — the
  // "card" crop was originally a Why-only reprise of the scale-crop
  // approach that was tried and reverted there; it doesn't address
  // YouTube's center resume button (no chrome-hiding patch over it in this
  // variant — accepted trade-off, revisit if the native button reads as
  // visible chrome in practice).
  variant?: "default" | "card";
  // Why only: false. Muting/unmuting there would be redundant with the
  // speaker button already shown on the preceding Playing ("Tap to
  // freeze") screen — the same player instance persists across that phase
  // change, so whatever mute state was set there just carries over with
  // nothing extra to show. Every other capture phase keeps the button.
  showMuteButton?: boolean;
}

// YT.PlayerState values (the iframe API doesn't expose named constants to
// us until the external script has loaded, so these are hardcoded).
const YT_PLAYING = 1;

// Starts muted so the browser reliably allows the programmatic
// playVideo() autoplay call; the speaker button below lets it unmute.
export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer(
    {
      youtubeId,
      playing,
      frozenAt,
      onFreeze,
      onPlayStateChange,
      variant = "default",
      showMuteButton = true,
    },
    ref
  ) {
    const isCard = variant === "card";
    const outerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const readyRef = useRef(false);
    const playingRef = useRef(playing);
    const frozenAtRef = useRef(frozenAt);
    const onPlayStateChangeRef = useRef(onPlayStateChange);
    const [muted, setMuted] = useState(true);
    const mutedRef = useRef(muted);
    const [freezeHintVisible, setFreezeHintVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () =>
        readyRef.current ? (playerRef.current?.getCurrentTime() ?? 0) : 0,
      getDuration: () =>
        readyRef.current ? (playerRef.current?.getDuration() ?? 0) : 0,
      seekTo: (seconds: number) => {
        if (readyRef.current) playerRef.current?.seekTo(seconds, true);
      },
      setPlaybackRate: (rate: number) => {
        if (readyRef.current) playerRef.current?.setPlaybackRate(rate);
      },
    }));

    const applyState = () => {
      const player = playerRef.current;
      if (!readyRef.current || !player) return;
      if (frozenAtRef.current != null) {
        player.pauseVideo();
      } else if (playingRef.current) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    };

    const applyMute = () => {
      const player = playerRef.current;
      if (!readyRef.current || !player) return;
      if (mutedRef.current) {
        player.mute();
      } else {
        player.unMute();
      }
    };

    // One player instance per video — persists across phase changes so a
    // freeze isn't lost when the surrounding screen changes.
    useEffect(() => {
      let cancelled = false;
      readyRef.current = false;
      setFreezeHintVisible(false);
      let hintTimer: ReturnType<typeof setTimeout> | undefined;

      loadYouTubeApi().then(() => {
        if (cancelled || !containerRef.current) return;
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: youtubeId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            mute: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: { target: YTPlayerInstance }) => {
              readyRef.current = true;
              applyMute();
              applyState();

              // Must happen here (not right after `new YT.Player(...)`) — the
              // iframe isn't in the DOM yet at that point, so styling it
              // immediately was a race that silently no-op'd more often than
              // not.
              const iframe = event.target.getIframe();
              if (iframe) {
                Object.assign(iframe.style, {
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  backgroundColor: "transparent",
                });
              }

              // YouTube can still flash its own title/branding chrome for a
              // moment right after load even with controls:0. Delay our
              // "tap to freeze" hint so it doesn't appear layered under/over
              // that chrome — by the time it fades in, YouTube's has faded out.
              hintTimer = setTimeout(() => {
                if (!cancelled) setFreezeHintVisible(true);
              }, 4000);
            },
            onStateChange: (event: { data: number }) => {
              onPlayStateChangeRef.current?.(event.data === YT_PLAYING);
            },
          },
        });
      });

      return () => {
        cancelled = true;
        readyRef.current = false;
        clearTimeout(hintTimer);
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [youtubeId]);

    useEffect(() => {
      playingRef.current = playing;
      applyState();
    }, [playing]);

    useEffect(() => {
      frozenAtRef.current = frozenAt;
      applyState();
    }, [frozenAt]);

    useEffect(() => {
      onPlayStateChangeRef.current = onPlayStateChange;
    }, [onPlayStateChange]);

    useEffect(() => {
      mutedRef.current = muted;
      applyMute();
    }, [muted]);

    const showFreezePrompt = frozenAt == null;

    return (
      // Full-bleed: cancels the page's side padding so the video runs
      // edge-to-edge. "default" (Playing/Freeze/Tags) is flush 16:9 — no
      // reserved margin, no thumbnail shimmer. Those 18px bands were the
      // colored strips around the picture. "card" (Why only) is untouched:
      // inset rounded frame, 34px breathing room, page GradientOrbs.
      <div
        style={{
          position: "relative",
          width: "calc(100% + 2 * var(--side-padding-video))",
          marginLeft: "calc(-1 * var(--side-padding-video))",
          marginTop: isCard ? "-16px" : undefined,
          paddingTop: isCard ? "34px" : 0,
          paddingBottom: isCard ? "34px" : 0,
          marginBottom: isCard ? 0 : "16px",
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      >
        {/* "card" (Why only): a floating inset 16:9 card — border + shadow
            against the continuous blurred backdrop, no opaque bands. Chrome
            is cropped out of the iframe instead of covered (see the `variant`
            prop doc above for the trade-off). "default": flush full-width
            16:9, no backdrop. */}
        <div
          style={
            isCard
              ? {
                  position: "relative",
                  margin: "0 14px",
                  aspectRatio: "16 / 9",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  boxShadow:
                    "0 18px 50px -12px rgba(0, 0, 0, 0.72), 0 0 0 6px rgba(0, 0, 0, 0.18)",
                }
              : { position: "relative", width: "100%", aspectRatio: "16 / 9" }
          }
        >
          <div
            ref={outerRef}
            style={
              isCard
                ? {
                    position: "absolute",
                    inset: 0,
                    borderRadius: "16px",
                    overflow: "hidden",
                    backgroundColor: "transparent",
                  }
                : {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    overflow: "hidden",
                  }
            }
          >
            {/* Oversized on "card" so YouTube's title/control-strip chrome
                falls outside the visible box — the crop layer, not the
                iframe itself, carries the offset. */}
            <div
              style={
                isCard
                  ? { position: "absolute", left: 0, right: 0, top: "-32%", height: "162%" }
                  : { position: "absolute", inset: 0 }
              }
            >
              <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            </div>

            {/* Cross-origin YouTube embeds always show their own chrome
                (title/channel row, share, watch-later, related-video card)
                while paused — it can't be disabled via the IFrame API and
                reappears on hover even after it first fades. On "default",
                cover the two bands it occupies while frozen — full video is
                visible, uncropped, during normal playback. "card" crops the
                chrome out via the oversized layer above instead, so no bands
                are needed there.
                Note: this no longer covers YouTube's big center "resume"
                button (removed along with the center patch + "frozen at"
                timestamp per request) — that button is visible again while
                frozen, dimmed only by the scrim below, including while the
                context scrubber is being dragged (a covering patch there was
                tried and reverted — it read as obstructive). */}
            {!isCard && frozenAt != null && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "32%",
                    backgroundColor: "#000",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "20%",
                    backgroundColor: "#000",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(12, 10, 9, 0.4)",
                    pointerEvents: "none",
                  }}
                />
              </>
            )}

            {/* Tap-anywhere-on-frame target. Only relevant pre-freeze
                (Playing), which never uses "card". */}
            {!isCard && showFreezePrompt && onFreeze && (
              <button
                onClick={onFreeze}
                aria-label="Tap to freeze a moment"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            )}

            {/* Visible "tap to freeze" hint, on the frame itself. Delayed via
                freezeHintVisible (set ~2s after onReady) so it doesn't appear
                while YouTube's own first-load chrome is still fading out.
                pointer-events:none so it's purely a label — the button above
                still owns every tap in this region. */}
            {!isCard && showFreezePrompt && (
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "rgba(0, 0, 0, 0.28)",
                  backdropFilter: "blur(8px)",
                  color: "var(--on-dark)",
                  fontSize: "14px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  opacity: freezeHintVisible ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              >
                <span
                  className="ping-ring"
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    border: "2px solid var(--on-dark)",
                    position: "relative",
                    flex: "0 0 auto",
                  }}
                >
                  <span
                    className="ping-ring-pulse"
                    style={{
                      position: "absolute",
                      inset: "-6px",
                      borderRadius: "50%",
                      border: "2px solid var(--on-dark)",
                      opacity: 0,
                      animation: "ping-ring 2.2s ease-out infinite",
                    }}
                  />
                </span>
                Tap to freeze a moment
              </div>
            )}

            {/* Frozen-state marks: "default" only — hard square brackets
                inset to hug the visible video below the opaque bands.
                "card" has no bands to hug and, per request, no corner
                marks at all — the card's own border reads as the frame. */}
            {!isCard &&
              frozenAt != null &&
              (["tl", "tr", "bl", "br"] as const).map((corner) => (
                <div
                  key={corner}
                  style={{
                    position: "absolute",
                    width: "34px",
                    height: "34px",
                    borderColor: "var(--on-dark)",
                    borderStyle: "solid",
                    opacity: 0.9,
                    // Insets account for the opaque top/bottom bars above —
                    // brackets hug the edge of the actually-visible video,
                    // not the true (partly covered) frame edge.
                    ...(corner === "tl" && {
                      top: "calc(32% + 12px)",
                      left: "24px",
                      borderWidth: "2px 0 0 2px",
                    }),
                    ...(corner === "tr" && {
                      top: "calc(32% + 12px)",
                      right: "24px",
                      borderWidth: "2px 2px 0 0",
                    }),
                    ...(corner === "bl" && {
                      bottom: "calc(20% + 12px)",
                      left: "24px",
                      borderWidth: "0 0 2px 2px",
                    }),
                    ...(corner === "br" && {
                      bottom: "calc(20% + 12px)",
                      right: "24px",
                      borderWidth: "0 2px 2px 0",
                    }),
                  }}
                />
              ))}

            {!isCard && showMuteButton && (
              // Larger invisible hit area (44x44, square) around the
              // visible 32px circle, centered inside via flex so it lands
              // at the same on-screen spot as before. Tried padding +
              // content-box + background-clip (the .scrub-input technique)
              // first, but that keeps the button's own border-radius, and
              // this browser clips hit-testing to the rounded shape too —
              // corner taps on the padding still fell through to the
              // full-frame freeze button underneath. A square (no
              // border-radius) outer button with a round inner span avoids
              // that: the full 44x44 box is clickable.
              <button
                className="icon-btn"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute video" : "Mute video"}
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  width: "44px",
                  height: "44px",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "var(--on-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SpeakerIcon size={16} muted={muted} />
                </span>
              </button>
            )}
          </div>

          {/* "card" only: housed in the same glass-pill language as the
              FROZEN badge (not the opaque circle above), overlapping the
              card's edge instead of sitting inset from it. Lives outside the
              clip layer above so the overlap isn't clipped. */}
          {isCard && showMuteButton && (
            // Same square-outer/round-inner touch-target technique as the
            // non-card button above: larger invisible hit area (50x50)
            // around the visible 38px pill, centered inside via flex.
            <button
              className="icon-btn"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute video" : "Mute video"}
              style={{
                position: "absolute",
                bottom: "-20px",
                right: "-20px",
                width: "50px",
                height: "50px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(12, 10, 9, 0.55)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  backdropFilter: "blur(10px)",
                  color: "var(--on-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SpeakerIcon size={17} muted={muted} />
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }
);
