import React, { useEffect } from 'react';
import { Player, PlayerRanking } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, LogOut, Award, Flame, Medal, Bot, User } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Player | null;
  players: Player[];
  rankings?: PlayerRanking[];
  isHost: boolean;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  players,
  rankings,
  isHost,
  onRematch,
  onLeaveRoom,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#ff3838', '#ffaf40', '#32ff7e', '#18dcff', '#7d5fff'];

      (function frame() {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Use provided rankings or build sorted list from players
  const sortedRankings: PlayerRanking[] = rankings || players
    .map(p => ({
      playerId: p.id,
      playerName: p.name,
      avatar: p.avatar,
      rank: p.rank || 4,
      scoreEarned: p.roundScore || (p.rank === 1 ? 300 : p.rank === 2 ? 150 : p.rank === 3 ? 75 : 25),
      totalScore: p.score || 0,
      cardsPlayed: p.cardsPlayed || 0,
      isAi: p.socketId.startsWith('ai_'),
    }))
    .sort((a, b) => a.rank - b.rank);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          badgeText: 'Quán Quân',
          badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
          border: 'border-amber-400',
          bg: 'bg-amber-500/10',
        };
      case 2:
        return {
          icon: '🥈',
          badgeText: 'Á Quân',
          badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950',
          border: 'border-slate-300',
          bg: 'bg-slate-400/10',
        };
      case 3:
        return {
          icon: '🥉',
          badgeText: 'Hạng 3',
          badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white',
          border: 'border-amber-700',
          bg: 'bg-amber-800/10',
        };
      default:
        return {
          icon: '🎖️',
          badgeText: `Hạng ${rank}`,
          badgeBg: 'bg-slate-700 text-slate-200',
          border: 'border-slate-700',
          bg: 'bg-slate-900/50',
        };
    }
  };

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-gradient-to-b from-[#222533] to-[#12141f] border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="relative inline-flex p-3 sm:p-4 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl mb-2 animate-bounce">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-amber-300 mb-0.5">
          TỔNG KẾT VÁN ĐẤU
        </h2>
        <p className="text-xs text-slate-300 mb-4">
          Tất cả người chơi đã hoàn thành ván đấu • Điểm số đã được cập nhật
        </p>

        {/* RANKINGS LEADERBOARD */}
        <div className="space-y-2.5 mb-5 max-h-[320px] overflow-y-auto pr-1">
          {sortedRankings.map((item) => {
            const style = getRankMedal(item.rank);
            const isWinner = item.rank === 1;

            return (
              <div
                key={item.playerId}
                className={`flex items-center justify-between p-3 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm transition-all shadow-md`}
              >
                {/* Left: Rank Medal & Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-xl sm:text-2xl w-8 h-8">
                    {style.icon}
                  </div>

                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-900 flex items-center justify-center">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.playerName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                    {item.isAi && (
                      <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-0.5" title="AI tự động">
                        <Bot className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100 max-w-[130px] sm:max-w-[160px] truncate">
                        {item.playerName}
                      </span>
                      {item.isAi && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded font-semibold">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {isWinner ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current" /> Quán Quân ván đấu
                        </span>
                      ) : (
                        <span>Hạng {item.rank} ({item.cardsPlayed} lá đã đánh)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Scores */}
                <div className="text-right flex flex-col items-end">
                  <div className="text-xs font-black text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                    +{item.scoreEarned} điểm
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Tổng: <span className="text-slate-200 font-bold">{item.totalScore}</span> pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {isHost ? (
            <button
              onClick={onRematch}
              className="py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl transition-transform hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI VÁN TIẾP THEO</span>
            </button>
          ) : (
            <div className="py-3 bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-bold rounded-2xl flex items-center justify-center text-center">
              Chờ chủ phòng bắt đầu ván tiếp theo...
            </div>
          )}
          <button
            onClick={onLeaveRoom}
            className="py-3 bg-slate-800 hover:bg-slate-700 text-red-300 font-bold rounded-2xl text-sm border border-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Về Sảnh Chờ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
