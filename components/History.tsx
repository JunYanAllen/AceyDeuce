'use client';

import type { HistoryEntry } from '@/lib/types';

interface HistoryProps {
  history: HistoryEntry[];
}

const LABELS: Record<string, { text: string; cls: string }> = {
  win:     { text: '射中',  cls: 'text-green-400' },
  post:    { text: '撞柱',  cls: 'text-orange-400' },
  range:   { text: '超出',  cls: 'text-red-400' },
  triple:  { text: '三同',  cls: 'text-orange-400' },
  forfeit: { text: '棄局',  cls: 'text-gray-400' },
};

function cardSpan(suit: string, rank: string) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <span style={{ color: isRed ? '#f87171' : '#d1d5db' }}>
      {rank}{suit}
    </span>
  );
}

export function History({ history }: HistoryProps) {
  if (!history.length) return null;

  return (
    <div className="bg-black/30 border border-yellow-400/30 rounded-xl p-4">
      <h2 className="text-yellow-400 font-bold mb-3 pb-2 border-b border-yellow-400/30">歷史記錄</h2>
      <div className="max-h-64 overflow-y-auto custom-scroll space-y-1">
        {history.map((h, i) => {
          const lbl = LABELS[h.outcome] ?? { text: h.outcome, cls: 'text-white' };
          return (
            <div
              key={i}
              className="flex items-center gap-2 text-xs bg-white/5 rounded px-2 py-1.5 flex-wrap"
            >
              <span className="text-white/40 w-7">R{h.roundNum}</span>
              <span className="font-bold w-16 truncate">{h.playerName}</span>
              <span className="font-mono flex items-center gap-0.5">
                {cardSpan(h.pillar1.suit, h.pillar1.rank)}
                <span className="text-white/30 mx-0.5">⚡</span>
                {cardSpan(h.pillar2.suit, h.pillar2.rank)}
                {h.middleCard && (
                  <>
                    <span className="text-white/30 mx-0.5">→</span>
                    {cardSpan(h.middleCard.suit, h.middleCard.rank)}
                  </>
                )}
              </span>
              <span className="text-white/40">押{h.bet}</span>
              <span className={`ml-auto font-bold ${lbl.cls}`}>
                {lbl.text} {h.delta > 0 ? `+${h.delta}` : h.delta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
