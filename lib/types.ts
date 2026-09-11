export interface Video {
  videoId: string;
  videoTitle: string;
  youtubeId: string;
  style?: "angola" | "regional" | "contemporary";
  // context/aspect/durationLabel not yet returned by /api/videos — display-only,
  // degrade gracefully when absent. thumbnailUrl is returned (derived from youtubeId).
  context?: string;
  aspect?: string;
  durationLabel?: string;
  thumbnailUrl?: string;
}

export interface AnnotationRecord {
  videoId: string;
  videoTitle: string;
  momentTimestamp: number;
  momentLabel: string;
  annotatorName: string;
  whyMode: "voice" | "text";
  transcript: string;
  whyText: string;
  surprising: boolean | null;
  tags: string[];
  endingType: string | null;
  createdAt: string;
}

export type CapturePhase =
  | "select"
  | "playing"
  | "why"
  | "surprising"
  | "tags"
  | "ending"
  | "done";
