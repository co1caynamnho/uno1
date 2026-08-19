import React from 'react';
import { Card, CardColor, Player } from '../types';
import { UnoCard } from './UnoCard';
import { OtherPlayer } from './OtherPlayer';
import { RotateCw, RotateCcw, Layers } from 'lucide-react';
import { getColorHex, getColorNameVietnamese } from '../utils/deck';

interface GameBoardProps {
  players: Player[];
  localPlayerId: number;
  currentTurnIndex: number;
  currentCard: Card | null;
  currentColor: CardColor;
  deckCount: number;
  playDirection: 1 | -1;
  announcement?: string;
  onDrawCard: () => void;
  onCatchPenalty?: (playerId: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  localPlayerId,
  currentTurnIndex,
  currentCard,
  currentColor,
  deckCount,
  playDirection,
  announcement,
  onDrawCard,
  onCatchPenalty,
}) => {
  const activePlayer = players[currentTurnIndex];
  const isLocalTurn = activePlayer?.id === localPlayerId;
  const otherPlayers = players.filter(p => p.id !== localPlayerId);

  return (
    <div
      id="game-board-arena"
      className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900 via-[#1a1d2e] to-slate-900 border border-slate-700/80 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col justify-between min-h-[380px] sm:min-h-[420px] overflow-hidden"
    >
      {/* Background table ambient glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${getColorHex(currentColor)} 0%, transparent 70%)`,
        }}
      />

      {/* Opponents Grid on Top */}
      <div className="relative z-10 w-full mb-2">
        <div
          className={`grid gap-2 sm:gap-3 ${
            otherPlayers.length === 1
              ? 'grid-cols-1 max-w-xs mx-auto'
              : otherPlayers.length === 2
              ? 'grid-cols-2 max-w-lg mx-auto'
              : 'grid-cols-3 max-w-3xl mx-auto'
          }`}
        >
          {otherPlayers.map(player => (
            <OtherPlayer
              key={player.id}
              player={player}
              isActive={player.id === activePlayer?.id}
              onCatchPenalty={onCatchPenalty}
              canCatchPenalty={isLocalTurn}
            />
          ))}
        </div>
      </div>

      {/* Center Table: Deck + Discard Pile + Direction Indicator */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center">
        {/* Table Center Felt Surface */}
        <div className="relative flex flex-wrap items-center justify-center gap-6 sm:gap-10 bg-slate-950/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-700/80 shadow-2xl">
          {/* Draw Pile (Deck) */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Chồng rút ({deckCount})
            </span>
            <div
              id="draw-deck-pile"
              onClick={isLocalTurn ? onDrawCard : undefined}
              className={`relative ${
                isLocalTurn
                  ? 'cursor-pointer hover:scale-105 transition-transform'
                  : 'cursor-not-allowed opacity-85'
              }`}
              title={isLocalTurn ? 'Bấm để rút 1 lá bài' : 'Chưa đến lượt của bạn'}
            >
              {/* Stacked effect behind */}
              <div className="absolute top-1 -left-1 w-16 h-24 sm:w-20 sm:h-28 bg-red-900/60 rounded-lg border border-red-800 -rotate-3" />
              <div className="absolute -top-1 left-1 w-16 h-24 sm:w-20 sm:h-28 bg-red-950 rounded-lg border border-red-800 rotate-2" />
              <UnoCard isBack size="md" />

              {isLocalTurn && (
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-md animate-pulse">
                  RÚT BÀI
                </div>
              )}
            </div>
          </div>

          {/* Discard Pile (Lá hiện tại) */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
                Lá đang đánh
              </span>
              {/* Active Color Pill */}
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm flex items-center gap-1"
                style={{ backgroundColor: getColorHex(currentColor) }}
              >
                Màu: {getColorNameVietnamese(currentColor)}
              </span>
            </div>

            <div className="relative">
              {/* Discard pile shadow card underneath */}
              <div className="absolute -top-1 -right-1 w-16 h-24 sm:w-20 sm:h-28 bg-slate-800 rounded-lg border border-slate-700 rotate-3 opacity-60" />
              <UnoCard
                card={currentCard}
                size="md"
                showChosenColorGlow={true}
              />
            </div>
          </div>

          {/* Direction Indicator */}
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
              Chiều đánh
            </span>
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shadow-lg transition-transform duration-500`}
            >
              {playDirection === 1 ? (
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              ) : (
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
              )}
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                {playDirection === 1 ? 'Thuận' : 'Nghịch'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Message Banner */}
      {announcement && (
        <div className="relative z-10 w-full mt-2">
          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2 text-center text-xs sm:text-sm font-bold text-amber-300 shadow-md animate-fade-in">
            {announcement}
          </div>
        </div>
      )}
    </div>
  );
};
