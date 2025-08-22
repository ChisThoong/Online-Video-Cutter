import { NextRequest } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

export const runtime = "nodejs";

async function configureFFmpeg() {
  const ffmpegPath = ffmpegInstaller.path;
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log("FFmpeg path:", ffmpegPath);
}

export async function POST(req: NextRequest) {
  try {
    await configureFFmpeg();

    const { url, start, end, mode } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL không hợp lệ" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const startTime = parseFloat(start as string);
    const endTime = parseFloat(end as string);
    const duration = endTime - startTime;

    if (isNaN(startTime) || isNaN(endTime) || duration <= 0) {
      return new Response(JSON.stringify({ error: "Thời gian không hợp lệ" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Processing:", { url, startTime, endTime, duration, mode });

    const id = Date.now();

    // ✅ Tạo thư mục tmp theo OS
    const tmpDir = os.tmpdir(); // cross-platform tmp folder
    const outputPath = path.join(tmpDir, `clip_${id}.mp4`);

    return new Promise<Response>((resolve, reject) => {
      let command = ffmpeg(url)
        .setStartTime(startTime)
        .setDuration(duration);

      if (mode === "tiktok") {
        // crop 16:9 → 9:16
        command.complexFilter(
          "crop=in_h*9/16:in_h:(in_w-out_w)/2:0,scale=576:1024"
        );
      } else {
        // full mode: chỉ map raw stream
        command.outputOptions(["-map 0:v", "-map 0:a?", "-map 0:s?"]);
      }

      command
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-preset veryfast",
          "-movflags +faststart",
        ])
        .save(outputPath)
        .on("start", (cmdLine) => console.log("FFmpeg cmd:", cmdLine))
        .on("end", async () => {
          try {
            const file = await fs.readFile(outputPath);
            await fs.unlink(outputPath).catch(() => {});
            resolve(
              new Response(file, {
                headers: {
                  "Content-Type": "video/mp4",
                  "Content-Disposition": `attachment; filename="clip.mp4"`,
                },
              })
            );
          } catch (err) {
            reject(
              new Response(JSON.stringify({ error: "Lỗi đọc file output" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              })
            );
          }
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(
            new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
        .run();
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: "Lỗi server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
