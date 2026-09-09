import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { CaptureFooter } from "@/components/capture/CaptureFooter";

interface SurprisingScreenProps {
  surprising: boolean | null;
  onSurprisingChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SurprisingScreen({
  surprising,
  onSurprisingChange,
  onBack,
  onNext,
}: SurprisingScreenProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: "88px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontFamily: "var(--font-display)",
          color: "var(--on-dark)",
          marginBottom: "var(--gap-lg)",
        }}
      >
        Was the moment surprising?
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--gap-md)",
          marginBottom: "var(--gap-lg)",
        }}
      >
        <Chip label="Yes" selected={surprising === true} onClick={() => onSurprisingChange(true)} />
        <Chip label="No" selected={surprising === false} onClick={() => onSurprisingChange(false)} />
      </div>

      <CaptureFooter>
        <button
          onClick={onBack}
          aria-label="Back to why screen"
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
          <PillButton onClick={onNext}>
            {surprising !== null ? (
              <>
                Continue <ArrowIcon size={17} color="#0c0a09" />
              </>
            ) : (
              "Skip"
            )}
          </PillButton>
        </div>
      </CaptureFooter>
    </div>
  );
}
