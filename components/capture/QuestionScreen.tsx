import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/Button";

interface QuestionOption {
  label: string;
  value: string;
  definition?: string;
}

interface QuestionScreenProps {
  questionIndex: number; // 0, 1, 2
  title: string;
  options: readonly QuestionOption[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function QuestionScreen({
  questionIndex,
  title,
  options,
  selectedValue,
  onSelect,
  onNext,
  onSkip,
}: QuestionScreenProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "16px",
          height: "3px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: "var(--on-dark)",
              borderRadius: "2px",
              opacity: i <= questionIndex ? 1 : 0.2,
            }}
          />
        ))}
      </div>

      <h1
        style={{
          fontSize: "24px",
          fontFamily: "var(--font-display)",
          color: "var(--on-dark)",
          marginBottom: "24px",
        }}
      >
        {title}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          justifyItems: "start",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selectedValue === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>

      <p
        style={{
          minHeight: "40px",
          fontSize: "12px",
          color: "var(--on-dark-soft)",
          fontStyle: "italic",
          marginTop: 0,
          marginBottom: "20px",
        }}
      >
        {options.find((o) => o.value === selectedValue)?.definition ?? " "}
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onSkip}
          style={{
            flex: 1,
            height: "50px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "transparent",
            border: "1px solid var(--hairline-strong)",
            color: "var(--on-dark)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Skip
        </button>
        <div style={{ flex: 1 }}>
          <PillButton onClick={onNext} disabled={!selectedValue}>
            Next
          </PillButton>
        </div>
      </div>
    </div>
  );
}
