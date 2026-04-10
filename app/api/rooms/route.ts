import { NextRequest, NextResponse } from 'next/server';
import { getRoom, listRoomIds, registerRoom, saveRoom } from '@/lib/redis';
import { buildDeck, shuffleDeck, generateId } from '@/lib/game';
import type { Player, Room } from '@/lib/types';

export async function GET() {
  try {
    const ids = await listRoomIds();
    const rooms = await Promise.all(ids.map((id) => getRoom(id)));
    const summaries = rooms
      .filter(Boolean)
      .filter((r) => r!.status !== 'finished')
      .map((r) => ({
        id: r!.id,
        name: r!.name,
        status: r!.status,
        playerCount: r!.players.length,
        maxPlayers: r!.maxPlayers,
        createdAt: r!.createdAt,
      }));
    return NextResponse.json(summaries);
  } catch {
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, playerName, chips = 1000, minBet = 10, maxPlayers = 8 } = body;

    if (!name?.trim() || !playerName?.trim()) {
      return NextResponse.json({ error: 'name and playerName are required' }, { status: 400 });
    }

    const roomId = generateId(6);
    const playerId = generateId(12);

    const host: Player = {
      id: playerId,
      name: playerName.trim(),
      chips: Math.max(100, Number(chips)),
      delta: 0,
      isActive: true,
    };

    const room: Room = {
      id: roomId,
      name: name.trim(),
      hostId: playerId,
      status: 'waiting',
      players: [host],
      deck: shuffleDeck(buildDeck()),
      pot: 0,
      currentPlayerIdx: 0,
      roundNum: 1,
      phase: 'waiting',
      hand: null,
      history: [],
      minBet: Math.max(1, Number(minBet)),
      maxPlayers: Math.min(8, Math.max(2, Number(maxPlayers))),
      createdAt: Date.now(),
    };

    await saveRoom(room);
    await registerRoom(roomId);

    return NextResponse.json({ roomId, playerId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/rooms]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
