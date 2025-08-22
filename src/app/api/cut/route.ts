import { NextRequest } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

export const runtime = "nodejs";

// Cấu hình FFmpeg
async function configureFFmpeg() {
  const ffmpegPath = ffmpegInstaller.path;
  try {
    await fs.access(ffmpegPath, fs.constants.F_OK);
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log("FFmpeg path:", ffmpegPath);
  } catch (err) {
    console.error(" FFmpeg binary không tồn tại tại:", ffmpegPath);
    throw new Error(`FFmpeg binary không tồn tại tại: ${ffmpegPath}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Gọi hàm cấu hình FFmpeg
    await configureFFmpeg();

    const { url, start, end } = await req.json();

    // Kiểm tra input
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL không hợp lệ" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Kiểm tra start và end là số
    const startTime = parseFloat(start as string);
    const endTime = parseFloat(end as string);

    if (isNaN(startTime) || isNaN(endTime)) {
      console.error("Invalid start or end time:", { start, end });
      return new Response(JSON.stringify({ error: "start hoặc end không phải là số hợp lệ" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const duration = endTime - startTime;
    if (duration <= 0) {
      console.error("Invalid duration:", { startTime, endTime, duration });
      return new Response(JSON.stringify({ error: "Thời lượng video không hợp lệ (end phải lớn hơn start)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Processing video:", { url, startTime, endTime, duration });

    const id = Date.now();
    const outputPath = path.join("/tmp", `clip_${id}.mp4`);

    return new Promise<Response>((resolve, reject) => {
      ffmpeg(url)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("end", async () => {
          try {
            const file = await fs.readFile(outputPath);
            await fs.unlink(outputPath);

            // Chuyển Buffer thành ArrayBuffer để tương thích với Response
            const fileArrayBuffer = file.buffer as ArrayBuffer;
            resolve(
              new Response(fileArrayBuffer, {
                headers: {
                  "Content-Type": "video/mp4",
                  "Content-Disposition": `attachment; filename="clip.mp4"`,
                  "Content-Length": file.length.toString(),
                },
              })
            );
          } catch (err) {
            console.error("File handling error:", err);
            reject(
              new Response(JSON.stringify({ error: "Lỗi khi đọc file" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              })
            );
          }
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(
            new Response(JSON.stringify({ error: "Lỗi khi cắt video: " + err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
        .run();
    });
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Lỗi khi xử lý video";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}