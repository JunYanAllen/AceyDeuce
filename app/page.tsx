'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RoomSummary } from '@/lib/types';

export default function LobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Create-room form
  const [roomName, setRoomName] = useState('');
  const [createName, setCreateName] = useState('');
  const [chips, setChips] = useState(1000);
  const [minBet, setMinBet] = useState(10);
  const [creating, setCreating] = useState(false);

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchRooms();
    const t = setInterval(fetchRooms, 3000);
    return () => clearInterval(t);
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) setRooms(await res.json());
    } finally {
      setLoadingRooms(false);
    }
  }

  async function createRoom() {
    if (!roomName.trim() || !createName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName, playerName: createName, chips, minBet }),
      });
      // Guard against non-JSON responses (e.g. Vercel error pages)
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        alert(`伺服器錯誤 (HTTP ${res.status})，請確認 Redis 環境變數已正確設定`);
        return;
      }
      const data = await res.json();
      if (data.roomId) {
        localStorage.setItem(`player_${data.roomId}`, data.playerId);
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.error || '建立失敗');
      }
    } catch (e) {
      alert('網路錯誤，請稍後再試');
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  async function joinRoom(roomId: string) {
    if (!joinName.trim()) { alert('請輸入名字'); return; }
    setJoining(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: joinName }),
      });
      const data = await res.json();
      if (data.playerId) {
        localStorage.setItem(`player_${roomId}`, data.playerId);
        router.push(`/room/${roomId}`);
      } else {
        alert(data.error || '加入失敗');
      }
    } finally {
      setJoining(false);
    }
  }

  const inputCls =
    'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-yellow-400 focus:outline-none transition';
  const labelCls = 'text-xs text-white/50 block mb-1';

  return (
    <div className="min-h-screen">
      <header className="text-center py-10 border-b border-yellow-400/20 bg-black/20">
        <h1 className="text-5xl font-bold text-yellow-400 tracking-widest drop-shadow-lg">🐉 射龍門</h1>
        <p className="text-white/40 mt-2 text-sm tracking-wider">Dragon Gate · Acey-Deucey · 多人連線版</p>
      </header>

      <div className="max-w-4xl mx-auto p-5 grid md:grid-cols-2 gap-5 mt-6">
        {/* Create Room */}
        <div className="bg-black/30 border border-yellow-400/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-yellow-400 font-bold text-lg">建立新房間</h2>
          <div>
            <label className={labelCls}>房間名稱</label>
            <input className={inputCls} placeholder="例：週五鬥地主" value={roomName}
              onChange={(e) => setRoomName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>你的名字</label>
            <input className={inputCls} placeholder="玩家名稱" value={createName}
              onChange={(e) => setCreateName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>起始籌碼</label>
              <input type="number" className={inputCls} value={chips} min={100}
                onChange={(e) => setChips(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>最低押注 (棄局罰款)</label>
              <input type="number" className={inputCls} value={minBet} min={1}
                onChange={(e) => setMinBet(Number(e.target.value))} />
            </div>
          </div>
          <button
            onClick={createRoom}
            disabled={creating || !roomName.trim() || !createName.trim()}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 disabled:opacity-40 transition"
          >
            {creating ? '建立中…' : '▶ 建立房間'}
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-black/30 border border-yellow-400/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-yellow-400 font-bold text-lg">加入房間</h2>
          <div>
            <label className={labelCls}>房間代碼</label>
            <input className={inputCls} placeholder="6 位代碼" maxLength={6}
              value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>你的名字</label>
            <input className={inputCls} placeholder="玩家名稱" value={joinName}
              onChange={(e) => setJoinName(e.target.value)} />
          </div>
          <button
            onClick={() => joinRoom(joinCode)}
            disabled={joining || !joinCode.trim() || !joinName.trim()}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-500 disabled:opacity-40 transition"
          >
            {joining ? '加入中…' : '→ 加入房間'}
          </button>

          {/* Room list */}
          <div className="pt-2">
            <p className="text-white/40 text-xs mb-2">開放中的房間</p>
            {loadingRooms ? (
              <p className="text-white/30 text-sm animate-pulse">載入中…</p>
            ) : rooms.length === 0 ? (
              <p className="text-white/30 text-sm">目前沒有開放房間</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll">
                {rooms.map((r) => (
                  <div key={r.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 text-sm">
                    <div>
                      <div className="font-bold">{r.name}</div>
                      <div className="text-white/40 text-xs font-mono">{r.id} · {r.playerCount}/{r.maxPlayers}人</div>
                    </div>
                    <button
                      onClick={() => setJoinCode(r.id)}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition"
                    >
                      選擇
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="max-w-4xl mx-auto px-5 pb-8 mt-2">
        <div className="bg-black/20 border border-white/10 rounded-2xl p-5 text-sm text-white/60 grid sm:grid-cols-2 gap-x-8 gap-y-1">
          <h3 className="text-yellow-400 font-bold col-span-full mb-2">遊戲規則</h3>
          <p>✅ 射中龍門（第三張在兩柱之間）→ 贏得押注</p>
          <p>💥 撞柱（第三張等於任一門柱）→ 罰 3 倍押注</p>
          <p>🃏 三張相同 → 罰 3 倍押注</p>
          <p>📉 超出範圍（超出門柱外）→ 損失押注</p>
          <p>🏳 棄局 → 罰最低押注金額</p>
          <p>🃏 使用三副撲克牌（156 張）</p>
        </div>
      </div>
    </div>
  );
}
