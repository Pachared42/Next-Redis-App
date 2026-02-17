import "server-only";
import Redis from "ioredis";

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = Number(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis({
  host,
  port,
  password,
  maxRetriesPerRequest: 2,
  connectTimeout: 3000,
  enableReadyCheck: true,
});

export default redis;
