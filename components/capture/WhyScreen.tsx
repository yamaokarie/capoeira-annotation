"use client";

import { useEffect, useRef, useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Waveform } from "@/components/ui/Waveform";
import { ArrowIcon, KbdIcon, MicIcon, PlayIcon, RedoIcon } from "@/components/ui/icons";

// Placeholder-only, per design.md: no real audio capture or transcription in
// this build — mic/waveform is simulated, transcript is a fixed sample string.
const SAMPLE_TRANSCRIPT =
  "Cooperative parallel play, then Gegê drops into a chizora — an unfinished attack from the floor. The shift from non-engaging to engaging is the heartbeat of the game.";

type WhyMode = "voice" | "text";
type RecState = "idle" | "rec" | "done";

interface WhyScreenProps {
  whyMode: WhyMode;
  whyText: string;
  transcript: string;
  onWhyModeChange: (mode: WhyMode) => void;
  onWhyTextChange: (text: string) => void;
  onTranscriptChange: (transcript: string) => void;
  onBack: () => void;
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
  onBack,
  onNext,
}: WhyScreenProps) {
  const [recState, setRecState] = useState<RecState>(transcript ? "done" : "idle");
  const [dur, setDur] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const startRec = () => {
    setRecState("rec");
    setDur(0);
    onTranscriptChange("");
    timer.current = setInterval(() => setDur((d) => d + 1), 1000);
  };

  const stopRec = () => {
    if (timer.current) clearInterval(timer.current);
    setRecState("done");
    setTranscribing(true);
    setTimeout(() => {
      setTranscribing(false);
      onTranscriptChange(SAMPLE_TRANSCRIPT);
    }, 1100);
  };

  const reRec = () => {
    setRecState("idle");
    setDur(0);
    onTranscriptChange("");
  };

  const canContinue = whyMode === "voice" ? recState === "done" : whyText.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.96px",
            textTransform: "uppercase",
            color: "var(--on-dark-soft)",
            marginBottom: "14px",
          }}
        >
          In your own words
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            color: "var(--on-dark)",
            fontSize: "34px",
            lineHeight: 1.1,
            letterSpacing: "-0.6px",
            maxWidth: "11ch",
            margin: 0,
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
            <>
              <button
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
            </>
          )}

          {recState === "done" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
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
                  aria-label="Play recording"
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
                    paddingLeft: "2px",
                  }}
                >
                  <PlayIcon size={16} color="#0c0a09" />
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
                  {mmss(dur || 8)}
                </span>
                <button
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
                ) : (
                  <span>“{transcript || SAMPLE_TRANSCRIPT}”</span>
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

      <div style={{ marginTop: "var(--gap-lg)", display: "flex", gap: "var(--gap-sm)" }}>
        <button
          onClick={onBack}
          aria-label="Back to playing"
          style={{
            width: "var(--height-circular)",
            height: "var(--height-circular)",
            flex: "0 0 auto",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "transparent",
            border: "1px solid var(--hairline-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
            <ArrowIcon size={17} color="var(--on-dark)" />
          </span>
        </button>
        <div style={{ flex: 1 }}>
          <PillButton onClick={onNext} disabled={!canContinue}>
            Continue <ArrowIcon size={17} color="#0c0a09" />
          </PillButton>
        </div>
      </div>
    </div>
  );
}
