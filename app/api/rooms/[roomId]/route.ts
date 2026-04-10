import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/redis';

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const room = await getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json(room);
}
