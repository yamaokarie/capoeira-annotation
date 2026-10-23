"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";
import type { Audience } from "@/lib/audience";
import { ENTRY_ORBS } from "@/components/capture/entryOrbs";

interface SelectVideoScreenProps {
  audience: Audience;
  videos: Video[];
  loading: boolean;
  error: string | null;
  annotatorName: string;
  onAnnotatorNameChange: (name: string) => void;
  onVideoAdded: (video: Video) => void;
  onStartAnnotating: (videoId: string) => void;
}

function formatMeta(video: Video): string {
  return [video.style, video.context, video.aspect].filter(Boolean).join(" · ");
}

export function SelectVideoScreen({
  audience,
  videos,
  loading,
  error,
  annotatorName,
  onAnnotatorNameChange,
  onVideoAdded,
  onStartAnnotating,
}: SelectVideoScreenProps) {
  const isStudent = audience === "student";
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) return;

    setAdding(true);
    setAddError(null);

    try {
      const response = await fetch(`/api/videos?audience=${audience}`, {
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
          <div className="svs-header">
            <div className="svs-kicker">
              Capoeira &middot; {isStudent ? "Student Rodas" : "Moment Capture"}
            </div>
            <h1 className="svs-headline">
              Annotate
              <br />
              {isStudent ? "a roda" : "a jogo"}
            </h1>
            <p className="svs-subhead">
              Watch a game, freeze the moments that matter, and say why in your own words.
            </p>
          </div>

          {/* A direct sibling of .svs-header/.svs-scroll (not nested inside
              .svs-scroll like the other two sections below) so the desktop
              (>=1024px) layout can grid-place it into its own left-column
              area independently of the jogo list — see .svs-content's
              grid-template-areas in globals.css. */}
          <section className="svs-section svs-name-section">
            <div className="svs-section-label">Who&rsquo;s annotating</div>
            <div className="svs-name-field">
              <input
                className="svs-name-input"
                type="text"
                placeholder="Your name"
                value={annotatorName}
                onChange={(e) => onAnnotatorNameChange(e.target.value)}
              />
              <span aria-hidden className="svs-name-caret" />
            </div>
          </section>

          <div className="svs-scroll">
            <section className="svs-section">
              <div className="svs-section-label">{isStudent ? "Pick a roda" : "Pick a jogo"}</div>
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
