import { Redis } from '@upstash/redis';
import type { Room } from './types';

/**
 * Lazy Redis client — supports both Upstash native env vars and
 * Vercel KV integration env vars so either naming convention works.
 *
 *   Upstash native:  UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   Vercel KV:       KV_REST_API_URL        + KV_REST_API_TOKEN
 */
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Redis env vars not set. ' +
      'Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN ' +
      '(or KV_REST_API_URL + KV_REST_API_TOKEN for Vercel KV) to your environment.',
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const ROOM_TTL = 60 * 60 * 6; // 6 hours
const ROOM_LIST_KEY = 'room_list';

export async function getRoom(roomId: string): Promise<Room | null> {
  return getRedis().get<Room>(`room:${roomId}`);
}

export async function saveRoom(room: Room): Promise<void> {
  await getRedis().set(`room:${room.id}`, room, { ex: ROOM_TTL });
}

export async function listRoomIds(): Promise<string[]> {
  const ids = await getRedis().smembers(ROOM_LIST_KEY);
  return (ids ?? []) as string[];
}

export async function registerRoom(roomId: string): Promise<void> {
  await getRedis().sadd(ROOM_LIST_KEY, roomId);
  await getRedis().expire(ROOM_LIST_KEY, ROOM_TTL);
}

export async function removeRoom(roomId: string): Promise<void> {
  await getRedis().srem(ROOM_LIST_KEY, roomId);
  await getRedis().del(`room:${roomId}`);
}
