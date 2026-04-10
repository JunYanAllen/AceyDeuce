import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/redis';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const { playerId } = await req.json();
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'betting') return NextResponse.json({ error: 'Not betting phase' }, { status: 400 });

  const current = room.players[room.currentPlayerIdx];
  if (current.id !== playerId)
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 });

  // Forfeit penalty = 1× minBet (capped at chips owned)
  const penalty = Math.min(room.minBet, current.chips);
  current.chips -= penalty;
  current.delta = -penalty;
  room.pot += penalty;
  room.phase = 'result';

  const { pillar1, pillar2 } = room.hand!;
  room.hand = { pillar1, pillar2, middleCard: null, bet: room.minBet, forfeited: true, outcome: 'forfeit', delta: -penalty };

  room.history.unshift({
    roundNum: room.roundNum,
    playerName: current.name,
    pillar1,
    pillar2,
    middleCard: null,
    bet: room.minBet,
    outcome: 'forfeit',
    delta: -penalty,
    potAfter: room.pot,
  });
  if (room.history.length > 50) room.history = room.history.slice(0, 50);

  await saveRoom(room);
  return NextResponse.json({ ok: true });
}
