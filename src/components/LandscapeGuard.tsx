import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Sparkles } from 'lucide-react';

export const LandscapeGuard: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobileWidth = window.innerWidth <= 850 || (isTouch && window.innerWidth <= 1024);

      setIsPortraitMobile(isPortrait && isMobileWidth);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // @ts-ignore
      if (screen.orientation && screen.orientation.lock) {
        // @ts-ignore
        await screen.orientation.lock('landscape');
      }
    } catch {
      // Screen orientation lock might not be supported without fullscreen or on iOS, which is normal
    }
  };

  if (!isPortraitMobile) return null;

  return (
    <div
      id="landscape-guard-modal"
      className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white select-none animate-fade-in"
    >
      {/* Animated Phone Rotation Graphic */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        {/* Glow Halo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" />

        {/* Outer Rotating Arrow Ring */}
        <div className="absolute inset-0 border-2 border-dashed border-amber-400/40 rounded-full animate-spin" style={{ animationDuration: '8s' }} />

        {/* Rotating Phone Mockup */}
        <div className="relative flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="w-14 h-24 rounded-2xl border-4 border-white bg-slate-900 flex flex-col items-center justify-between p-1.5 shadow-2xl transition-transform duration-700">
            <div className="w-4 h-1 bg-white/40 rounded-full" />
            <div className="w-8 h-10 rounded-lg bg-gradient-to-tr from-red-500 via-amber-400 to-emerald-400 flex items-center justify-center">
              <span className="text-[9px] font-black text-slate-950 italic">UNO</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full border border-white/40" />
          </div>

          <div className="absolute -right-3 -top-1">
            <RotateCw className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
      </div>

      {/* Main Announcement */}
      <div className="max-w-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Yêu Cầu Màn Hình Ngang</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-snug">
          VUI LÒNG XOAY NGANG ĐIỆN THOẠI 📱🔄
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Trò chơi UNO Online chỉ hỗ trợ chơi ở <strong className="text-amber-400 font-bold">chế độ màn hình ngang (Landscape)</strong> để hiển thị trọn vẹn 4 người chơi và tay bài rộng rãi.
        </p>

        {/* Instruction Tips */}
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-white/10 text-xs text-slate-400 text-left space-y-1.5 mt-4">
          <p className="flex items-center gap-2 text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            1. Bật tính năng <strong>"Tự động xoay màn hình"</strong> trên điện thoại.
          </p>
          <p className="flex items-center gap-2 text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            2. Xoay ngang điện thoại để bàn chơi tự động mở rộng.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRequestLandscape}
          className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          <span>Bấm Để Xoay / Mở Rộng Toàn Màn Hình</span>
        </button>
      </div>
    </div>
  );
};
