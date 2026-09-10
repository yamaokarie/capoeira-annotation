"use client";

import { useEffect, useRef, useState } from "react";
import { SelectVideoScreen } from "@/components/capture/SelectVideoScreen";
import { PlayingScreen } from "@/components/capture/PlayingScreen";
import { WhyScreen } from "@/components/capture/WhyScreen";
import { SurprisingScreen } from "@/components/capture/SurprisingScreen";
import { TagsScreen } from "@/components/capture/TagsScreen";
import { EndingScreen } from "@/components/capture/EndingScreen";
import { DoneScreen } from "@/components/capture/DoneScreen";
import { GradientOrbs } from "@/components/capture/GradientOrbs";
import { ContextScrubber } from "@/components/capture/ContextScrubber";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";
import type { YouTubePlayerHandle } from "@/components/video/YouTubePlayer";
import { CaptureTopbar } from "@/components/capture/CaptureTopbar";
import { CloseIcon } from "@/components/ui/icons";
import { useCaptureState } from "@/hooks/useCaptureState";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import type { Video } from "@/lib/types";

export default function Home() {
  const captureState = useCaptureState();
  const videoPlayer = useVideoPlayer();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Held outside useCaptureState because it's a Blob, not JSON-serializable
  // (useCaptureState persists its state to localStorage on every change).
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  // Reflects YouTube's actual play state, including playback resumed via
  // the iframe's own native center button while frozen (invisible to our
  // `playing` prop otherwise) — drives the context scrubber during capture.
  const [videoPlaying, setVideoPlaying] = useState(false);

  // "why", "surprising", "tags", and "ending" are all the dark, orb-backed
  // capture screens; "surprising"/"tags"/"ending" are text-only (no video/
  // timeline), so they're excluded from `showVideo` below.
  const isCapturePhase =
    captureState.phase === "why" ||
    captureState.phase === "surprising" ||
    captureState.phase === "tags" ||
    captureState.phase === "ending";
  const showVideo =
    captureState.phase === "playing" || captureState.phase === "why";
  const showTopControls = captureState.phase === "playing" || isCapturePhase;

  useEffect(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setVideosError(data.error);
        } else {
          setVideos(data.videos || []);
        }
        setVideosLoading(false);
      })
      .catch(() => {
        setVideosError("Failed to reach the server");
        setVideosLoading(false);
      });
  }, []);

  const selectedVideoData = videos.find(
    (v) => v.videoId === captureState.selectedVideo
  );

  // Start playing as soon as a video is chosen.
  useEffect(() => {
    if (captureState.selectedVideo) {
      videoPlayer.setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureState.selectedVideo]);

  // Poll the real player position while actively playing, to drive the
  // scrub row and give the freeze button an accurate timestamp.
  useEffect(() => {
    if (captureState.phase === "playing") {
      const id = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
        setDuration(playerRef.current?.getDuration() ?? 0);
      }, 250);
      return () => clearInterval(id);
    }
    // During capture (why/q1/q2/q3) the app's own transport is hidden, but
    // the frozen frame can still be resumed via YouTube's native center
    // button — keep the context scrubber's head advancing when that happens.
    if (isCapturePhase && videoPlaying) {
      const id = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
      }, 250);
      return () => clearInterval(id);
    }
  }, [captureState.phase, isCapturePhase, videoPlaying]);

  if (captureState.phase === "select" || !selectedVideoData) {
    return (
      <SelectVideoScreen
        videos={videos}
        loading={videosLoading}
        error={videosError}
        onStartAnnotating={(videoId) => {
          captureState.setSelectedVideo(videoId);
          captureState.setPhase("playing");
        }}
        onVideoAdded={(video) => setVideos((prev) => [...prev, video])}
        annotatorName={captureState.annotatorName}
        onAnnotatorNameChange={captureState.setAnnotatorName}
      />
    );
  }

  const handleFreeze = () => {
    const frozenTime = playerRef.current?.getCurrentTime() ?? 0;
    captureState.setFrozenAt(frozenTime);
    // Keeps the context scrubber's head exactly aligned with the red dot
    // at the moment of freezing, rather than waiting for the next poll tick.
    setCurrentTime(frozenTime);
    captureState.setPhase("why");
    videoPlayer.setPlaying(false);
  };

  const handleCancel = () => {
    captureState.cancel();
    videoPlayer.setPlaying(true);
    setSaveError(null);
    setAudioBlob(null);
  };

  const handleSeek = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    setCurrentTime(seconds);
  };

  // Lets the annotator fine-tune the frozen moment from the Why screen: play
  // or scrub to a better spot, then tap the "Move freeze to m:ss" tag that
  // appears once they settle there.
  const handleRepositionFreeze = (seconds: number) => {
    captureState.setFrozenAt(seconds);
  };

  const handleSkip = (delta: number) => {
    handleSeek(Math.max(0, Math.min(duration || Infinity, currentTime + delta)));
  };

  const handleSaveMoment = async () => {
    if (captureState.frozenAt === null) return;
    setSaving(true);
    setSaveError(null);
    const { whyMode, whyText, transcript, tags, surprising, endingType } =
      captureState.answers;
    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: captureState.selectedVideo,
          videoTitle: selectedVideoData?.videoTitle,
          momentTimestamp: captureState.frozenAt,
          momentLabel: videoPlayer.formatTime(captureState.frozenAt),
          annotatorName: captureState.annotatorName,
          whyMode,
          transcript,
          whyText,
          tags,
          surprising,
          endingType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save annotation");
      }

      if (audioBlob && data.moment?.id) {
        try {
          const audioForm = new FormData();
          audioForm.append("audio", audioBlob, "recording.webm");
          await fetch(`/api/moments/${data.moment.id}/audio`, {
            method: "POST",
            body: audioForm,
          });
        } catch (audioError) {
          console.error("Attach audio error:", audioError);
        }
      }

      captureState.setPhase("done");
    } catch {
      setSaveError("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // Playing/Why keep the pre-grid side padding & top clearance so the video
  // frame's on-screen size/position stays pixel-identical; Tags/Done (no
  // video on screen) use the new grid values.
  const sidePadding = showVideo ? "var(--side-padding-video)" : "var(--side-padding)";
  const topClearance = showVideo ? "var(--top-clearance-video)" : "var(--top-clearance)";

  return (
    <div
      style={{
        padding: sidePadding,
        paddingTop: topClearance,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: showTopControls ? "var(--ink)" : undefined,
      }}
    >
      {isCapturePhase && <GradientOrbs />}

      <div style={{ position: "relative" }}>
        {showTopControls && (
          <>
            {isCapturePhase ? (
              <CaptureTopbar
                frozenAt={captureState.frozenAt}
                formatTime={videoPlayer.formatTime}
                onCancel={handleCancel}
              />
            ) : captureState.phase === "playing" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "16px",
                }}
              >
                <button
                  onClick={() => {
                    captureState.setSelectedVideo(null);
                    captureState.setPhase("select");
                  }}
                  aria-label="Back to video selection"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: "1px solid var(--hairline-light)",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <CloseIcon size={16} color="var(--on-dark)" />
                </button>
              </div>
            ) : null}

            {showVideo && (
              <YouTubePlayer
                ref={playerRef}
                youtubeId={selectedVideoData.youtubeId}
                playing={videoPlayer.playing}
                frozenAt={captureState.frozenAt}
                onFreeze={captureState.phase === "playing" ? handleFreeze : undefined}
                onPlayStateChange={setVideoPlaying}
                variant={captureState.phase === "why" ? "card" : "default"}
              />
            )}

            {showVideo && captureState.frozenAt !== null && (
              <ContextScrubber
                frozenAt={captureState.frozenAt}
                duration={duration}
                value={currentTime}
                onScrub={handleSeek}
                playing={videoPlaying}
                onRepositionFreeze={
                  captureState.phase === "why" ? handleRepositionFreeze : undefined
                }
              />
            )}
          </>
        )}

        {captureState.phase === "playing" && (
          <PlayingScreen
            playing={videoPlayer.playing}
            onPlayingChange={videoPlayer.setPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onSkip={handleSkip}
            onSetPlaybackRate={(rate) => playerRef.current?.setPlaybackRate(rate)}
            formatTime={videoPlayer.formatTime}
          />
        )}

        {captureState.phase === "why" && (
          <WhyScreen
            whyMode={captureState.answers.whyMode}
            whyText={captureState.answers.whyText}
            transcript={captureState.answers.transcript}
            onWhyModeChange={(mode) => captureState.updateAnswer("whyMode", mode)}
            onWhyTextChange={(text) => captureState.updateAnswer("whyText", text)}
            onTranscriptChange={(transcript) => captureState.updateAnswer("transcript", transcript)}
            onAudioRecorded={setAudioBlob}
            onBack={handleCancel}
            onNext={() => captureState.setPhase("surprising")}
          />
        )}

        {captureState.phase === "surprising" && (
          <SurprisingScreen
            surprising={captureState.answers.surprising}
            onSurprisingChange={(value) => captureState.updateAnswer("surprising", value)}
            onBack={() => captureState.setPhase("why")}
            onNext={() => captureState.setPhase("tags")}
          />
        )}

        {captureState.phase === "tags" && (
          <TagsScreen
            selectedTags={captureState.answers.tags}
            onToggleTag={(value) => {
              const current = captureState.answers.tags;
              captureState.updateAnswer(
                "tags",
                current.includes(value)
                  ? current.filter((t) => t !== value)
                  : [...current, value]
              );
            }}
            onBack={() => captureState.setPhase("surprising")}
            onNext={() => captureState.setPhase("ending")}
          />
        )}

        {captureState.phase === "ending" && (
          <EndingScreen
            endingType={captureState.answers.endingType}
            onEndingTypeChange={(value) => captureState.updateAnswer("endingType", value)}
            onBack={() => captureState.setPhase("tags")}
            onSave={handleSaveMoment}
            saving={saving}
            saveError={saveError}
          />
        )}

        {captureState.phase === "done" && captureState.frozenAt !== null && (
          <DoneScreen
            momentLabel={videoPlayer.formatTime(captureState.frozenAt)}
            onBackToJogo={() => {
              captureState.resetForNextMoment();
              videoPlayer.setPlaying(true);
              setAudioBlob(null);
            }}
            onAnnotateNewVideo={() => {
              captureState.setSelectedVideo(null);
              captureState.setPhase("select");
              setAudioBlob(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
