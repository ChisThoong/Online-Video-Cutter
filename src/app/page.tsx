"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:10");
  const [loading, setLoading] = useState(false);

  // Hàm chuyển đổi HH:mm:ss thành giây
  const timeToSeconds = (time: string): number => {
    if (!time || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      throw new Error("Thời gian phải có định dạng HH:mm:ss");
    }
    const [hours, minutes, seconds] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error("Thời gian không hợp lệ");
    }
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleCut = async () => {
    if (!url) {
      alert("Please enter a video URL!");
      return;
    }

    let startSeconds: number, endSeconds: number;
    try {
      startSeconds = timeToSeconds(start);
      endSeconds = timeToSeconds(end);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      alert(errorMessage);
      return;
    }

    if (endSeconds <= startSeconds) {
      alert("End time must be greater than start time!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cut", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, start: startSeconds, end: endSeconds }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "An error occurred!");
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "clip.mp4";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi khi xử lý video";
      console.error("Client error:", err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">  
      <main className="flex-1 max-w-lg mx-auto w-full">
        <div className="bg-white border rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <Clapperboard className="w-8 h-8 text-blue-600" />
            Online Video Cutter
          </h1>

          <label className="block text-sm font-medium mb-1">Video URL</label>
          <input
            type="text"
            placeholder="Enter video URL"
            className="border w-full p-2 rounded mb-4"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start</label>
              <input
                type="time"
                step="1"
                className="border p-2 w-full rounded"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End</label>
              <input
                type="time"
                step="1"
                className="border p-2 w-full rounded"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleCut}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded w-full flex items-center justify-center gap-2 shadow-md"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            {loading ? "Processing..." : "Cut & Download"}
          </button>
         
          <div className="text-center">
          <footer className="text-center text-sm text-gray-500 mt-6">
            Tool by{" "}
            <a
              href="https://chisthongdev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              chisthongg
            </a>
          </footer>
          </div>
        </div>
      </main>

      
    </div>
  );
}