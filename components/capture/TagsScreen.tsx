import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { TAGS } from "@/lib/taxonomy";
import { CaptureFooter } from "@/components/capture/CaptureFooter";

interface TagsScreenProps {
  selectedTags: string[];
  onToggleTag: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function TagsScreen({ selectedTags, onToggleTag, onBack, onNext }: TagsScreenProps) {
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const activeDefinition = TAGS.find((tag) => tag.value === lastTapped)?.definition;

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
        What kind of moment was it?
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--gap-md)",
          marginBottom: "var(--gap-md)",
        }}
      >
        {TAGS.map((tag) => (
          <Chip
            key={tag.value}
            label={tag.label}
            selected={selectedTags.includes(tag.value)}
            onClick={() => {
              setLastTapped(tag.value);
              onToggleTag(tag.value);
            }}
          />
        ))}
      </div>

      <p
        key={activeDefinition ?? "default"}
        className="caption-fade"
        style={{
          fontFamily: "var(--font-serif-italic)",
          fontStyle: "italic",
          fontSize: "18px",
          lineHeight: 1.5,
          color: "var(--on-dark-soft)",
          marginTop: 0,
          marginBottom: "var(--gap-lg)",
        }}
      >
        {activeDefinition ?? "Pick as many as fit — or none"}
      </p>

      <CaptureFooter>
        <button
          className="icon-btn capture-inline-back"
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
            {selectedTags.length > 0 ? (
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
