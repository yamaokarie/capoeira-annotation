import type { Metadata } from "next";
import { CaptureApp } from "@/components/capture/CaptureApp";

export const metadata: Metadata = {
  title: "Capoeira Annotation · Students",
  description: "Mark and annotate moments in student rodas",
};

export default function StudentHome() {
  return <CaptureApp audience="student" />;
}
