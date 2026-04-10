import { Redis } from '@upstash/redis';
import type { Room } from './types';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ROOM_TTL = 60 * 60 * 6; // 6 hours
const ROOM_LIST_KEY = 'room_list';

export async function getRoom(roomId: string): Promise<Room | null> {
  return redis.get<Room>(`room:${roomId}`);
}

export async function saveRoom(room: Room): Promise<void> {
  await redis.set(`room:${room.id}`, room, { ex: ROOM_TTL });
}

export async function listRoomIds(): Promise<string[]> {
  const ids = await redis.smembers(ROOM_LIST_KEY);
  return (ids ?? []) as string[];
}

export async function registerRoom(roomId: string): Promise<void> {
  await redis.sadd(ROOM_LIST_KEY, roomId);
  await redis.expire(ROOM_LIST_KEY, ROOM_TTL);
}

export async function removeRoom(roomId: string): Promise<void> {
  await redis.srem(ROOM_LIST_KEY, roomId);
  await redis.del(`room:${roomId}`);
}
