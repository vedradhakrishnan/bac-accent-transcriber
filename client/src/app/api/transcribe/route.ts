import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://accenttranscriber.duckdns.org:8000").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const r = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: form });
    const text = await r.text(); // pass-through
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "proxy failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
