"use client";

import { useState } from "react";
import type { Video } from "@/lib/types";
import { PillButton } from "@/components/ui/Button";

interface SelectVideoScreenProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onSelectVideo: (videoId: string) => void;
  onVideoAdded: (video: Video) => void;
  annotatorName: string;
  onAnnotatorNameChange: (name: string) => void;
}

export function SelectVideoScreen({
  videos,
  loading,
  error,
  onSelectVideo,
  onVideoAdded,
  annotatorName,
  onAnnotatorNameChange,
}: SelectVideoScreenProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSelectVideo = (videoId: string) => {
    if (annotatorName.trim()) {
      onSelectVideo(videoId);
    } else {
      alert("Please enter your name first");
    }
  };

  const handleAddVideo = async () => {
    if (!annotatorName.trim()) {
      alert("Please enter your name first");
      return;
    }
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
      onSelectVideo(data.video.videoId);
    } catch {
      setAddError("Failed to reach the server");
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        padding: "var(--side-padding)",
        paddingTop: "var(--top-clearance)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontFamily: "var(--font-display)",
          marginBottom: "24px",
        }}
      >
        Annotate Capoeira
      </h1>

      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontFamily: "var(--font-kicker)",
            color: "var(--soft)",
            marginBottom: "8px",
          }}
        >
          Your name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          value={annotatorName}
          onChange={(e) => onAnnotatorNameChange(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--soft)",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontFamily: "var(--font-kicker)",
            color: "var(--soft)",
            marginBottom: "16px",
          }}
        >
          Select a jogo to annotate
        </label>

        {loading ? (
          <p style={{ color: "var(--soft)" }}>Loading videos...</p>
        ) : error ? (
          <p style={{ color: "var(--verdict-poor)" }}>{error}</p>
        ) : videos.length === 0 ? (
          <p style={{ color: "var(--soft)" }}>
            No videos available. Add one below.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {videos.map((video) => (
              <button
                key={video.videoId}
                onClick={() => handleSelectVideo(video.videoId)}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--soft)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  {video.videoTitle}
                </div>
                {video.style && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--soft)",
                      marginTop: "4px",
                    }}
                  >
                    {video.style}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontFamily: "var(--font-kicker)",
            color: "var(--soft)",
            marginBottom: "16px",
          }}
        >
          Or add a new video
        </label>

        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Paste a YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid var(--soft)",
              fontSize: "14px",
            }}
          />
        </div>

        {addError && (
          <p style={{ color: "var(--verdict-poor)", marginBottom: "12px" }}>
            {addError}
          </p>
        )}

        <PillButton onClick={handleAddVideo} disabled={adding || !youtubeUrl.trim()}>
          {adding ? "Adding…" : "Add Video"}
        </PillButton>
      </div>
    </div>
  );
}
