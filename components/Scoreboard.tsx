'use client';

import type { Player } from '@/lib/types';

interface ScoreboardProps {
  players: Player[];
  currentPlayerIdx: number;
  pot: number;
  myPlayerId: string;
}

export function Scoreboard({ players, currentPlayerIdx, pot, myPlayerId }: ScoreboardProps) {
  const sorted = [...players].map((p, origIdx) => ({ ...p, origIdx })).sort((a, b) => b.chips - a.chips);

  return (
    <div className="bg-black/30 border border-yellow-400/30 rounded-xl p-4">
      <h2 className="text-yellow-400 font-bold mb-3 pb-2 border-b border-yellow-400/30 flex justify-between items-center">
        <span>計分板</span>
        <span className="text-sm font-normal text-white/60">
          公池：<span className="text-yellow-300 font-bold">{pot.toLocaleString()}</span> 籌碼
        </span>
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-yellow-400 text-left text-xs">
            <th className="py-1 px-2">#</th>
            <th className="py-1 px-2">玩家</th>
            <th className="py-1 px-2 text-right">籌碼</th>
            <th className="py-1 px-2 text-right">增減</th>
            <th className="py-1 px-2 text-center">狀態</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, rank) => {
            const isCurrentTurn = p.origIdx === currentPlayerIdx;
            const isMe = p.id === myPlayerId;
            const isBroke = p.chips <= 0;
            return (
              <tr
                key={p.id}
                className={`border-t border-white/10 transition-colors ${
                  isCurrentTurn ? 'bg-yellow-400/10' : ''
                } ${isBroke ? 'opacity-40' : ''}`}
              >
                <td className="py-1.5 px-2 text-white/50">{rank + 1}</td>
                <td className="py-1.5 px-2 font-bold">
                  {p.name}
                  {isMe && <span className="ml-1 text-yellow-300 text-xs">(你)</span>}
                </td>
                <td className="py-1.5 px-2 text-right">{p.chips.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right">
                  {p.delta > 0 ? (
                    <span className="text-green-400 font-bold">+{p.delta}</span>
                  ) : p.delta < 0 ? (
                    <span className="text-red-400 font-bold">{p.delta}</span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-center text-xs">
                  {isBroke ? '💸 破產' : isCurrentTurn ? '🎯 當前' : '✅'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
