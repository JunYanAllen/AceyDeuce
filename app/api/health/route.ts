import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/** GET /api/health — verifies Redis connectivity. */
export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  checks.REDIS_URL = url ? `✅ set (${url.substring(0, 30)}…)` : '❌ missing';
  checks.REDIS_TOKEN = token ? '✅ set' : '❌ missing';

  if (!url || !token) {
    return NextResponse.json({ ok: false, checks }, { status: 500 });
  }

  // Ping Redis
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    checks.redis_ping = pong === 'PONG' ? '✅ PONG' : `⚠ ${pong}`;
    return NextResponse.json({ ok: true, checks });
  } catch (err: unknown) {
    checks.redis_ping = `❌ ${err instanceof Error ? err.message : String(err)}`;
    return NextResponse.json({ ok: false, checks }, { status: 500 });
  }
}
