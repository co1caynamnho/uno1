import React from 'react';
import { X, BookOpen, Flame } from 'lucide-react';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="rule-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#252836] border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-100">Hướng Dẫn Luật Chơi UNO</h3>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-amber-400 mb-1">🎯 Mục Tiêu Trò Chơi</h4>
            <p>
              Mỗi người chơi bắt đầu với <strong>7 lá bài</strong>. Người đầu tiên đánh hết tất cả
              các lá bài trên tay sẽ giành chiến thắng!
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-amber-400 mb-1.5">🃏 Cách Đánh Bài Hợp Lệ</h4>
            <p className="mb-2">Ở mỗi lượt, bạn có thể đánh 1 lá bài nếu nó trùng:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>
                <strong className="text-red-400">Cùng màu sắc</strong> (Đỏ, Vàng, Xanh lá, Xanh
                dương) với lá bài trên bàn.
              </li>
              <li>
                <strong className="text-blue-400">Cùng số hoặc cùng ký hiệu</strong> với lá bài trên
                bàn.
              </li>
              <li>
                <strong className="text-purple-400">Lá bài Đổi màu (Wild hoặc +4)</strong> có thể
                đánh bất cứ lúc nào!
              </li>
            </ul>
            <p className="mt-2 text-slate-400 text-xs">
              * Nếu không có lá bài hợp lệ, bạn phải bấm vào chồng bài để <strong>Rút 1 lá</strong>.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-amber-400 mb-2">⚡ Các Lá Bài Chức Năng Đặc Biệt</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-red-400 block mb-0.5">⛔ SKIP (Bỏ lượt)</span>
                Người chơi kế tiếp bị mất lượt đánh.
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400 block mb-0.5">🔄 REVERSE (Đổi chiều)</span>
                Đảo ngược chiều đánh. (Trong ván 2 người, có tác dụng như Skip).
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-yellow-400 block mb-0.5">+2 (Rút 2 lá)</span>
                Người kế tiếp phải bốc 2 lá và mất lượt đánh.
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-purple-400 block mb-0.5">🃏 WILD (Đổi màu)</span>
                Tự do chọn màu sắc mới cho vòng đánh.
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="font-bold text-orange-400 block mb-0.5">+4 (Đổi màu & Rút 4)</span>
                Chọn màu mới + người kế tiếp phải bốc 4 lá và mất lượt!
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-gradient-to-r from-red-950/40 to-amber-950/40 p-3.5 rounded-2xl border border-amber-500/30 flex items-start gap-3">
            <Flame className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-300 mb-1">🔥 Hô "UNO!" Khi Còn 1 Lá</h4>
              <p className="text-xs text-slate-300">
                Khi trên tay bạn chỉ còn đúng <strong>1 lá bài</strong>, hãy nhấn nút{' '}
                <strong className="text-yellow-300">"HÔ UNO!"</strong>. Nếu quên hô, bạn có thể bị
                phạt rút thêm 2 lá bài!
              </p>
            </div>
          </div>

          {/* Section 5 - House Rules */}
          <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/30">
            <h4 className="font-bold text-emerald-400 mb-1">🌳 Chế Độ Luật Rừng (Draw Until Playable)</h4>
            <p className="text-xs text-slate-300">
              Nếu phòng chơi kích hoạt tùy chọn <strong>Luật Rừng</strong>: Khi đến lượt mà bạn không có lá bài nào đánh được, bạn sẽ phải bốc bài liên tục từ chồng bài cho đến khi nào rút được một lá bài có thể đánh được mới thôi!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm transition-colors"
        >
          ĐÃ HIỂU LUẬT CHƠI
        </button>
      </div>
    </div>
  );
};
