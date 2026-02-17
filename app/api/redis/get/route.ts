import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "key is required" },
        { status: 400 }
      );
    }

    const value = await redis.get(key);
    return NextResponse.json({ ok: true, key, value });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
