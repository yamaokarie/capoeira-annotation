export interface Video {
  videoId: string;
  videoTitle: string;
  youtubeId: string;
  style?: "angola" | "regional" | "contemporary";
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
  surprising?: "yes" | "no";
  offerType?: "invitation" | "threat" | "redirection" | "pressure";
  endingType?: "clean break" | "reset" | "takedown" | "laughter";
  createdAt: string;
}

export type CapturePhase =
  | "select"
  | "playing"
  | "why"
  | "q1"
  | "q2"
  | "q3"
  | "done";
