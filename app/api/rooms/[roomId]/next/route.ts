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
  if (room.phase !== 'result') return NextResponse.json({ error: 'Not result phase' }, { status: 400 });

  // Only current player or host can advance
  const isCurrentPlayer = room.players[room.currentPlayerIdx]?.id === playerId;
  const isHost = room.hostId === playerId;
  if (!isCurrentPlayer && !isHost)
    return NextResponse.json({ error: 'Only current player or host can advance' }, { status: 403 });

  // Reset delta for current player
  room.players[room.currentPlayerIdx].delta = 0;

  // Advance index, increment round when we wrap
  const total = room.players.length;
  const rawNext = room.currentPlayerIdx + 1;
  if (rawNext >= total) room.roundNum++;
  let nextIdx = rawNext % total;

  // Skip broke players
  for (let i = 0; i < total; i++) {
    if (room.players[nextIdx].chips > 0) break;
    nextIdx = (nextIdx + 1) % total;
  }

  // Check if game should end (≤1 active player)
  const active = room.players.filter((p) => p.chips > 0);
  if (active.length <= 1) {
    room.status = 'finished';
    room.phase = 'waiting';
    await saveRoom(room);
    return NextResponse.json({ finished: true });
  }

  // Deal new pillars
  const [p1, deck1] = popCard(room.deck);
  const [p2, deck2] = popCard(deck1);

  room.currentPlayerIdx = nextIdx;
  room.deck = deck2;
  room.phase = 'betting';
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
  return NextResponse.json({ finished: false });
}
