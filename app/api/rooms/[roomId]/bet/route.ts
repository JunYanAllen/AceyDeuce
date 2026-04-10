import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/redis';
import { popCard, resolveOutcome } from '@/lib/game';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const { playerId, bet } = await req.json();
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.status !== 'active') return NextResponse.json({ error: 'Game not active' }, { status: 400 });
  if (room.phase !== 'betting') return NextResponse.json({ error: 'Not betting phase' }, { status: 400 });

  const current = room.players[room.currentPlayerIdx];
  if (current.id !== playerId)
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 });

  const betAmount = Math.max(0, Math.floor(Number(bet)));
  if (betAmount > current.chips)
    return NextResponse.json({ error: 'Insufficient chips' }, { status: 400 });
  if (betAmount > room.pot && betAmount > 0)
    return NextResponse.json({ error: `Bet exceeds pot (${room.pot})` }, { status: 400 });

  const { pillar1, pillar2 } = room.hand!;
  const [middleCard, newDeck] = popCard(room.deck);
  const { outcome, delta, potDelta } = resolveOutcome(pillar1, pillar2, middleCard, betAmount, room.pot);

  current.chips += delta;
  current.delta = delta;
  room.pot = Math.max(0, room.pot + potDelta);
  room.deck = newDeck;
  room.phase = 'result';
  room.hand = { pillar1, pillar2, middleCard, bet: betAmount, forfeited: false, outcome, delta };

  room.history.unshift({
    roundNum: room.roundNum,
    playerName: current.name,
    pillar1,
    pillar2,
    middleCard,
    bet: betAmount,
    outcome,
    delta,
    potAfter: room.pot,
  });
  if (room.history.length > 50) room.history = room.history.slice(0, 50);

  await saveRoom(room);
  return NextResponse.json({ outcome, delta });
}
