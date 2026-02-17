import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      key?: string;
      value?: string;
      ttlSec?: number;
    };

    const key = (body.key || "").trim();
    const value = body.value ?? "";
    const ttlSec = Number(body.ttlSec ?? 0);

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "key is required" },
        { status: 400 }
      );
    }

    if (ttlSec > 0) {
      await redis.set(key, value, "EX", ttlSec);
    } else {
      await redis.set(key, value);
    }

    return NextResponse.json({
      ok: true,
      key,
      ttlSec: ttlSec > 0 ? ttlSec : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
