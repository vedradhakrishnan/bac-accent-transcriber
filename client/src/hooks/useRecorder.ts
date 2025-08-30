import { useRef, useState } from "react";

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  function isTypeSupportedSafe(t: string): boolean {
    // Some browsers (older Safari) may not implement the static
    // MediaRecorder.isTypeSupported; guard it safely.
    const maybe = (globalThis as unknown as {
      MediaRecorder?: { isTypeSupported?: (mt: string) => boolean };
    }).MediaRecorder;
    return typeof maybe?.isTypeSupported === "function" ? !!maybe.isTypeSupported(t) : false;
  }

  async function start(): Promise<void> {
    setBlob(null);

    // Must be HTTPS in browsers/iOS for mic access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4", // some Safari versions
    ];

    const chosen =
      candidates.find((t) => isTypeSupportedSafe(t)) ?? "audio/webm";
    setMimeType(chosen);

    const mr = new MediaRecorder(stream, { mimeType: chosen });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const b = new Blob(chunksRef.current, { type: chosen });
      setBlob(b);
      setRecording(false);
    };

    mr.start();
    setRecording(true);
  }

  function stop(): void {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }

  function clear(): void {
    setBlob(null);
  }

  return { start, stop, clear, blob, mimeType, recording };
}
