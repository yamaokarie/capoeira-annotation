import { useEffect, useState } from "react";
import type { CapturePhase } from "@/lib/types";

interface Answers {
  whyMode: "voice" | "text";
  transcript: string;
  whyText: string;
  tags: string[];
}

const initialAnswers: Answers = {
  whyMode: "voice",
  transcript: "",
  whyText: "",
  tags: [],
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
  };
}
