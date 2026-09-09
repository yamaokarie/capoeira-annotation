import { PillButton } from "@/components/ui/Button";

interface DoneScreenProps {
  momentLabel: string;
  onBackToJogo: () => void;
  onAnnotateNewVideo: () => void;
}

export function DoneScreen({
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
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
      <h1
        style={{
          fontSize: "24px",
          fontFamily: "var(--font-display)",
          marginBottom: "8px",
        }}
      >
        Moment saved
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--soft)",
          marginBottom: "48px",
        }}
      >
        Your annotation at {momentLabel} has been recorded.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
        }}
      >
        <PillButton onClick={onBackToJogo}>Back to Jogo</PillButton>
        <button
          onClick={onAnnotateNewVideo}
          style={{
            height: "50px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "transparent",
            border: "1px solid var(--soft)",
            color: "var(--ink)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Annotate a New Video
        </button>
      </div>
    </div>
  );
}
