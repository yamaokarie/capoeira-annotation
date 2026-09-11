import { PillButton } from "@/components/ui/Button";
import { SavedCheck } from "@/components/ui/SavedCheck";
import { CaptureFooter } from "@/components/capture/CaptureFooter";
import type { CapturePhase } from "@/lib/types";

interface DoneScreenProps {
  phase?: CapturePhase;
  momentLabel: string;
  onBackToJogo: () => void;
  onAnnotateNewVideo: () => void;
}

export function DoneScreen({
  phase,
  momentLabel,
  onBackToJogo,
  onAnnotateNewVideo,
}: DoneScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingTop: "48px",
        paddingBottom: "140px",
      }}
    >
      <div style={{ marginBottom: "48px" }}>
        <SavedCheck key={phase} />
      </div>

      <div
        style={{
          fontFamily: "var(--font-kicker)",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--on-dark-soft)",
          marginBottom: "8px",
        }}
      >
        Moment Capture
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "40px",
          lineHeight: 1,
          letterSpacing: "-0.5px",
          color: "var(--on-dark)",
          margin: "0 0 24px",
        }}
      >
        Moment saved
      </h1>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 18px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-serif-italic)",
            fontStyle: "italic",
            fontSize: "15px",
            color: "var(--accent)",
          }}
        >
          frozen at {momentLabel}
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-serif-italic)",
          fontStyle: "italic",
          fontSize: "17px",
          color: "var(--on-dark-soft)",
          margin: 0,
        }}
      >
        Your annotation has been recorded.
      </p>

      <CaptureFooter>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--gap-sm)",
            width: "100%",
          }}
        >
          <PillButton onClick={onBackToJogo}>Back to Jogo</PillButton>
          <button
            className="pill-button"
            onClick={onAnnotateNewVideo}
            style={{
              height: "var(--height-button)",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "transparent",
              border: "1px solid var(--hairline-strong)",
              color: "var(--on-dark)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Annotate a New Video
          </button>
        </div>
      </CaptureFooter>
    </div>
  );
}
