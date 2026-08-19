import React, { useState } from 'react';
import { Card, CardColor, Player } from '../types';
import { UnoCard } from './UnoCard';
import { isValidCardPlay } from '../utils/deck';
import { Flame, ArrowUpDown, User, Crown, Sparkles } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isCurrentTurn: boolean;
  currentCard: Card | null;
  activeColor: CardColor;
  onPlayCard: (cardId: string) => void;
  onCallUno: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentTurn,
  currentCard,
  activeColor,
  onPlayCard,
  onCallUno,
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'color' | 'value'>('default');

  const cardItems = (player.hand || []).map((card) => {
    const playable = isCurrentTurn && isValidCardPlay(card, currentCard, activeColor);
    return { card, playable };
  });

  const sortedCardItems = [...cardItems];
  if (sortBy === 'color') {
    const colorOrder: Record<CardColor, number> = { red: 1, yellow: 2, green: 3, blue: 4, wild: 5 };
    sortedCardItems.sort((a, b) => {
      const cDiff = colorOrder[a.card.color] - colorOrder[b.card.color];
      if (cDiff !== 0) return cDiff;
      return a.card.value.localeCompare(b.card.value);
    });
  } else if (sortBy === 'value') {
    sortedCardItems.sort((a, b) => a.card.value.localeCompare(b.card.value));
  }

  const playableCount = cardItems.filter(c => c.playable).length;
  const showUnoCallButton = player.hand.length <= 2 && isCurrentTurn;

  return (
    <div
      id="active-player-hand-container"
      className={`relative w-full rounded-2xl p-3 sm:p-4 transition-all duration-300 shadow-xl ${
        isCurrentTurn
          ? 'bg-slate-900/95 border-2 border-emerald-400 shadow-emerald-500/10'
          : 'bg-slate-900/70 border border-slate-700'
      }`}
    >
      {/* Top bar with player info, controls, UNO shout */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 bg-slate-950 flex items-center justify-center ${
                isCurrentTurn ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-slate-600'
              }`}
            >
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            {player.isHost && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow">
                <Crown className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-slate-100">{player.name}</span>
              <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
                Bạn
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-amber-400">
                {player.hand.length} lá trên tay
              </span>
              {isCurrentTurn && (
                <span className="bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[11px] border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Lượt của bạn ({playableCount} lá hợp lệ)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons: UNO Shout, Sort cards */}
        <div className="flex items-center gap-2">
          {/* Sorter */}
          <button
            onClick={() => {
              if (sortBy === 'default') setSortBy('color');
              else if (sortBy === 'color') setSortBy('value');
              else setSortBy('default');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-600 transition-colors"
            title="Xếp bài theo màu hoặc số"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Xếp bài:</span>
            <span className="text-amber-300 font-bold">
              {sortBy === 'default' ? 'Tự nhiên' : sortBy === 'color' ? 'Theo màu' : 'Theo số'}
            </span>
          </button>

          {/* UNO Button */}
          {showUnoCallButton && (
            <button
              id="call-uno-button"
              onClick={onCallUno}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-black text-xs sm:text-sm rounded-lg uppercase tracking-wider transition-transform active:scale-95 shadow-lg ${
                player.hasCalledUno
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white animate-bounce ring-2 ring-yellow-300'
              }`}
            >
              <Flame className="w-4 h-4 fill-current text-yellow-200" />
              {player.hasCalledUno ? 'ĐÃ HÔ UNO!' : 'HÔ UNO! 🔥'}
            </button>
          )}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-2 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-[110px] sm:min-h-[135px]">
        {sortedCardItems.map(item => (
          <div key={item.card.id} className="flex-shrink-0">
            <UnoCard
              card={item.card}
              isPlayable={item.playable}
              onClick={item.playable ? () => onPlayCard(item.card.id) : undefined}
              size="md"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
