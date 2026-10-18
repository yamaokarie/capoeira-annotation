import { useEffect, useState } from "react";
import type { CapturePhase } from "@/lib/types";

interface Answers {
  whyMode: "voice" | "text";
  transcript: string;
  whyText: string;
  surprising: boolean | null;
  tags: string[];
  endingType: string | null;
}

const CAPTURE_PHASES: CapturePhase[] = ["why", "surprising", "tags", "ending"];

const initialAnswers: Answers = {
  whyMode: "voice",
  transcript: "",
  whyText: "",
  surprising: null,
  tags: [],
  endingType: null,
};

// `storageKey` keeps the expert (`/`) and student (`/student`) sites from
// overwriting each other's saved state.
export function useCaptureState(storageKey = "capoeira-capture-state") {
  const [phase, setPhase] = useState<CapturePhase>("select");
  const [annotatorName, setAnnotatorName] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  // False until the saved draft (if any) has been read back from
  // localStorage — gates the save effect below so the first render's empty
  // state doesn't overwrite the draft before it's restored.
  const [hydrated, setHydrated] = useState(false);

  const updateAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const resetForNextMoment = () => {
    setPhase("playing");
    setFrozenAt(null);
    setAnswers(initialAnswers);
  };

  const cancel = () => {
    setPhase("playing");
    setFrozenAt(null);
    setAnswers(initialAnswers);
  };

  // Full reset for leaving the capture flow entirely — used whenever we
  // return to the Select screen (Done's "Annotate a New Video", Playing's
  // back button). Distinct from `cancel`, which keeps the same video and
  // just backs out of a moment; this also clears `selectedVideo` and, unlike
  // `cancel`, `frozenAt`/`answers` here matter because the *next* video
  // picked could otherwise inherit the previous one's frozen timestamp and
  // answers (both are persisted to localStorage, and survive in memory
  // across a video switch).
  const backToSelect = () => {
    setPhase("select");
    setSelectedVideo(null);
    setFrozenAt(null);
    setAnswers(initialAnswers);
  };

  // Restore an in-progress draft so an annotator can close the tab (or
  // reload, or come back days later) and pick up where they left off —
  // there's no expiry. A finished moment ("done") isn't a draft, so it
  // comes back as the same video playing with a clean slate instead.
  // localStorage isn't available during the server render, so this has to
  // run after mount rather than in the useState initializers.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.annotatorName === "string") setAnnotatorName(saved.annotatorName);
        if (typeof saved.selectedVideo === "string") {
          setSelectedVideo(saved.selectedVideo);
          const savedFrozenAt = typeof saved.frozenAt === "number" ? saved.frozenAt : null;
          if (savedFrozenAt !== null && CAPTURE_PHASES.includes(saved.phase)) {
            setPhase(saved.phase);
            setFrozenAt(savedFrozenAt);
            setAnswers({ ...initialAnswers, ...saved.answers });
          } else {
            setPhase("playing");
          }
        }
      }
    } catch {
      // Unreadable/blocked storage — just start fresh.
    }
    setHydrated(true);
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    const state = { phase, annotatorName, selectedVideo, frozenAt, answers };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage full/blocked — the draft just won't survive a reload.
    }
  }, [hydrated, storageKey, phase, annotatorName, selectedVideo, frozenAt, answers]);

  return {
    hydrated,
    phase,
    setPhase,
    annotatorName,
    setAnnotatorName,
    selectedVideo,
    setSelectedVideo,
    frozenAt,
    setFrozenAt,
    answers,
    updateAnswer,
    resetForNextMoment,
    cancel,
    backToSelect,
  };
}
