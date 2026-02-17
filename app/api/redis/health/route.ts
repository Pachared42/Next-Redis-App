import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export const runtime = "nodejs";

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRedisInfo(infoText: string) {
  // INFO เป็นรูปแบบ key:value
  const map: Record<string, string> = {};
  for (const line of infoText.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf(":");
    if (idx === -1) continue;
    const k = t.slice(0, idx);
    const v = t.slice(idx + 1);
    map[k] = v;
  }
  return map;
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const [pong, infoText, dbsize] = await Promise.all([
      redis.ping(),
      redis.info(),
      redis.dbsize(),
    ]);

    const info = parseRedisInfo(infoText);

    // คำนวณเป็นหน่วยอ่านง่าย
    const usedMemory = toNum(info.used_memory);
    const usedMemoryHuman = info.used_memory_human || null;

    const uptimeSec = toNum(info.uptime_in_seconds);
    const connectedClients = toNum(info.connected_clients);

    // Docker heuristic: ถ้าใช้ host=redis / container name มักจะเป็น docker network
    const host = process.env.REDIS_HOST || "127.0.0.1";
    const dockerHint =
      host === "redis" || host.includes("docker") || host.includes("container");

    return NextResponse.json({
      ok: pong === "PONG",
      ping: pong,
      latencyMs: Date.now() - startedAt,
      connection: {
        host,
        port: Number(process.env.REDIS_PORT || 6379),
        auth: Boolean(process.env.REDIS_PASSWORD),
        dockerHint, // เป็น “การเดา” จาก host เท่านั้น
      },
      stats: {
        keys: dbsize,
        usedMemory,
        usedMemoryHuman,
        uptimeSec,
        connectedClients,
        redisVersion: info.redis_version || null,
        os: info.os || null,
        mode: info.redis_mode || null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
        connection: {
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: Number(process.env.REDIS_PORT || 6379),
          auth: Boolean(process.env.REDIS_PASSWORD),
          dockerHint: false,
        },
      },
      { status: 500 }
    );
  }
}
