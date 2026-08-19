import React from 'react';
import { CardColor } from '../types';
import { Sparkles } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
  isDrawFour?: boolean;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onSelectColor,
  isDrawFour = false,
}) => {
  if (!isOpen) return null;

  const colorChoices: { color: CardColor; label: string; bg: string; hover: string }[] = [
    { color: 'red', label: 'Đỏ', bg: 'bg-red-500', hover: 'hover:bg-red-600 ring-red-400' },
    { color: 'yellow', label: 'Vàng', bg: 'bg-amber-400 text-slate-900', hover: 'hover:bg-amber-500 ring-yellow-300' },
    { color: 'green', label: 'Xanh Lá', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600 ring-emerald-400' },
    { color: 'blue', label: 'Xanh Dương', bg: 'bg-blue-500', hover: 'hover:bg-blue-600 ring-blue-400' },
  ];

  return (
    <div
      id="color-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="inline-flex p-3 rounded-full bg-amber-400/20 text-amber-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-black text-slate-100 mb-1">
          {isDrawFour ? 'Đổi Màu & Rút 4 Lá (+4)' : 'Chọn Màu Tiếp Theo'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Hãy chọn màu sắc mà bạn muốn người kế tiếp phải đánh:
        </p>

        <div className="grid grid-cols-2 gap-4">
          {colorChoices.map(c => (
            <button
              key={c.color}
              id={`color-choice-${c.color}`}
              onClick={() => onSelectColor(c.color)}
              className={`h-20 rounded-2xl ${c.bg} ${c.hover} font-black text-lg shadow-lg transition-transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 border-2 border-white/20`}
            >
              <div className="w-4 h-4 rounded-full bg-white/40 shadow-inner" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
