import React from 'react';
import { Player } from '../types';
import { UnoCard } from './UnoCard';
import { Flame, Crown, User, ShieldAlert } from 'lucide-react';

interface OtherPlayerProps {
  player: Player;
  isActive: boolean;
  onCatchPenalty?: (playerId: number) => void;
  canCatchPenalty?: boolean;
}

export const OtherPlayer: React.FC<OtherPlayerProps> = ({
  player,
  isActive,
  onCatchPenalty,
  canCatchPenalty = false,
}) => {
  const cardCount = player.handCount ?? player.hand.length;
  const isUno = cardCount === 1;

  return (
    <div
      id={`other-player-${player.id}`}
      className={`relative flex flex-col items-center bg-slate-800/90 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 shadow-lg ${
        isActive
          ? 'border-emerald-400 ring-2 ring-emerald-400/60 bg-slate-800 scale-102 z-20'
          : 'border-slate-700/80 opacity-95'
      }`}
    >
      {/* Active turn indicator tag */}
      {isActive && (
        <div className="absolute -top-3 px-2.5 py-0.5 bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-wide shadow-md animate-pulse">
          Đang Đánh
        </div>
      )}

      {/* Header with Avatar & Name */}
      <div className="flex items-center gap-2 w-full justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 bg-slate-950 flex items-center justify-center ${
                isActive ? 'border-emerald-400' : 'border-slate-600'
              }`}
            >
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            {player.isHost && (
              <span
                className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow"
                title="Chủ phòng"
              >
                <Crown className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[80px] sm:max-w-[120px]">
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="font-bold text-amber-400">{cardCount} lá</span>
              {player.cardsPlayed > 0 && (
                <span className="text-slate-400 text-[10px]">({player.cardsPlayed} đã ra)</span>
              )}
            </div>
          </div>
        </div>

        {/* Catch UNO penalty if player has 1 card & forgot to call UNO */}
        {canCatchPenalty && !player.hasCalledUno && cardCount === 1 && onCatchPenalty && (
          <button
            onClick={() => onCatchPenalty(player.id)}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg animate-bounce shadow-md flex items-center gap-1"
            title="Bắt lỗi quên hô UNO (Phạt +2 lá)"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>BẮT UNO!</span>
          </button>
        )}
      </div>

      {/* Cards stack fan representation */}
      <div className="flex items-center justify-center -space-x-4 sm:-space-x-5 mt-2 h-12 sm:h-14 overflow-visible px-2">
        {Array.from({ length: Math.min(cardCount, 7) }).map((_, i) => (
          <div
            key={i}
            className="transform transition-transform"
            style={{
              transform: `rotate(${(i - Math.min(cardCount, 7) / 2) * 6}deg)`,
            }}
          >
            <UnoCard isBack size="mini" />
          </div>
        ))}
        {cardCount > 7 && (
          <span className="pl-5 text-xs font-bold text-amber-400 self-center">
            +{cardCount - 7}
          </span>
        )}
      </div>

      {/* UNO Shout Alert Badge */}
      {isUno && (
        <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black rounded-md animate-bounce shadow-md">
          <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300" />
          <span>UNO! 1 LÁ</span>
        </div>
      )}
    </div>
  );
};
