import { NextRequest, NextResponse } from "next/server";

const WAKE_URL = process.env.WAKE_URL!; // your Lambda Function URL or API Gateway URL

export async function POST(_req: NextRequest) {
  try {
    const r = await fetch(WAKE_URL, { method: "POST" });
    const text = await r.text(); // pass through body as-is
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Wake proxy failed" }, { status: 500 });
  }
}
