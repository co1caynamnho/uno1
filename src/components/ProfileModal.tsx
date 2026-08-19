import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { AVATAR_PRESETS } from '../utils/deck';
import { Upload, X, Check, Image as ImageIcon, Bot, User, UserCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  player: Player | null;
  onSave: (playerId: number, name: string, avatar: string | null, isAi: boolean) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  player,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAi, setIsAi] = useState(false);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setAvatar(player.avatar);
      setIsAi(player.isAi);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh có kích thước dưới 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(player.id, name.trim(), avatar, isAi);
    onClose();
  };

  return (
    <div
      id="profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-gradient-to-b from-[#252836] to-[#1e2130] border-2 border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="profile-title" className="text-lg sm:text-xl font-black text-slate-100 mb-4">
          Chỉnh Sửa Hồ Sơ Người Chơi
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="w-14 h-14 rounded-full border-2 border-[#18dcff] bg-[#2b2e3e] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-[#a0a5b5]" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-bold text-slate-200 block">Ảnh đại diện</span>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-[#18dcff] rounded-xl border border-slate-600 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh lên</span>
                  <input
                    id="input-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="px-2 py-1 text-[11px] text-red-400 hover:text-red-300 bg-red-950/40 rounded-lg border border-red-900/60"
                  >
                    Mặc định
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="form-group text-left">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên người chơi:
            </label>
            <input
              type="text"
              id="input-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên mới..."
              maxLength={20}
              required
              className="w-full px-3.5 py-2.5 bg-[#12131c] border border-[#444] rounded-xl text-white text-sm focus:outline-none focus:border-[#18dcff]"
            />
          </div>

          {/* Player Type (Human vs AI) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Loại người chơi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAi(false)}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  !isAi
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Người chơi
              </button>
              <button
                type="button"
                onClick={() => setIsAi(true)}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  isAi
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Bot className="w-4 h-4" />
                Máy (AI Bot)
              </button>
            </div>
          </div>

          {/* Preset Avatars Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[#ffaf40]" />
              Hoặc chọn mẫu Avatar có sẵn:
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
              {AVATAR_PRESETS.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setAvatar(p.url)}
                  className={`p-1 rounded-xl border transition-all ${
                    avatar === p.url
                      ? 'border-[#18dcff] bg-[#18dcff]/20 scale-105'
                      : 'border-transparent hover:border-slate-600 bg-slate-800'
                  }`}
                  title={p.name}
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover mx-auto"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn w-full py-3 bg-gradient-to-r from-[#32ff7e] to-[#18dcff] hover:opacity-95 text-[#12131c] font-black rounded-xl text-sm shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lưu Hồ Sơ
          </button>
        </form>
      </div>
    </div>
  );
};
