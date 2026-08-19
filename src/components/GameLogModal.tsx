import React from 'react';
import { GameLog } from '../types';
import { X, History, Sparkles } from 'lucide-react';
import { getColorHex, getColorNameVietnamese } from '../utils/deck';

interface GameLogModalProps {
  isOpen: boolean;
  logs: GameLog[];
  onClose: () => void;
}

export const GameLogModal: React.FC<GameLogModalProps> = ({ isOpen, logs, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="game-log-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#252836] border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-100">Lịch Sử Nước Đi</h3>
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-96">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Chưa có nước đi nào trong ván này.
            </div>
          ) : (
            logs.map(log => {
              const badgeBg =
                log.type === 'win'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : log.type === 'uno'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : log.type === 'penalty'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                  : 'bg-slate-900/60 text-slate-300 border-slate-800';

              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${badgeBg}`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <span className="text-slate-100">{log.playerName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug">{log.message}</p>
                  </div>

                  {log.card && (
                    <div
                      className="px-2 py-0.5 rounded text-[10px] font-black text-white self-center whitespace-nowrap shadow-sm"
                      style={{ backgroundColor: getColorHex(log.card.color) }}
                    >
                      {log.card.value} {getColorNameVietnamese(log.card.color)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
