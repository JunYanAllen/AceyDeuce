'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Room, Outcome } from '@/lib/types';
import { CardView } from '@/components/CardView';
import { Scoreboard } from '@/components/Scoreboard';
import { History } from '@/components/History';

const OUTCOME_UI: Record<Outcome, { label: string; css: string }> = {
  win:     { label: '🎉 射中龍門！',         css: 'bg-green-500/20 border-green-500 text-green-300' },
  post:    { label: '💥 撞柱！罰 3 倍',      css: 'bg-orange-500/20 border-orange-500 text-orange-300' },
  range:   { label: '😔 超出範圍，損失押注', css: 'bg-red-500/20 border-red-500 text-red-300' },
  triple:  { label: '🃏 三張相同！罰 3 倍',  css: 'bg-orange-500/20 border-orange-500 text-orange-300' },
  forfeit: { label: '🏳 棄局，罰最低押注',   css: 'bg-gray-500/20 border-gray-500 text-gray-300' },
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState('');
  const [betInput, setBetInput] = useState(50);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState('');
  const prevPhaseRef = useRef<string>('');
  const [resultAnim, setResultAnim] = useState(false);

  // Load saved player ID
  useEffect(() => {
    const pid = localStorage.getItem(`player_${roomId}`);
    if (pid) setMyId(pid);
  }, [roomId]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (res.status === 404) { setPageError('房間不存在或已過期'); return; }
      const data: Room = await res.json();
      setRoom((prev) => {
        if (prev?.phase !== 'result' && data.phase === 'result') {
          setResultAnim(true);
          setTimeout(() => setResultAnim(false), 800);
        }
        prevPhaseRef.current = data.phase;
        return data;
      });
    } catch { /* network hiccup */ }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    const t = setInterval(fetchRoom, 2000);
    return () => clearInterval(t);
  }, [fetchRoom]);

  async function post(path: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '操作失敗'); return false; }
      await fetchRoom();
      return true;
    } finally {
      setBusy(false);
    }
  }

  // ── Error / Loading ──────────────────────────────────────────────
  if (pageError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-xl">{pageError}</p>
        <button onClick={() => router.push('/')}
          className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-xl hover:bg-yellow-300 transition">
          返回大廳
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-yellow-400 text-xl animate-pulse">載入中…</p>
      </div>
    );
  }

  const currentPlayer = room.players[room.currentPlayerIdx];
  const isMyTurn = currentPlayer?.id === myId;
  const isHost = room.hostId === myId;
  const amInRoom = room.players.some((p) => p.id === myId);
  const me = room.players.find((p) => p.id === myId);
  const maxBet = me ? Math.min(me.chips, room.pot) : 0;
  const spread = room.hand ? Math.abs(room.hand.pillar1.value - room.hand.pillar2.value) : 0;

  // ── Helpers ──────────────────────────────────────────────────────
  const inputCls =
    'bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:border-yellow-400 focus:outline-none transition';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="text-center py-4 border-b border-yellow-400/20 bg-black/20 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-yellow-400 tracking-widest">🐉 射龍門</h1>
        <div className="text-xs text-white/40 mt-0.5 space-x-3">
          <span>房間 <span className="text-yellow-300 font-mono font-bold">{roomId}</span></span>
          <span>{room.name}</span>
          {room.status === 'active' && <span>第 {room.roundNum} 輪</span>}
          {!amInRoom && room.status === 'active' && (
            <span className="text-white/25">（觀戰中）</span>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ── WAITING ────────────────────────────────────────────── */}
        {room.status === 'waiting' && (
          <div className="bg-black/30 border border-yellow-400/30 rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-yellow-400 text-xl font-bold">等待玩家加入</h2>
            <p className="text-white/50 text-sm">
              分享房間代碼給朋友：
              <span className="text-yellow-300 font-mono font-bold text-2xl mx-2">{roomId}</span>
            </p>
            <div>
              <p className="text-white/40 text-xs mb-2">已加入 ({room.players.length} / {room.maxPlayers})</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {room.players.map((p) => (
                  <span key={p.id}
                    className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {p.name}
                    {p.id === room.hostId && <span className="text-yellow-400">👑</span>}
                    {p.id === myId && <span className="text-green-400 text-xs">(你)</span>}
                  </span>
                ))}
              </div>
            </div>
            {isHost ? (
              room.players.length >= 2 ? (
                <button onClick={() => post('start')} disabled={busy}
                  className="bg-yellow-400 text-black font-bold px-10 py-3 rounded-xl hover:bg-yellow-300 disabled:opacity-40 transition">
                  ▶ 開始遊戲
                </button>
              ) : (
                <p className="text-white/30 text-sm">至少需要 2 位玩家才能開始</p>
              )
            ) : (
              <p className="text-white/40 text-sm animate-pulse">等待房主開始遊戲…</p>
            )}
          </div>
        )}

        {/* ── ACTIVE ─────────────────────────────────────────────── */}
        {room.status === 'active' && room.hand && (
          <div className="bg-black/30 border border-yellow-400/30 rounded-2xl p-5 space-y-4">

            {/* Current player label */}
            <div className="text-center">
              <span className="text-yellow-400 font-bold text-lg">{currentPlayer?.name} 的回合</span>
              {isMyTurn && <span className="ml-2 text-green-400 text-sm">（你）</span>}
            </div>

            {/* Gate area */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">門柱 1</p>
                <CardView card={room.hand.pillar1} />
              </div>

              <div className="text-white/20 text-3xl font-bold select-none">⚡</div>

              {/* Middle card */}
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">第三張</p>
                {room.phase === 'result' && room.hand.middleCard ? (
                  <div className={resultAnim ? 'animate-fade-in-scale' : ''}>
                    <CardView
                      card={room.hand.middleCard}
                      highlight={room.hand.outcome}
                    />
                  </div>
                ) : (
                  <CardView faceDown />
                )}
              </div>

              <div className="text-white/20 text-3xl font-bold select-none">⚡</div>

              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">門柱 2</p>
                <CardView card={room.hand.pillar2} />
              </div>
            </div>

            {/* Spread info */}
            {room.phase === 'betting' && (
              <div className="text-center space-y-2">
                <p className="text-white/50 text-sm">
                  點數差距：<span className="text-yellow-300 font-bold">{spread}</span>
                </p>
                {spread <= 1 && (
                  <div className="bg-orange-900/30 border border-orange-500/40 rounded-lg px-3 py-2 text-orange-300 text-sm">
                    ⚠ 龍門緊閉！兩柱相鄰或相同，射中機率極低
                  </div>
                )}
              </div>
            )}

            {/* ── Betting controls (my turn) */}
            {room.phase === 'betting' && isMyTurn && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <label className="text-white/60 text-sm">押注金額</label>
                  <input
                    type="number"
                    className={`${inputCls} w-28`}
                    value={betInput}
                    min={0}
                    max={maxBet}
                    onChange={(e) =>
                      setBetInput(Math.max(0, Math.min(maxBet, Number(e.target.value))))
                    }
                  />
                  <span className="text-white/30 text-xs">最多 {maxBet}</span>
                </div>

                {/* Quick-pick chips */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {[room.minBet, room.minBet * 5, room.minBet * 10, Math.floor(maxBet / 2), maxBet]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map((v) => (
                      <button key={v} onClick={() => setBetInput(Math.min(v, maxBet))}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition">
                        {v}
                      </button>
                    ))}
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => post('bet', { bet: betInput })}
                    disabled={busy}
                    className="bg-yellow-400 text-black font-bold px-8 py-2.5 rounded-xl hover:bg-yellow-300 disabled:opacity-40 transition"
                  >
                    🎴 發牌
                  </button>
                  <button
                    onClick={() => post('forfeit')}
                    disabled={busy}
                    className="bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-500 disabled:opacity-40 transition"
                  >
                    🏳 棄局
                  </button>
                </div>
                <p className="text-center text-white/30 text-xs">棄局罰款 {room.minBet} 籌碼</p>
              </div>
            )}

            {/* Waiting for current player */}
            {room.phase === 'betting' && !isMyTurn && (
              <p className="text-center text-white/40 text-sm animate-pulse">
                等待 {currentPlayer?.name} 押注…
              </p>
            )}

            {/* ── Result */}
            {room.phase === 'result' && room.hand.outcome && (
              <div className="space-y-3">
                <div
                  className={`border rounded-xl px-4 py-3 text-center font-bold text-lg animate-fade-in-scale ${
                    OUTCOME_UI[room.hand.outcome].css
                  }`}
                >
                  {OUTCOME_UI[room.hand.outcome].label}
                  <div className="text-base font-normal mt-1">
                    {room.hand.delta > 0 ? (
                      <span className="text-green-400 font-bold">+{room.hand.delta} 籌碼</span>
                    ) : (
                      <span className="text-red-400 font-bold">{room.hand.delta} 籌碼</span>
                    )}
                  </div>
                </div>

                {(isMyTurn || isHost) && (
                  <div className="text-center">
                    <button
                      onClick={() => post('next')}
                      disabled={busy}
                      className="bg-yellow-400 text-black font-bold px-10 py-2.5 rounded-xl hover:bg-yellow-300 disabled:opacity-40 transition"
                    >
                      下一位 →
                    </button>
                  </div>
                )}
                {!isMyTurn && !isHost && (
                  <p className="text-center text-white/30 text-xs animate-pulse">
                    等待 {currentPlayer?.name} 或房主繼續…
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FINISHED ───────────────────────────────────────────── */}
        {room.status === 'finished' && (
          <div className="bg-black/30 border border-yellow-400/30 rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-yellow-400 text-2xl font-bold">🏆 遊戲結束</h2>
            <div className="space-y-2">
              {[...room.players]
                .sort((a, b) => b.chips - a.chips)
                .map((p, i) => (
                  <div key={p.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                    <span className="font-bold">
                      {['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} {p.name}
                      {p.id === myId && <span className="text-yellow-400 ml-1 text-sm">(你)</span>}
                    </span>
                    <span className="text-yellow-300">{p.chips.toLocaleString()} 籌碼</span>
                  </div>
                ))}
            </div>
            <button onClick={() => router.push('/')}
              className="bg-yellow-400 text-black font-bold px-10 py-3 rounded-xl hover:bg-yellow-300 transition">
              返回大廳
            </button>
          </div>
        )}

        {/* End-game button (host, active game) */}
        {room.status === 'active' && isHost && (
          <div className="flex justify-end">
            <button
              onClick={() => { if (confirm('確定結束遊戲？')) post('end'); }}
              className="text-xs bg-red-800/60 hover:bg-red-700 text-red-200 px-4 py-2 rounded-lg transition"
            >
              結束遊戲
            </button>
          </div>
        )}

        {/* Scoreboard */}
        {(room.status === 'active' || room.status === 'finished') && (
          <Scoreboard
            players={room.players}
            currentPlayerIdx={room.currentPlayerIdx}
            pot={room.pot}
            myPlayerId={myId}
          />
        )}

        {/* History */}
        {room.history.length > 0 && <History history={room.history} />}
      </div>
    </div>
  );
}
