import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://accenttranscriber.duckdns.org:8000").replace(/\/$/, "");

export async function GET() {
  try {
    const r = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "proxy failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
