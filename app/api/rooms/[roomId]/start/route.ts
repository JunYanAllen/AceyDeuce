import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/redis';
import { popCard } from '@/lib/game';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const { playerId } = await req.json();
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.hostId !== playerId)
    return NextResponse.json({ error: 'Only the host can start' }, { status: 403 });
  if (room.status !== 'waiting')
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  if (room.players.length < 2)
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });

  let deck = room.deck;
  const [p1, deck1] = popCard(deck);
  const [p2, deck2] = popCard(deck1);

  room.status = 'active';
  room.phase = 'betting';
  room.deck = deck2;
  room.currentPlayerIdx = 0;
  room.roundNum = 1;
  room.hand = {
    pillar1: p1,
    pillar2: p2,
    middleCard: null,
    bet: 0,
    forfeited: false,
    outcome: null,
    delta: 0,
  };

  await saveRoom(room);
  return NextResponse.json({ ok: true });
}
