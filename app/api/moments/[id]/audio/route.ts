import { NextRequest, NextResponse } from "next/server";

const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const field = process.env.AIRTABLE_AUDIO_FIELD || "audio";

  if (!token || !baseId) {
    return NextResponse.json(
      { error: "Airtable credentials missing" },
      { status: 500 }
    );
  }

  const { id: recordId } = await params;

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "audio file is required" },
        { status: 400 }
      );
    }

    // Airtable's upload endpoint rejects a contentType with codec params
    // (e.g. "audio/webm;codecs=opus", what MediaRecorder actually reports)
    // with a misleading permissions error — strip down to the base MIME type.
    const contentType = (audio.type || "audio/webm").split(";")[0].trim();
    const extension = EXTENSION_BY_MIME[contentType] || "webm";
    const buffer = Buffer.from(await audio.arrayBuffer());

    const response = await fetch(
      `https://content.airtable.com/v0/${baseId}/${recordId}/${encodeURIComponent(field)}/uploadAttachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: `moment.${extension}`,
          contentType,
          file: buffer.toString("base64"),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Airtable attachment upload error:", errorData);
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ moment: data });
  } catch (error) {
    console.error("Upload audio error:", error);
    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 }
    );
  }
}
