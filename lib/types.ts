export interface Video {
  videoId: string;
  videoTitle: string;
  youtubeId: string;
  style?: "angola" | "regional" | "contemporary";
  // Not yet returned by /api/videos — display-only, degrade gracefully when absent.
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
  tags: string[];
  createdAt: string;
}

export type CapturePhase =
  | "select"
  | "playing"
  | "why"
  | "tags"
  | "done";
