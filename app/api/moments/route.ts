import { NextRequest, NextResponse } from "next/server";

interface MomentPayload {
  videoId: string;
  videoTitle: string;
  momentTimestamp: number;
  momentLabel: string;
  annotatorName: string;
  whyMode: "voice" | "text";
  transcript: string;
  whyText: string;
  tags: string[];
  surprising: boolean | null;
  endingType: string | null;
}

interface AirtableMomentRecord {
  id?: string;
  fields: {
    videoId?: string;
    videoTitle?: string;
    momentTimestamp?: number;
    momentLabel?: string;
    annotatorName?: string;
    whyMode?: string;
    transcript?: string;
    whyText?: string;
    tags?: string[];
    surprising?: string;
    endingType?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_ANNOTATIONS_TABLE || "Annotations";

  if (!token || !baseId) {
    return NextResponse.json(
      { error: "Airtable credentials missing" },
      { status: 500 }
    );
  }

  const body: Partial<MomentPayload> = await request.json();
  const whyContent = body.whyMode === "voice" ? body.transcript : body.whyText;

  if (!body.videoId || typeof body.momentTimestamp !== "number" || !whyContent) {
    return NextResponse.json(
      { error: "videoId, momentTimestamp, and whyText/transcript are required" },
      { status: 400 }
    );
  }

  const record: AirtableMomentRecord = {
    fields: {
      videoId: body.videoId,
      videoTitle: body.videoTitle || "",
      momentTimestamp: body.momentTimestamp,
      momentLabel: body.momentLabel || "",
      annotatorName: body.annotatorName || "",
      whyMode: body.whyMode || "text",
      transcript: body.transcript || "",
      whyText: body.whyText || "",
      tags: body.tags || [],
      // `surprising` is a single-select field in Airtable, not a checkbox —
      // send its display label ("Yes"/"No"), omit entirely when unanswered.
      ...(body.surprising !== null && body.surprising !== undefined
        ? { surprising: body.surprising ? "Yes" : "No" }
        : {}),
      endingType: body.endingType ?? null,
    },
  };

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [record], typecast: true }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Airtable error:", errorData);
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data: { records: AirtableMomentRecord[] } = await response.json();
    const created = data.records[0];

    return NextResponse.json({ moment: { id: created.id, ...created.fields } });
  } catch (error) {
    console.error("Save moment error:", error);
    return NextResponse.json(
      { error: "Failed to save annotation" },
      { status: 500 }
    );
  }
}
