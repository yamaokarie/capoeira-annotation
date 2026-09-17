"use client";

import { useEffect, useRef, useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Waveform } from "@/components/ui/Waveform";
import { ArrowIcon, KbdIcon, MicIcon, PauseIcon, PlayIcon, RedoIcon } from "@/components/ui/icons";

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

type WhyMode = "voice" | "text";
type RecState = "idle" | "rec" | "done";

interface WhyScreenProps {
  whyMode: WhyMode;
  whyText: string;
  transcript: string;
  onWhyModeChange: (mode: WhyMode) => void;
  onWhyTextChange: (text: string) => void;
  onTranscriptChange: (transcript: string) => void;
  onAudioRecorded: (blob: Blob | null) => void;
  onNext: () => void;
}

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function WhyScreen({
  whyMode,
  whyText,
  transcript,
  onWhyModeChange,
  onWhyTextChange,
  onTranscriptChange,
  onAudioRecorded,
  onNext,
}: WhyScreenProps) {
  const [recState, setRecState] = useState<RecState>(transcript ? "done" : "idle");
  const [dur, setDur] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordedBlob = useRef<Blob | null>(null);
  const objectUrl = useRef<string | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to transcribe");
      onTranscriptChange(data.text || "");
    } catch {
      setTranscribeError("Couldn't transcribe — try again, or type instead.");
    } finally {
      setTranscribing(false);
    }
  };

  const startRec = async () => {
    setMicError(null);
    setTranscribeError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: mimeType || "audio/webm" });
        recordedBlob.current = blob;
        onAudioRecorded(blob);
        transcribe(blob);
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecState("rec");
      setDur(0);
      onTranscriptChange("");
      timer.current = setInterval(() => setDur((d) => d + 1), 1000);
    } catch {
      setMicError("Couldn't access the microphone — check permissions, or type instead.");
    }
  };

  const stopRec = () => {
    if (timer.current) clearInterval(timer.current);
    setRecState("done");
    mediaRecorder.current?.stop();
  };

  const reRec = () => {
    setRecState("idle");
    setDur(0);
    setPlaying(false);
    onTranscriptChange("");
    recordedBlob.current = null;
    onAudioRecorded(null);
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  };

  const togglePlayback = () => {
    if (!recordedBlob.current) return;
    if (!audioEl.current) {
      objectUrl.current = URL.createObjectURL(recordedBlob.current);
      audioEl.current = new Audio(objectUrl.current);
      audioEl.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioEl.current.pause();
      setPlaying(false);
    } else {
      audioEl.current.play();
      setPlaying(true);
    }
  };

  const canContinue =
    whyMode === "voice"
      ? recState === "done" && !transcribing && !transcribeError && transcript.trim().length > 0
      : whyText.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <h1
          className="why-headline"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            color: "var(--on-dark)",
            fontSize: "34px",
            lineHeight: 1.1,
            letterSpacing: "-0.6px",
            maxWidth: "11ch",
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
          }}
        >
          Why does this moment{" "}matter?
        </h1>
      </div>

      {whyMode === "voice" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
            padding: "8px 0 16px",
          }}
        >
          {recState !== "done" && (
            <div
              className="screen-enter"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}
            >
              <button
                className="icon-btn"
                onClick={recState === "rec" ? stopRec : startRec}
                aria-label={recState === "rec" ? "Stop recording" : "Start recording"}
                style={{
                  position: "relative",
                  width: "104px",
                  height: "104px",
                  borderRadius: "var(--radius-pill)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: recState === "rec" ? "var(--primary)" : "var(--cream)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 40px -8px rgba(0, 0, 0, 0.5)",
                }}
              >
                {recState === "rec" && (
                  <span
                    className="mic-pulse"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "var(--radius-pill)",
                      border: "2px solid var(--cream)",
                      animation: "mic-pulse 1.6s ease-out infinite",
                    }}
                  />
                )}
                <MicIcon size={36} color={recState === "rec" ? "var(--cream)" : "#0c0a09"} />
              </button>

              <div style={{ height: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                {recState === "rec" ? (
                  <>
                    <span
                      className="rec-dot"
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        backgroundColor: "var(--rose)",
                        animation: "rec-blink 1.2s infinite",
                      }}
                    />
                    <span
                      style={{
                        color: "var(--on-dark)",
                        fontSize: "15px",
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {mmss(dur)}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "var(--on-dark-soft)", fontSize: "14px" }}>
                    Tap to record · speak freely
                  </span>
                )}
              </div>

              {micError && (
                <p
                  style={{
                    color: "#e2483d",
                    fontSize: "13px",
                    textAlign: "center",
                    margin: 0,
                    maxWidth: "26ch",
                  }}
                >
                  {micError}
                </p>
              )}

              <Waveform active={recState === "rec"} height={48} />

              <button
                onClick={() => onWhyModeChange("text")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--on-dark-soft)",
                  fontSize: "14px",
                  fontWeight: 500,
                  padding: "8px",
                }}
              >
                <KbdIcon size={16} /> Type instead
              </button>
            </div>
          )}

          {recState === "done" && (
            <div
              className="screen-enter"
              style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  backgroundColor: "#1c1917",
                  border: "1px solid var(--hairline-light)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                <button
                  className="icon-btn"
                  onClick={togglePlayback}
                  aria-label={playing ? "Pause recording" : "Play recording"}
                  style={{
                    width: "34px",
                    height: "34px",
                    flex: "0 0 auto",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "var(--cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: playing ? 0 : "2px",
                  }}
                >
                  {playing ? (
                    <PauseIcon size={16} color="#0c0a09" />
                  ) : (
                    <PlayIcon size={16} color="#0c0a09" />
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Waveform
                    active={false}
                    bars={32}
                    height={30}
                    width="100%"
                    seedHeights={Array.from({ length: 32 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(i * 1.3)))}
                  />
                </div>
                <span
                  style={{
                    color: "var(--on-dark-soft)",
                    fontSize: "13px",
                    fontVariantNumeric: "tabular-nums",
                    flex: "0 0 auto",
                  }}
                >
                  {mmss(dur)}
                </span>
                <button
                  className="icon-btn"
                  onClick={reRec}
                  aria-label="Re-record"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    flex: "0 0 auto",
                  }}
                >
                  <RedoIcon size={16} color="var(--on-dark-soft)" />
                </button>
              </div>

              <div
                style={{
                  color: "var(--on-dark)",
                  fontFamily: "var(--font-serif-italic)",
                  fontStyle: "italic",
                  fontSize: "18px",
                  lineHeight: 1.45,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {transcribing ? (
                  <span
                    style={{
                      color: "var(--on-dark-soft)",
                      fontStyle: "normal",
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                    }}
                  >
                    Transcribing…
                  </span>
                ) : transcribeError ? (
                  <span
                    style={{
                      color: "#e2483d",
                      fontStyle: "normal",
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                    }}
                  >
                    {transcribeError}{" "}
                    <button
                      onClick={() => recordedBlob.current && transcribe(recordedBlob.current)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--on-dark)",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: 0,
                      }}
                    >
                      Try again
                    </button>
                  </span>
                ) : (
                  <span>“{transcript}”</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "18px" }}>
          <textarea
            placeholder="What does this moment reveal about the game? What should a student understand…"
            value={whyText}
            onChange={(e) => onWhyTextChange(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              minHeight: "180px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--hairline-strong)",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "var(--on-dark)",
              fontSize: "16px",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
              letterSpacing: "0.16px",
              resize: "none",
            }}
          />
          <button
            onClick={() => onWhyModeChange("voice")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--on-dark-soft)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "8px",
            }}
          >
            <MicIcon size={16} /> Record instead
          </button>
        </div>
      )}

      <div style={{ marginTop: "var(--gap-lg)" }}>
        <PillButton onClick={onNext} disabled={!canContinue}>
          Continue <ArrowIcon size={17} color="#0c0a09" />
        </PillButton>
      </div>
    </div>
  );
}
