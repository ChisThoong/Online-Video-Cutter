import { NextResponse } from "next/server";
import ffmpegPath from "ffmpeg-static"; // ✅ import default, không dùng require.resolve

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ffmpegPath: ffmpegPath || "Not found",
  });
}
