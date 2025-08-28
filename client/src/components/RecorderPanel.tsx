"use client";

import React, { useMemo, useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";

type WakeReply = { starting: boolean; healthy?: boolean; apiBase: string };

async function wakeServer(): Promise<WakeReply> {
  // Calls your Next.js API route (see section 2)
  const r = await fetch("/api/wake", { method: "POST" });
  if (!r.ok) throw new Error(`Wake failed: ${r.status}`);
  return r.json();
}

async function waitForHealth(apiBase: string, timeoutMs = 180_000, intervalMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  const base = apiBase.replace(/\/$/, "");
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/health`, { cache: "no-store" });
      if (res.ok) return true;
    } catch { /* ignore and retry */ }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Server did not become healthy in time");
}

export default function RecorderPanel() {
  const { start, stop, clear, blob, mimeType, recording } = useRecorder();

  const [status, setStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [ready, setReady] = useState(false);

  // Default for local dev; will be overwritten by wake response
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_BASE || "");

  const audioURL = useMemo(() => (blob ? URL.createObjectURL(blob) : ""), [blob]);
  const sizeKB = blob ? (blob.size / 1024).toFixed(1) : "0";

  async function ensureReady() {
    if (ready && apiBase) return;
    setWaking(true);
    setStatus("Waking server…");
    try {
      const wake = await wakeServer(); // { starting, healthy?, apiBase }
      setApiBase(wake.apiBase);
      if (!wake.healthy) {
        setStatus("Waiting for health…");
        await waitForHealth(wake.apiBase);
      }
      setReady(true);
      setStatus("Server is ready.");
    } catch (e: any) {
      setReady(false);
      throw e;
    } finally {
      setWaking(false);
    }
  }

  async function upload() {
    if (!blob) return;

    try {
      await ensureReady();
    } catch (e: any) {
      setStatus(`Wake failed: ${e?.message || e}`);
      return;
    }

    setLoading(true);
    setStatus("Uploading & transcribing…");
    setTranscript("—");

    try {
      const form = new FormData();
      form.append("file", blob, `recording.${mimeType.includes("ogg") ? "ogg" : "webm"}`);

      const res = await fetch(`${apiBase.replace(/\/$/, "")}/transcribe`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTranscript(data.text || "(no text)");
      setStatus("Done.");
    } catch (e: any) {
      setStatus("Failed.");
      setTranscript(`Error: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-5">
      <h1 className="text-xl font-semibold mb-3">🎙️ Speech-to-Text (MVP)</h1>

      <div className="space-y-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={start}
            disabled={recording || waking}
            className="px-4 py-2 rounded-lg text-white bg-gray-900 disabled:opacity-50"
          >
            Start Recording
          </button>
          <button
            onClick={stop}
            disabled={!recording}
            className="px-4 py-2 rounded-lg text-white bg-rose-600 disabled:opacity-50"
          >
            Stop
          </button>
          <button
            onClick={clear}
            disabled={!blob}
            className="px-4 py-2 rounded-lg border"
          >
            Clear
          </button>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-gray-600">API Base URL</label>
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="http://accenttranscriber.duckdns.org:8000"
            className="border rounded-lg px-3 py-2"
          />
          {!ready && (
            <button
              onClick={() => ensureReady().catch(e => setStatus(`Wake failed: ${e?.message || e}`))}
              disabled={waking}
              className="px-3 py-2 rounded-lg border w-fit disabled:opacity-50"
            >
              {waking ? "Waking…" : "Wake Server"}
            </button>
          )}
          {ready && <span className="text-xs text-green-600">Ready</span>}
        </div>

        <div>
          <button
            onClick={upload}
            disabled={!blob || loading || !apiBase}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            {loading ? "Processing…" : "Upload & Transcribe"}
          </button>
          <span className="ml-3 text-sm text-gray-500">{status}</span>
        </div>

        <div className="text-sm text-gray-600">
          <strong>Preview</strong>
          <div className="mt-2">
            {blob ? (
              <>
                <audio controls src={audioURL} className="w-full" />
                <div className="text-xs text-gray-500">Type: {mimeType} · Size: {sizeKB} KB</div>
              </>
            ) : (
              <div className="text-gray-400">No recording yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4 mt-4">
        <strong>Transcript</strong>
        <pre className="mt-2 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border">
          {transcript}
        </pre>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Tip: Use HTTPS in production (required for mic on most browsers/iOS). Ensure your API permits CORS from this site.
      </p>
    </div>
  );
}
