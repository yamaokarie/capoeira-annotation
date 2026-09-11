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

const initialAnswers: Answers = {
  whyMode: "voice",
  transcript: "",
  whyText: "",
  surprising: null,
  tags: [],
  endingType: null,
};

export function useCaptureState() {
  const [phase, setPhase] = useState<CapturePhase>("select");
  const [annotatorName, setAnnotatorName] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

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
  // answers (frozenAt isn't persisted to localStorage, but it does survive
  // in memory across a video switch within the same session).
  const backToSelect = () => {
    setPhase("select");
    setSelectedVideo(null);
    setFrozenAt(null);
    setAnswers(initialAnswers);
  };

  useEffect(() => {
    const state = { phase, annotatorName, selectedVideo, answers };
    localStorage.setItem("capoeira-capture-state", JSON.stringify(state));
  }, [phase, annotatorName, selectedVideo, answers]);

  return {
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
