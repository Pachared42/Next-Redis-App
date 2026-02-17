"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type HealthPayload = {
  ok: boolean;
  ping?: string;
  latencyMs?: number;
  error?: string;
  connection: {
    host: string;
    port: number;
    auth: boolean;
    dockerHint: boolean;
  };
  stats?: {
    keys: number;
    usedMemory: number | null;
    usedMemoryHuman: string | null;
    uptimeSec: number | null;
    connectedClients: number | null;
    redisVersion: string | null;
    os: string | null;
    mode: string | null;
  };
};

function formatUptime(sec: number | null | undefined) {
  if (!sec || sec < 0) return "-";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (d > 0) return `${d} วัน ${h} ชม. ${m} นาที`;
  if (h > 0) return `${h} ชม. ${m} นาที ${s} วิ`;
  if (m > 0) return `${m} นาที ${s} วิ`;
  return `${s} วิ`;
}

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function RedisDashboard() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // controls
  const [polling, setPolling] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1500);

  const [key, setKey] = useState("Redis Test");
  const [value, setValue] = useState("Hello Redis");
  const [ttlSec, setTtlSec] = useState<number>(30);

  const [readValue, setReadValue] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string>("");

  const status = useMemo(() => {
    if (!health) return { label: "กำลังโหลด", tone: "zinc" as const };
    if (health.ok) return { label: "เชื่อมต่อแล้ว", tone: "emerald" as const };
    return { label: "ตัดการเชื่อมต่อ", tone: "rose" as const };
  }, [health]);

  async function fetchHealth() {
    try {
      const res = await fetch("/api/redis/health", { cache: "no-store" });
      const data = (await res.json()) as HealthPayload;
      setHealth(data);
    } catch (e) {
      setHealth({
        ok: false,
        error: String(e),
        connection: { host: "-", port: 0, auth: false, dockerHint: false },
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const t = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(t);
  }, [polling, intervalMs]);

  async function onSet() {
    setActionMsg("");
    try {
      const res = await fetch("/api/redis/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, ttlSec }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "set failed");
      setActionMsg(
        `✅ บันทึก "${key}" ${ttlSec > 0 ? `(หมดอายุ ${ttlSec} วิ)` : ""}`
      );
      await fetchHealth();
    } catch (e) {
      setActionMsg(`❌ ${String(e)}`);
    }
  }

  async function onGet() {
    setActionMsg("");
    try {
      const res = await fetch(`/api/redis/get?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "get failed");
      setReadValue(data.value);
      setActionMsg(`✅ ดึงข้อมูล "${key}"`);
      await fetchHealth();
    } catch (e) {
      setActionMsg(`❌ ${String(e)}`);
    }
  }

  async function onFlush() {
    setActionMsg("");
    const ok = confirm("ล้าง DB จะลบ key ทั้งหมดใน Redis DB นี้ แน่ใจไหม?");
    if (!ok) return;

    try {
      const res = await fetch("/api/redis/flush", { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "flush failed");
      setReadValue(null);
      setActionMsg("✅ ล้าง DB สำเร็จ");
      await fetchHealth();
    } catch (e) {
      setActionMsg(`❌ ${String(e)}`);
    }
  }

  const toneRing =
    status.tone === "emerald"
      ? "ring-emerald-400/40"
      : status.tone === "rose"
      ? "ring-rose-400/40"
      : "ring-zinc-400/40";

  const toneBadge =
    status.tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status.tone === "rose"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";

  const glow =
    status.tone === "emerald"
      ? "shadow-[0_0_80px_-30px_rgba(16,185,129,0.55)]"
      : status.tone === "rose"
      ? "shadow-[0_0_80px_-30px_rgba(244,63,94,0.55)]"
      : "shadow-[0_0_80px_-30px_rgba(161,161,170,0.35)]";

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_20%,rgba(99,102,241,0.22),transparent_45%),radial-gradient(900px_circle_at_80%_30%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(900px_circle_at_50%_90%,rgba(244,63,94,0.12),transparent_55%)] bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-362.5 px-6 py-14">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-4 text-3xl items-center font-semibold tracking-tight">
              แดชบอร์ดทดสอบ Redis
              <Image
                src="/redis.svg"
                alt="Redis"
                width={32}
                height={32}
                className="inline-block ml-2 -mb-1"
              />
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              ทดสอบสถานะแบบเรียลไทม์ • INFO • คำสั่ง (บันทึก/ดึง/ล้าง)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPolling((v) => !v)}
              className={classNames(
                "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10 cursor-pointer",
                polling && "ring-1 ring-white/20"
              )}
            >
              {polling ? "หยุดเรียลไทม์" : "เริ่มเรียลไทม์"}
            </button>

            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none hover:bg-white/10 cursor-pointer"
            >
              <option className="bg-zinc-900 text-zinc-100" value={800}>
                0.8 วิ
              </option>
              <option className="bg-zinc-900 text-zinc-100" value={1500}>
                1.5 วิ
              </option>
              <option className="bg-zinc-900 text-zinc-100" value={2500}>
                2.5 วิ
              </option>
              <option className="bg-zinc-900 text-zinc-100" value={5000}>
                5 วิ
              </option>
            </select>

            <button
              onClick={fetchHealth}
              className="rounded-xl bg-indigo-500/90 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 cursor-pointer"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Status Card */}
          <div
            className={classNames(
              "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl",
              "ring-1",
              toneRing,
              glow
            )}
          >
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className={classNames(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                    toneBadge
                  )}
                >
                  <span
                    className={classNames(
                      "h-2 w-2 rounded-full",
                      status.tone === "emerald"
                        ? "bg-emerald-400"
                        : status.tone === "rose"
                        ? "bg-rose-400"
                        : "bg-zinc-400"
                    )}
                  />
                  {status.label}
                </div>

                <h2 className="mt-4 text-lg font-semibold">การเชื่อมต่อ</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {health?.connection?.host}:{health?.connection?.port}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-400">ความหน่วง</span>
                    <span>{health?.latencyMs ?? "-"} ms</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-400">การยืนยันตัวตน</span>
                    <span>
                      {health?.connection?.auth ? "เปิดใช้งาน" : "ไม่มี"}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-400">Docker (เดา)</span>
                    <span>
                      {health?.connection?.dockerHint
                        ? "น่าจะใช่"
                        : "ไม่แน่ใจ/Local"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-zinc-500">PING</div>
                <div className="mt-1 text-2xl font-bold">
                  {loading ? "…" : health?.ping ?? "—"}
                </div>
              </div>
            </div>

            {!health?.ok && health?.error ? (
              <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
                {health.error}
              </div>
            ) : null}
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold">ข้อมูล Redis</h2>
            <p className="mt-1 text-sm text-zinc-400">ค่าจาก INFO + DBSIZE</p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat label="จำนวนคีย์" value={health?.stats?.keys ?? "-"} />
              <Stat
                label="จำนวนผู้เชื่อมต่อ"
                value={health?.stats?.connectedClients ?? "-"}
              />
              <Stat
                label="หน่วยความจำ"
                value={health?.stats?.usedMemoryHuman ?? "-"}
              />
              <Stat
                label="เวลาทำงาน"
                value={formatUptime(health?.stats?.uptimeSec)}
              />
            </div>

            <div className="mt-6 space-y-2 text-sm text-zinc-300">
              <Row
                label="เวอร์ชัน"
                value={health?.stats?.redisVersion ?? "-"}
              />
              <Row label="โหมด" value={health?.stats?.mode ?? "-"} />
              <Row
                label="ระบบปฏิบัติการ"
                value={(health?.stats?.os || "-").slice(0, 42)}
              />
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold">คำสั่ง</h2>
            <p className="mt-1 text-sm text-zinc-400">
              บันทึก / ดึงข้อมูล / ล้าง DB
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs text-zinc-400">คีย์ (Key)</label>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400/40"
                  placeholder="เช่น test"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">ค่า (Value)</label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400/40"
                  placeholder="เช่น hello redis"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-400">
                    อายุข้อมูล (TTL วินาที)
                  </label>
                  <input
                    type="number"
                    value={ttlSec}
                    onChange={(e) => setTtlSec(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400/40"
                    min={0}
                  />
                </div>
                <div className="pt-6 text-xs text-zinc-500">0 = ไม่หมดอายุ</div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-3">
                <button
                  onClick={onSet}
                  className="rounded-xl bg-emerald-500/90 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 cursor-pointer"
                >
                  บันทึก
                </button>
                <button
                  onClick={onGet}
                  className="rounded-xl bg-indigo-500/90 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 cursor-pointer"
                >
                  ดึงข้อมูล
                </button>
                <button
                  onClick={onFlush}
                  className="rounded-xl bg-rose-500/90 py-2 text-sm font-medium text-white transition hover:bg-rose-500 cursor-pointer"
                >
                  ล้างข้อมูล
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    ค่าล่าสุดที่ดึงได้ (GET)
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div className="mt-2 break-all font-mono text-sm text-zinc-200">
                  {readValue === null ? "—" : String(readValue)}
                </div>
              </div>

              {actionMsg ? (
                <div className="text-sm text-zinc-200">{actionMsg}</div>
              ) : (
                <div className="text-sm text-zinc-500">
                  ทิป: กด “บันทึก” แล้วค่อยกด “ดึงข้อมูล” เพื่อดูค่าที่เก็บ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-xs text-zinc-500">
          * สถานะ Docker เป็นการ “เดา” จากค่า{" "}
          <code className="text-zinc-300">REDIS_HOST</code> (เช่น{" "}
          <code className="text-zinc-300">redis</code>) ไม่ได้ตรวจ Docker daemon
          จริง
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-zinc-400">{label}</div>
      <div className="max-w-[65%] truncate text-right text-zinc-200">
        {value}
      </div>
    </div>
  );
}
