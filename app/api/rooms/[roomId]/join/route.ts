import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/redis';
import { generateId } from '@/lib/game';
import type { Player } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'waiting')
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  if (room.players.length >= room.maxPlayers)
    return NextResponse.json({ error: 'Room is full' }, { status: 400 });

  const { playerName, chips } = await req.json();
  if (!playerName?.trim())
    return NextResponse.json({ error: 'playerName is required' }, { status: 400 });

  const playerId = generateId(12);
  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    chips: Math.max(100, Number(chips) || 1000),
    delta: 0,
    isActive: true,
  };

  room.players.push(player);
  await saveRoom(room);

  return NextResponse.json({ playerId });
}
