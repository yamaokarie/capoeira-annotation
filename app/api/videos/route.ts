import { NextRequest, NextResponse } from "next/server";

interface AirtableVideoRecord {
  fields: {
    videoId?: string;
    videoTitle?: string;
    youtubeId?: string;
    style?: string;
  };
}

// Fallback catalog when Airtable credentials aren't configured (local dev / demo).
const DEV_MOCK_VIDEOS = [
  {
    videoId: "T7SfSQ16wu8",
    videoTitle: "Mestre Tico — Jogo Angola",
    youtubeId: "T7SfSQ16wu8",
    style: "angola" as const,
    thumbnailUrl: "https://i.ytimg.com/vi/T7SfSQ16wu8/hqdefault.jpg",
  },
];

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_VIDEOS_TABLE || "Videos";

  if (!token || !baseId) {
    return NextResponse.json({ videos: DEV_MOCK_VIDEOS });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data: { records: AirtableVideoRecord[] } = await response.json();
    const videos = data.records.map((record) => ({
      videoId: record.fields.videoId,
      videoTitle: record.fields.videoTitle,
      youtubeId: record.fields.youtubeId,
      style: record.fields.style,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Fetch videos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

async function fetchYoutubeTitle(youtubeId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${youtubeId}`
      )}&format=json`
    );
    if (!res.ok) return youtubeId;
    const data: { title?: string } = await res.json();
    return data.title || youtubeId;
  } catch {
    return youtubeId;
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_VIDEOS_TABLE || "Videos";

  if (!token || !baseId) {
    return NextResponse.json(
      { error: "Airtable credentials missing" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const youtubeId = extractYoutubeId(body.youtubeUrl || "");

    if (!youtubeId) {
      return NextResponse.json(
        { error: "Couldn't find a YouTube video ID in that URL" },
        { status: 400 }
      );
    }

    const videoTitle = await fetchYoutubeTitle(youtubeId);

    const record: AirtableVideoRecord = {
      fields: {
        videoId: youtubeId,
        videoTitle,
        youtubeId,
      },
    };

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [record] }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Airtable error:", errorData);
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data: { records: AirtableVideoRecord[] } = await response.json();
    const created = data.records[0].fields;

    return NextResponse.json({
      video: {
        videoId: created.videoId,
        videoTitle: created.videoTitle,
        youtubeId: created.youtubeId,
        style: created.style,
      },
    });
  } catch (error) {
    console.error("Create video error:", error);
    return NextResponse.json(
      { error: "Failed to add video" },
      { status: 500 }
    );
  }
}
