"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";

interface SelectVideoScreenProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  annotatorName: string;
  onAnnotatorNameChange: (name: string) => void;
  onVideoAdded: (video: Video) => void;
  onStartAnnotating: (videoId: string) => void;
}

// Slower, subtler than the shared GradientOrbs used on capture screens —
// this entry screen's spec calls for 44-60s drift and .20-.30 opacity.
const ENTRY_ORBS = [
  { color: "var(--orb-mint)", top: "-8%", left: "-18%", size: "240px", duration: "52s", delay: "0s", opacity: 0.28 },
  { color: "var(--orb-lavender)", top: "6%", right: "-22%", size: "260px", duration: "58s", delay: "-16s", opacity: 0.22 },
  { color: "var(--orb-peach)", bottom: "20%", left: "-16%", size: "220px", duration: "48s", delay: "-30s", opacity: 0.3 },
  { color: "var(--orb-sky)", bottom: "-12%", right: "-14%", size: "230px", duration: "60s", delay: "-42s", opacity: 0.24 },
] as const;

function formatMeta(video: Video): string {
  return [video.style, video.context, video.aspect].filter(Boolean).join(" · ");
}

export function SelectVideoScreen({
  videos,
  loading,
  error,
  annotatorName,
  onAnnotatorNameChange,
  onVideoAdded,
  onStartAnnotating,
}: SelectVideoScreenProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) return;

    setAdding(true);
    setAddError(null);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAddError(data.error || "Failed to add video");
        setAdding(false);
        return;
      }

      onVideoAdded(data.video);
      onStartAnnotating(data.video.videoId);
    } catch {
      setAddError("Failed to reach the server");
      setAdding(false);
    }
  };

  return (
    <div className="svs-page">
      <div className="svs-card">
        <div aria-hidden className="svs-orbs">
          {ENTRY_ORBS.map((orb, i) => (
            <div
              key={i}
              className="svs-orb"
              style={{
                top: "top" in orb ? orb.top : undefined,
                bottom: "bottom" in orb ? orb.bottom : undefined,
                left: "left" in orb ? orb.left : undefined,
                right: "right" in orb ? orb.right : undefined,
                width: orb.size,
                height: orb.size,
                background: orb.color,
                opacity: orb.opacity,
                animationDuration: orb.duration,
                animationDelay: orb.delay,
              }}
            />
          ))}
        </div>

        <div className="svs-content">
          <div className="svs-statusbar">
            <span>9:41</span>
            <div className="svs-dots">
              <span className="svs-dot" />
              <span className="svs-dot" />
              <span className="svs-dot" />
            </div>
          </div>

          <div className="svs-header">
            <div className="svs-kicker">Capoeira &middot; Moment Capture</div>
            <h1 className="svs-headline">
              Annotate
              <br />a jogo
            </h1>
            <p className="svs-subhead">
              Watch a game, freeze the moments that matter, and say why in your own words.
            </p>
          </div>

          <div className="svs-scroll">
            <section className="svs-section">
              <div className="svs-section-label">Who&rsquo;s annotating</div>
              <input
                className="svs-name-input"
                type="text"
                placeholder="Your name"
                value={annotatorName}
                onChange={(e) => onAnnotatorNameChange(e.target.value)}
              />
            </section>

            <section className="svs-section">
              <div className="svs-section-label">Pick a jogo</div>
              {loading ? (
                <p className="svs-status-message">Loading videos&hellip;</p>
              ) : error ? (
                <p className="svs-status-message svs-status-error">{error}</p>
              ) : videos.length === 0 ? (
                <p className="svs-status-message">No videos yet &mdash; bring your own below.</p>
              ) : (
                <div className="svs-jogo-list">
                  {videos.map((video) => (
                    <button
                      key={video.videoId}
                      type="button"
                      className="svs-jogo-card"
                      onClick={() => onStartAnnotating(video.videoId)}
                    >
                      <span className="svs-thumb">
                        {video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnailUrl} alt="" />
                        ) : (
                          <span className="svs-thumb-placeholder" />
                        )}
                        {video.durationLabel && (
                          <span className="svs-duration-chip">{video.durationLabel}</span>
                        )}
                      </span>
                      <span className="svs-jogo-info">
                        <span className="svs-jogo-title">{video.videoTitle}</span>
                        {formatMeta(video) && (
                          <span className="svs-jogo-meta">{formatMeta(video)}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="svs-section svs-section-last">
              <div className="svs-section-label">Or bring your own</div>
              <div className="svs-own-row">
                <input
                  className="svs-url-input"
                  type="text"
                  placeholder="Paste a YouTube link"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="svs-add-pill"
                  disabled={adding || !youtubeUrl.trim()}
                  onClick={handleAddVideo}
                >
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
              {addError && <p className="svs-status-message svs-status-error">{addError}</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
