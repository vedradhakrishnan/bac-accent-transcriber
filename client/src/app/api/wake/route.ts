import { NextResponse } from "next/server";

const WAKE_URL = process.env.WAKE_URL!; // Lambda Function URL or API Gateway URL

export async function POST() {
  try {
    const r = await fetch(WAKE_URL, { method: "POST" });
    const text = await r.text(); // pass through body as-is
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: unknown) {
    let message = "Wake proxy failed";
    if (e instanceof Error) {
      message = e.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
