import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI credentials missing" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "audio file is required" },
        { status: 400 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", audio, "recording.webm");
    upstreamForm.append("model", "gpt-4o-mini-transcribe");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: upstreamForm,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI transcription error:", errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: { text?: string } = await response.json();

    return NextResponse.json({ text: data.text || "" });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe" },
      { status: 500 }
    );
  }
}
