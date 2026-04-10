import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/redis';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const { playerId } = await req.json();
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const isHost = room.hostId === playerId;
  const isInRoom = room.players.some((p) => p.id === playerId);
  if (!isHost && !isInRoom)
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  room.status = 'finished';
  await saveRoom(room);
  return NextResponse.json({ ok: true });
}
