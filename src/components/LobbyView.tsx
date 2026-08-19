import React, { useState } from 'react';
import { RoomSummary, GameSettings } from '../types';
import { AVATAR_PRESETS } from '../utils/deck';
import {
  Users,
  User,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  RefreshCw,
  Edit3,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Flame,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface LobbyViewProps {
  rooms: RoomSummary[];
  playerName: string;
  avatar: string | null;
  isConnected: boolean;
  onUpdateProfile: (name: string, avatar: string | null) => void;
  onCreateRoom: (params: {
    roomName: string;
    roomPassword?: string;
    maxPlayers: number;
    playerName: string;
    avatar: string | null;
    settings: Partial<GameSettings>;
  }) => void;
  onJoinRoom: (params: {
    roomId: string;
    roomPassword?: string;
    playerName: string;
    avatar: string | null;
  }) => void;
  onOpenRules: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  rooms,
  playerName,
  avatar,
  isConnected,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
  soundEnabled,
  onToggleSound,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordPromptRoom, setPasswordPromptRoom] = useState<RoomSummary | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');

  // Create room state
  const [roomName, setRoomName] = useState('Phòng VIP');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [enableTimer, setEnableTimer] = useState(false);
  const [turnDuration, setTurnDuration] = useState(20);
  const [stackingDrawTwo, setStackingDrawTwo] = useState(false);
  const [drawUntilPlayable, setDrawUntilPlayable] = useState(false);

  // Profile edit state
  const [tempName, setTempName] = useState(playerName);
  const [tempAvatar, setTempAvatar] = useState<string | null>(avatar);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      roomName: roomName.trim() || 'Phòng VIP',
      roomPassword: roomPassword.trim() ? roomPassword.trim() : undefined,
      maxPlayers,
      playerName,
      avatar,
      settings: {
        enableTurnTimer: enableTimer,
        turnDuration,
        enableUnoPenalty: true,
        stackingDrawTwo,
        drawUntilPlayable,
      },
    });
    setShowCreateModal(false);
  };

  const handleJoinClick = (room: RoomSummary) => {
    if (room.status === 'playing') {
      alert('Phòng chơi này đang trong trận đấu!');
      return;
    }
    if (room.hasPassword) {
      setPasswordPromptRoom(room);
      setEnteredPassword('');
    } else {
      onJoinRoom({
        roomId: room.id,
        playerName,
        avatar,
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordPromptRoom) return;
    onJoinRoom({
      roomId: passwordPromptRoom.id,
      roomPassword: enteredPassword.trim(),
      playerName,
      avatar,
    });
    setPasswordPromptRoom(null);
  };

  const handleQuickJoin = () => {
    const available = rooms.find(r => r.status === 'waiting' && !r.hasPassword && r.playerCount < r.maxPlayers);
    if (available) {
      handleJoinClick(available);
    } else {
      // Auto-create room directly and join in 1-click!
      onCreateRoom({
        roomName: `Phòng UNO #${Math.floor(100 + Math.random() * 900)}`,
        maxPlayers: 4,
        playerName,
        avatar,
        settings: {
          enableTurnTimer: false,
          turnDuration: 20,
          enableUnoPenalty: true,
          stackingDrawTwo: false,
        },
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 p-4 sm:p-6 animate-fade-in">
      {/* Top Banner / User Bar */}
      <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* User profile capsule */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-amber-400 bg-slate-950 flex items-center justify-center overflow-hidden shadow-md">
            {avatar ? (
              <img src={avatar} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-slate-100">{playerName}</span>
              <button
                onClick={() => {
                  setTempName(playerName);
                  setTempAvatar(avatar);
                  setShowProfileModal(true);
                }}
                className="p-1 text-slate-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Đổi tên và Avatar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
              Sẵn sàng vào trận
            </span>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Luật Chơi</span>
          </button>
        </div>
      </div>

      {/* Main Lobby Action: BIG INSTANT PLAY BUTTON */}
      <div className="w-full">
        <button
          onClick={handleQuickJoin}
          className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 p-4 sm:p-5 rounded-3xl font-black text-lg sm:text-xl shadow-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-between border-2 border-white/20"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-slate-950/20 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </div>
            <div>
              <div className="leading-tight">VÀO CHƠI NGAY</div>
              <div className="text-xs font-bold text-slate-950/80">Tự động ghép phòng hoặc tạo phòng 1 chạm</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/15 px-3 py-1.5 rounded-full text-xs font-black">
            <Sparkles className="w-4 h-4" />
            <span>Nhanh Nhất</span>
          </div>
        </button>
      </div>

      {/* Secondary Lobby Action: Create Custom Room */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Tạo phòng có mật khẩu / tùy chỉnh</span>
        </button>

        <span className="text-xs text-slate-400">
          Hiện có: <strong className="text-amber-400">{rooms.length}</strong> phòng
        </span>
      </div>

      {/* Available Rooms List */}
      <div className="w-full bg-slate-900/70 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-slate-100">
              Danh Sách Phòng Online ({rooms.length})
            </h2>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Flame className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">Chưa có phòng nào được tạo.</p>
            <p className="text-xs text-slate-500 mt-1">
              Hãy là người đầu tiên bấm <strong>"Tạo Phòng Mới"</strong> ở trên để bạn bè cùng tham gia!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-transform active:scale-95"
            >
              + Tạo Phòng Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {rooms.map(room => (
              <div
                key={room.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  room.status === 'playing'
                    ? 'bg-slate-950/50 border-slate-800 opacity-70'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-amber-400/80 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100 truncate max-w-[150px]">
                        {room.name}
                      </span>
                      {room.hasPassword ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title="Có mật khẩu" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" title="Phòng công khai" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Chủ phòng: <strong className="text-slate-300">{room.hostName}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        room.status === 'playing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {room.status === 'playing' ? 'Đang chơi' : 'Đang chờ'}
                    </span>
                    <span className="text-xs font-black text-slate-300 block mt-1">
                      {room.playerCount}/{room.maxPlayers} người
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="text-[10px] text-slate-400">
                    Mã: <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{room.id.slice(-6)}</code>
                  </span>
                  <button
                    disabled={room.status === 'playing' || room.playerCount >= room.maxPlayers}
                    onClick={() => handleJoinClick(room)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                      room.status === 'playing' || room.playerCount >= room.maxPlayers
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {room.status === 'playing'
                      ? 'Đang đấu'
                      : room.playerCount >= room.maxPlayers
                      ? 'Đã đầy'
                      : 'Vào Chơi'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-b from-[#252836] to-[#1e2130] border-2 border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#18dcff]" />
              Tạo Phòng Chơi Mới
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên phòng:</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng VIP 1"
                  maxLength={25}
                  required
                  className="w-full px-3 py-2 bg-[#12131c] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#18dcff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu phòng (tùy chọn):
                </label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                  placeholder="Để trống nếu là phòng công khai"
                  maxLength={15}
                  className="w-full px-3 py-2 bg-[#12131c] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#18dcff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số lượng người chơi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPlayers(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        maxPlayers === num
                          ? 'bg-[#18dcff]/20 border-[#18dcff] text-[#18dcff]'
                          : 'bg-[#12131c] border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num} Người
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Rules */}
              <div className="space-y-2.5 pt-2 border-t border-slate-700/60">
                <span className="text-xs font-bold text-slate-300 block">Tùy chỉnh luật chơi:</span>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl hover:border-emerald-400/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={drawUntilPlayable}
                    onChange={e => setDrawUntilPlayable(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-emerald-400 block flex items-center gap-1">
                      🌳 Luật Rừng (Draw Until Playable)
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Khi không có lá bài hợp lệ để đánh, người chơi phải bốc bài liên tục cho đến khi nào rút được lá bài đánh được.
                    </span>
                  </div>
                </label>



                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={stackingDrawTwo}
                    onChange={e => setStackingDrawTwo(e.target.checked)}
                    className="rounded text-[#32ff7e] focus:ring-0"
                  />
                  <span>Cho phép cộng dồn +2 lên +2</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#32ff7e] to-[#18dcff] hover:opacity-95 text-[#12131c] font-black rounded-xl text-xs shadow-lg"
                >
                  Tạo & Vào Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD PROMPT MODAL */}
      {passwordPromptRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#252836] border border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-black">Nhập Mật Khẩu Phòng</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Phòng <strong>{passwordPromptRoom.name}</strong> yêu cầu mật khẩu để tham gia.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={enteredPassword}
                onChange={e => setEnteredPassword(e.target.value)}
                placeholder="Nhập mật khẩu phòng..."
                required
                autoFocus
                className="w-full px-3 py-2.5 bg-[#12131c] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordPromptRoom(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
                >
                  Vào Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#252836] border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black text-slate-100 mb-4">Chỉnh Sửa Hồ Sơ Cá Nhân</h3>

            <div className="space-y-4">
              {/* Avatar Preview */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl">
                <div className="w-14 h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-900 flex items-center justify-center">
                  {tempAvatar ? (
                    <img src={tempAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-200 block">Avatar của bạn</span>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="text-[11px] text-[#18dcff] hover:underline cursor-pointer">
                      Tải ảnh từ máy
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') setTempAvatar(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {tempAvatar && (
                      <button
                        type="button"
                        onClick={() => setTempAvatar(null)}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Đặt lại mặc định
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên hiển thị:</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2 bg-[#12131c] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Hoặc chọn avatar mẫu:
                </span>
                <div className="grid grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempAvatar(null)}
                    className={`p-1 rounded-xl border flex flex-col items-center justify-center aspect-square ${
                      tempAvatar === null ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Avatar Mặc Định"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-[8px] font-bold mt-0.5">Mặc định</span>
                  </button>
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTempAvatar(p.url)}
                      className={`p-1 rounded-xl border ${
                        tempAvatar === p.url ? 'border-amber-400 bg-amber-400/20' : 'border-slate-700'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-7 h-7 rounded-full mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    onUpdateProfile(tempName.trim() || 'Người chơi', tempAvatar);
                    setShowProfileModal(false);
                  }}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
