import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { CaptureFooter } from "@/components/capture/CaptureFooter";

interface SurprisingScreenProps {
  surprising: boolean | null;
  onSurprisingChange: (value: boolean) => void;
  onNext: () => void;
}

export function SurprisingScreen({
  surprising,
  onSurprisingChange,
  onNext,
}: SurprisingScreenProps) {
  return (
    <div className="capture-screen-root">
      <h1
        style={{
          fontSize: "24px",
          fontFamily: "var(--font-display)",
          color: "var(--on-dark)",
          marginTop: "16px",
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
        <PillButton onClick={onNext}>
          {surprising !== null ? (
            <>
              Continue <ArrowIcon size={17} color="#0c0a09" />
            </>
          ) : (
            "Skip"
          )}
        </PillButton>
      </CaptureFooter>
    </div>
  );
}
