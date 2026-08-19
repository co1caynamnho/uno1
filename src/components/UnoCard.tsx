import React from 'react';
import { Card, CardColor } from '../types';

interface UnoCardProps {
  card?: Card | null;
  isBack?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'mini';
  className?: string;
  showChosenColorGlow?: boolean;
  style?: React.CSSProperties;
}

export const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isBack = false,
  isPlayable = false,
  onClick,
  size = 'md',
  className = '',
  showChosenColorGlow = false,
  style,
}) => {
  // Size specifications
  const sizeConfig = {
    mini: {
      container: 'w-7 h-10 rounded-md text-[9px]',
      corner: 'text-[9px] top-0.5 left-1',
      cornerBR: 'text-[9px] bottom-0.5 right-1',
      oval: 'w-5 h-7',
      centerText: 'text-xs font-black',
      wildQuadrant: 'w-4 h-4',
    },
    sm: {
      container: 'w-11 h-16 sm:w-13 sm:h-19 rounded-xl text-xs',
      corner: 'text-[11px] top-1 left-1.5',
      cornerBR: 'text-[11px] bottom-1 right-1.5',
      oval: 'w-8 h-12 sm:w-9 sm:h-14',
      centerText: 'text-base sm:text-lg font-black',
      wildQuadrant: 'w-6 h-6 sm:w-7 sm:h-7',
    },
    md: {
      container: 'w-18 h-28 sm:w-22 sm:h-34 rounded-2xl text-sm',
      corner: 'text-xs sm:text-sm top-1.5 left-2',
      cornerBR: 'text-xs sm:text-sm bottom-1.5 right-2',
      oval: 'w-13 h-20 sm:w-16 sm:h-24',
      centerText: 'text-2xl sm:text-4xl font-black',
      wildQuadrant: 'w-8 h-8 sm:w-10 sm:h-10',
    },
    lg: {
      container: 'w-28 h-44 sm:w-34 sm:h-52 rounded-3xl text-base',
      corner: 'text-base sm:text-lg top-2.5 left-3',
      cornerBR: 'text-base sm:text-lg bottom-2.5 right-3',
      oval: 'w-20 h-32 sm:w-24 sm:h-38',
      centerText: 'text-4xl sm:text-6xl font-black',
      wildQuadrant: 'w-14 h-14 sm:w-16 sm:h-16',
    },
  }[size];

  // CARD BACK DESIGN (PREMIUM MINIMALIST STYLE)
  if (isBack || !card) {
    return (
      <div
        id="uno-card-back"
        onClick={onClick}
        style={style}
        className={`relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f172a] to-black rounded-2xl border-2 border-white/30 shadow-2xl select-none transition-transform duration-200 overflow-hidden ${
          sizeConfig.container
        } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
      >
        {/* Subtle geometric pinstripe inner border */}
        <div className="absolute inset-1 rounded-xl border border-amber-400/40 pointer-events-none" />

        {/* Diagonal Gloss Accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-sm pointer-events-none" />

        {/* Center Red/Gold Emblem with UNO logo */}
        <div
          className={`${sizeConfig.oval} rounded-full bg-gradient-to-tr from-[#dc2626] via-[#ef4444] to-[#f59e0b] -rotate-25 flex items-center justify-center shadow-lg border-2 border-amber-300 ring-2 ring-black/40`}
        >
          <span
            className="font-black italic tracking-tighter text-amber-100 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{
              fontSize: size === 'mini' ? '8px' : size === 'sm' ? '12px' : size === 'md' ? '18px' : '28px',
              fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif",
            }}
          >
            UNO
          </span>
        </div>
      </div>
    );
  }

  // CARD FACE COLORS (Clean, Minimalist, High Contrast)
  const colorTheme = {
    red: {
      cardBg: 'bg-gradient-to-b from-[#e02424] to-[#b91c1c]',
      border: 'border-white/40',
      textColor: 'text-[#c81e1e]',
      shadow: 'shadow-[0_6px_20px_rgba(224,36,36,0.35)]',
    },
    yellow: {
      cardBg: 'bg-gradient-to-b from-[#f59e0b] to-[#d97706]',
      border: 'border-white/40',
      textColor: 'text-[#b45309]',
      shadow: 'shadow-[0_6px_20px_rgba(245,158,11,0.35)]',
    },
    green: {
      cardBg: 'bg-gradient-to-b from-[#10b981] to-[#047857]',
      border: 'border-white/40',
      textColor: 'text-[#047857]',
      shadow: 'shadow-[0_6px_20px_rgba(16,185,129,0.35)]',
    },
    blue: {
      cardBg: 'bg-gradient-to-b from-[#2563eb] to-[#1d4ed8]',
      border: 'border-white/40',
      textColor: 'text-[#1d4ed8]',
      shadow: 'shadow-[0_6px_20px_rgba(37,99,235,0.35)]',
    },
    wild: {
      cardBg: 'bg-gradient-to-b from-[#1f2937] to-[#111827]',
      border: 'border-white/30',
      textColor: 'text-white',
      shadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.5)]',
    },
  }[card.color];

  // RENDER VALUE (High readability symbols and numbers)
  const renderCorner = (val: string) => {
    if (val === 'SKIP') return '⊘';
    if (val === 'REV') return '⇄';
    if (val === 'WILD') return '★';
    return val;
  };

  const renderCenterValue = () => {
    const val = card.value;

    if (val === 'SKIP') {
      return (
        <span
          className={`${colorTheme.textColor} ${sizeConfig.centerText} font-black select-none leading-none`}
        >
          ⊘
        </span>
      );
    }

    if (val === 'REV') {
      return (
        <span
          className={`${colorTheme.textColor} ${sizeConfig.centerText} font-black select-none leading-none tracking-tight`}
        >
          ⇄
        </span>
      );
    }

    if (val === '+2') {
      return (
        <span
          className={`${colorTheme.textColor} ${sizeConfig.centerText} font-black select-none leading-none tracking-tighter`}
        >
          +2
        </span>
      );
    }

    if (val === '+4') {
      return (
        <div className="flex flex-col items-center justify-center">
          <span
            className="text-white font-black select-none leading-none tracking-tighter drop-shadow-md text-xl sm:text-3xl"
          >
            +4
          </span>
          <div className="grid grid-cols-2 grid-rows-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden mt-0.5 border border-white/60">
            <div className="bg-[#ef4444]" />
            <div className="bg-[#3b82f6]" />
            <div className="bg-[#f59e0b]" />
            <div className="bg-[#10b981]" />
          </div>
        </div>
      );
    }

    if (val === 'WILD') {
      return (
        <div
          className={`${sizeConfig.wildQuadrant} grid grid-cols-2 grid-rows-2 rounded-full overflow-hidden border-2 border-white/90 shadow-md transform -rotate-12`}
        >
          <div className="bg-[#ef4444]" />
          <div className="bg-[#3b82f6]" />
          <div className="bg-[#f59e0b]" />
          <div className="bg-[#10b981]" />
        </div>
      );
    }

    // Number 0-9
    return (
      <span
        className={`${colorTheme.textColor} ${sizeConfig.centerText} font-black select-none leading-none italic`}
        style={{ fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif" }}
      >
        {val}
      </span>
    );
  };

  // Color glow for active wild selection
  const glowBorder =
    showChosenColorGlow && card.selectedColor
      ? {
          red: 'ring-4 ring-red-500 ring-offset-2 ring-offset-slate-950',
          yellow: 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-950',
          green: 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-slate-950',
          blue: 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-950',
          wild: '',
        }[card.selectedColor]
      : '';

  return (
    <div
      id={`uno-card-${card.id}`}
      onClick={isPlayable || onClick ? onClick : undefined}
      style={style}
      className={`relative flex flex-col items-center justify-between select-none transition-all duration-200 border-2 overflow-hidden ${
        sizeConfig.container
      } ${colorTheme.cardBg} ${colorTheme.border} ${colorTheme.shadow} ${
        isPlayable
          ? 'hover:-translate-y-5 hover:shadow-2xl ring-3 sm:ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900 scale-105 z-30 cursor-pointer'
          : onClick
          ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer'
          : 'opacity-95'
      } ${glowBorder} ${className}`}
    >
      {/* Diagonal Glossy Sheen Overlay for premium card aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none rounded-2xl" />
      {/* Top-Left Corner Index */}
      <div
        className={`absolute font-black text-white select-none leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${sizeConfig.corner}`}
      >
        {renderCorner(card.value)}
      </div>

      {/* Center Oval Lozenge (Clean White for high contrast, or dark for +4/Wild) */}
      <div className="my-auto relative flex items-center justify-center">
        <div
          className={`${sizeConfig.oval} rounded-full ${
            card.value === '+4'
              ? 'bg-slate-900 border-2 border-white/60'
              : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-white/80'
          } -rotate-25 flex items-center justify-center p-1`}
        >
          <div className="rotate-25 flex items-center justify-center w-full h-full">
            {renderCenterValue()}
          </div>
        </div>
      </div>

      {/* Bottom-Right Corner Index (Rotated 180) */}
      <div
        className={`absolute font-black text-white select-none leading-none rotate-180 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${sizeConfig.cornerBR}`}
      >
        {renderCorner(card.value)}
      </div>

      {/* Wild color active badge indicator if chosen */}
      {card.selectedColor && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center z-20"
          style={{
            backgroundColor:
              card.selectedColor === 'red'
                ? '#ef4444'
                : card.selectedColor === 'yellow'
                ? '#f59e0b'
                : card.selectedColor === 'green'
                ? '#10b981'
                : '#3b82f6',
          }}
          title={`Màu hiện tại: ${card.selectedColor.toUpperCase()}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </div>
      )}
    </div>
  );
};
