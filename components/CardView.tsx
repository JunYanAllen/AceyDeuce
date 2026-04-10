'use client';

import type { Card, Outcome } from '@/lib/types';

interface CardViewProps {
  card?: Card | null;
  faceDown?: boolean;
  size?: 'sm' | 'md';
  highlight?: Outcome | null;
}

export function CardView({ card, faceDown, size = 'md', highlight }: CardViewProps) {
  const dim = size === 'sm' ? 'w-14 h-20' : 'w-20 h-28';

  if (!card || faceDown) {
    return (
      <div
        className={`${dim} rounded-lg border-2 border-blue-800 shadow-lg flex-shrink-0`}
        style={{
          background: '#1a5276',
          backgroundImage:
            'repeating-linear-gradient(45deg,rgba(255,255,255,0.07) 0px,rgba(255,255,255,0.07) 2px,transparent 2px,transparent 8px)',
        }}
      />
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  const ringClass =
    highlight === 'win'
      ? 'ring-4 ring-green-400'
      : highlight === 'post' || highlight === 'triple'
      ? 'ring-4 ring-orange-400'
      : highlight === 'range'
      ? 'ring-4 ring-red-400'
      : '';

  return (
    <div
      className={`${dim} ${ringClass} rounded-lg border-2 border-gray-300 shadow-lg flex flex-col justify-between p-1 flex-shrink-0 animate-fade-in-scale`}
      style={{ background: '#FFFDF0', fontFamily: 'Georgia, serif' }}
    >
      <div className={`text-xs font-bold leading-tight ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
      <div className={`text-2xl text-center ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suit}
      </div>
      <div
        className={`text-xs font-bold leading-tight self-end rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}
      >
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    </div>
  );
}
