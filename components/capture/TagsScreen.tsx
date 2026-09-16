import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { TAGS } from "@/lib/taxonomy";
import { CaptureFooter } from "@/components/capture/CaptureFooter";

interface TagsScreenProps {
  selectedTags: string[];
  onToggleTag: (value: string) => void;
  onNext: () => void;
}

export function TagsScreen({ selectedTags, onToggleTag, onNext }: TagsScreenProps) {
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
        <PillButton onClick={onNext}>
          {selectedTags.length > 0 ? (
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
