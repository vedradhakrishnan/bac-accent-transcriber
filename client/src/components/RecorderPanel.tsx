"use client";

import React, { useMemo, useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type WakeReply = { starting: boolean; healthy?: boolean; apiBase: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

async function wakeServer(): Promise<WakeReply> {
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
    } catch {
      /* ignore and retry */
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
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
    } catch (e: unknown) {
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
    } catch (e: unknown) {
      setStatus(`Wake failed: ${getErrorMessage(e)}`);
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
      const data = (await res.json()) as { text?: string };
      setTranscript(data.text || "(no text)");
      setStatus("Done.");
    } catch (e: unknown) {
      setStatus("Failed.");
      setTranscript(`Error: ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🎙️ Accented Speech-to-Text (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={start} disabled={recording || waking}>
              Start Recording
            </Button>
            <Button onClick={stop} disabled={!recording} variant="destructive">
              Stop
            </Button>
            <Button onClick={clear} disabled={!blob} variant="outline">
              Clear
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm text-muted-foreground">API Base URL</Label>
            <Input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="http://accenttranscriber.duckdns.org:8000"
            />
            {!ready && (
              <Button
                onClick={() =>
                  ensureReady().catch((e: unknown) =>
                    setStatus(`Wake failed: ${getErrorMessage(e)}`)
                  )
                }
                disabled={waking}
                variant="outline"
                className="w-fit"
              >
                {waking ? "Waking…" : "Wake Server"}
              </Button>
            )}
            {ready && <Badge variant="secondary">Ready</Badge>}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={upload} disabled={!blob || loading || !apiBase} variant="outline">
              {loading ? "Processing…" : "Upload & Transcribe"}
            </Button>
            <span className="text-sm text-muted-foreground">{status}</span>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <strong className="text-foreground">Preview</strong>
            <div>
              {blob ? (
                <>
                  <audio controls src={audioURL} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    Type: {mimeType} · Size: {sizeKB} KB
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground/70">No recording yet.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="mt-1 whitespace-pre-wrap text-sm bg-muted p-3 rounded-md border">
            {transcript}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
