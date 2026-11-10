"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";
import type { Audience } from "@/lib/audience";
import { ENTRY_ORBS } from "@/components/capture/entryOrbs";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";
import { ChevronIcon, PlusIcon } from "@/components/ui/icons";
import { useVideoOrientation } from "@/hooks/useVideoOrientation";

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

function VideoRow({ video, onSelect }: { video: Video; onSelect: () => void }) {
  const orientation = useVideoOrientation(video.youtubeId, video.aspect);
  const meta = [video.channelName, video.durationLabel, video.style, video.context]
    .filter(Boolean)
    .join(" · ");

  return (
    <button type="button" className="svs-jogo-card" onClick={onSelect}>
      <VideoThumbnail
        src={video.thumbnailUrl}
        orientation={orientation}
        durationLabel={video.durationLabel}
      />
      <span className="svs-jogo-info">
        <span className="svs-jogo-title">{video.videoTitle}</span>
        <span className="svs-jogo-meta">{meta}</span>
      </span>
      <span aria-hidden className="svs-jogo-chevron">
        <ChevronIcon size={18} />
      </span>
    </button>
  );
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
              <div className="svs-list-head">
                <div className="svs-section-label">{isStudent ? "Pick a roda" : "Pick a jogo"}</div>
                {!loading && !error && videos.length > 0 && (
                  <span className="svs-list-count">
                    {videos.length} {videos.length === 1 ? "video" : "videos"}
                  </span>
                )}
              </div>
              {loading ? (
                <p className="svs-status-message">Loading videos&hellip;</p>
              ) : error ? (
                <p className="svs-status-message svs-status-error">{error}</p>
              ) : videos.length === 0 ? (
                <p className="svs-status-message">No videos yet &mdash; bring your own below.</p>
              ) : (
                <div className="svs-jogo-list">
                  {videos.map((video) => (
                    <VideoRow
                      key={video.videoId}
                      video={video}
                      onSelect={() => onStartAnnotating(video.videoId)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="svs-section svs-section-last">
              <div className="svs-section-label">Or bring your own</div>
              {/* A <label> so a tap anywhere on the row (icon, helper text)
                  focuses the link field. The Add button is interactive in
                  its own right, so tapping it still just clicks it. */}
              <label className="svs-own-row">
                <span aria-hidden className="svs-own-icon">
                  <PlusIcon size={16} />
                </span>
                <span className="svs-own-fields">
                  <input
                    className="svs-url-input"
                    type="text"
                    placeholder="Paste a YouTube link"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <span className="svs-own-helper">Public or unlisted videos</span>
                </span>
                <button
                  type="button"
                  className="svs-add-pill"
                  disabled={adding || !youtubeUrl.trim()}
                  onClick={handleAddVideo}
                >
                  {adding ? "Adding…" : "Add"}
                </button>
              </label>
              {addError && <p className="svs-status-message svs-status-error">{addError}</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
