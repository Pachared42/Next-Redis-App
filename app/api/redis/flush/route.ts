import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export const runtime = "nodejs";

export async function POST() {
  try {
    await redis.flushdb();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
