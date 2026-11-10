import { NextRequest, NextResponse } from "next/server";
import { parseAudience, tableFor } from "@/lib/audience";

interface AirtableVideoRecord {
  createdTime?: string;
  fields: {
    videoId?: string;
    videoTitle?: string;
    youtubeId?: string;
    style?: string;
  };
}

export async function GET(request: NextRequest) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = tableFor(
    parseAudience(request.nextUrl.searchParams.get("audience")),
    "videos"
  );

  if (!token || !baseId) {
    return NextResponse.json(
      { error: "Airtable credentials missing" },
      { status: 500 }
    );
  }

  try {
    // Airtable returns records in no guaranteed order without a view or
    // sort, so fetch every page and sort newest-first by createdTime (which
    // Airtable sets on every record) — newly added videos land on top.
    const records: AirtableVideoRecord[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`
      );
      if (offset) url.searchParams.set("offset", offset);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }
      const page: { records: AirtableVideoRecord[]; offset?: string } =
        await response.json();
      records.push(...page.records);
      offset = page.offset;
    } while (offset);

    records.sort((a, b) =>
      (b.createdTime ?? "").localeCompare(a.createdTime ?? "")
    );

    const videos = await Promise.all(
      records.map(async (record) => ({
        videoId: record.fields.videoId,
        videoTitle: record.fields.videoTitle,
        youtubeId: record.fields.youtubeId,
        style: record.fields.style,
        thumbnailUrl: thumbnailUrlFor(record.fields.youtubeId),
        channelName: record.fields.youtubeId
          ? (await fetchOembed(record.fields.youtubeId))?.author_name?.trim()
          : undefined,
      }))
    );

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Fetch videos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

function thumbnailUrlFor(youtubeId: string | undefined): string | undefined {
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

interface Oembed {
  title?: string;
  author_name?: string;
}

// YouTube's oEmbed gives title and channel name with no API key, for
// public and unlisted videos (private ones fail → undefined). Cached a day
// by Next's fetch cache; the timeout keeps a slow YouTube from holding up
// the whole video list.
async function fetchOembed(youtubeId: string): Promise<Oembed | undefined> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${youtubeId}`
      )}&format=json`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return undefined;
    return (await res.json()) as Oembed;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = tableFor(
    parseAudience(request.nextUrl.searchParams.get("audience")),
    "videos"
  );

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

    const oembed = await fetchOembed(youtubeId);
    const videoTitle = oembed?.title || youtubeId;

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
        thumbnailUrl: thumbnailUrlFor(created.youtubeId),
        channelName: oembed?.author_name?.trim(),
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
