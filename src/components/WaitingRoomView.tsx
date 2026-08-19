import React, { useState } from 'react';
import { Player, RoomState, ChatMessage } from '../types';
import {
  Crown,
  CheckCircle2,
  Clock,
  Send,
  LogOut,
  Play,
  Copy,
  Check,
  Smile,
  Shield,
  Key,
  Users,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface WaitingRoomViewProps {
  room: RoomState;
  localPlayer: Player;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSendChat: (text: string, isEmote?: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const QUICK_EMOTES = [
  'Xin chào mọi người! 👋',
  'Bắt đầu đi chủ phòng ơi! 🚀',
  'Đánh nhanh thắng nhanh! ⚡',
  'UNO sắp bùng nổ rồi! 🔥',
  'Tự tin lấy cúp hôm nay! 🏆',
  'Khoan hãy bắt đầu, chờ xíu! ⏳',
];

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  room,
  localPlayer,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  onSendChat,
  soundEnabled,
  onToggleSound,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);

  const isHost = localPlayer.isHost;
  const canStart =
    isHost &&
    room.players.length >= 2 &&
    room.players.every(p => p.isHost || p.isReady);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const emptySlotsCount = Math.max(0, room.maxPlayers - room.players.length);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 p-4 sm:p-6 animate-fade-in">
      {/* Room Header Info */}
      <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">{room.roomName}</h2>
            {room.hasPassword && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30">
                <Key className="w-3 h-3" /> Có Mật Khẩu
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span>
              Người chơi: <strong className="text-amber-400">{room.players.length}/{room.maxPlayers}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Mã phòng: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">{room.roomId.slice(-6)}</code>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:text-amber-400 transition-colors"
                title="Sao chép mã phòng"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl border border-red-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Rời Phòng</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player Seats (Left/Center) + Live Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Seated Players (2 Cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-slate-900/70 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
            <h3 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Người Chơi Đã Vào Ghế ({room.players.length}/{room.maxPlayers})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    player.id === localPlayer.id
                      ? 'bg-slate-800/90 border-amber-400/80 ring-1 ring-amber-400/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      {player.isHost && (
                        <span
                          className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md"
                          title="Chủ phòng"
                        >
                          <Crown className="w-3 h-3 fill-current" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{player.name}</span>
                        {player.id === localPlayer.id && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-black px-1.5 py-0.5 rounded">
                            Bạn
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {player.isHost ? 'Chủ phòng' : 'Người chơi'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {player.isHost ? (
                      <span className="text-xs font-bold text-amber-400 px-2.5 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
                        Chủ phòng
                      </span>
                    ) : player.isReady ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-2.5 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 px-2.5 py-1 bg-slate-800 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Đang chờ...
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty slot placeholders */}
              {Array.from({ length: emptySlotsCount }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 flex items-center gap-3 opacity-60"
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Ghế trống</span>
                    <span className="text-[11px] text-slate-600">Đang đợi người chơi khác vào...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Control Panel */}
          <div className="bg-slate-900/70 border border-slate-700/80 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="text-xs text-slate-400">
              {isHost ? (
                canStart ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Tất cả người chơi đã sẵn sàng! Bấm bắt đầu ngay.
                  </span>
                ) : room.players.length < 2 ? (
                  <span>Cần tối thiểu <strong>2 người chơi</strong> để bắt đầu.</span>
                ) : (
                  <span>Đang chờ các người chơi khác bấm "Sẵn sàng"...</span>
                )
              ) : localPlayer.isReady ? (
                <span className="text-emerald-400 font-bold">
                  ✓ Bạn đã sẵn sàng! Đang chờ chủ phòng bắt đầu trận đấu.
                </span>
              ) : (
                <span>Vui lòng bấm nút <strong>"Sẵn Sàng"</strong> để chuẩn bị vào ván!</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isHost ? (
                <button
                  disabled={!canStart}
                  onClick={onStartGame}
                  className={`flex items-center gap-2 px-6 py-3 font-black text-sm rounded-2xl shadow-xl transition-all ${
                    canStart
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:opacity-95 active:scale-95 animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Bắt Đầu Ván Đấu
                </button>
              ) : (
                <button
                  onClick={onToggleReady}
                  className={`px-6 py-3 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 ${
                    localPlayer.isReady
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/40'
                      : 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950'
                  }`}
                >
                  {localPlayer.isReady ? 'Hủy Sẵn Sàng' : 'SẴN SÀNG! 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* In-Room Real-time Chat (1 Col on lg) */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-4 flex flex-col h-[400px] lg:h-[430px] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#18dcff]" />
              Chat Phòng Chơi
            </h3>
            <span className="text-[10px] text-slate-500">{room.chatMessages.length} tin nhắn</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
            {room.chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Smile className="w-8 h-8 text-slate-700 mb-1" />
                <p className="text-xs text-slate-500">Chưa có tin nhắn nào.</p>
                <p className="text-[11px] text-slate-600">Gửi lời chào tới các đối thủ bên dưới!</p>
              </div>
            ) : (
              room.chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`text-xs p-2 rounded-xl ${
                    msg.senderId === localPlayer.id
                      ? 'bg-[#18dcff]/15 border border-[#18dcff]/30 ml-4'
                      : 'bg-slate-950/60 border border-slate-800 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <strong className={msg.senderId === localPlayer.id ? 'text-[#18dcff]' : 'text-slate-300'}>
                      {msg.senderName}
                    </strong>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-200 break-words">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Emote Selector */}
          {showEmotes && (
            <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 mb-2">
              {QUICK_EMOTES.map((emote, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSendChat(emote, true);
                    setShowEmotes(false);
                  }}
                  className="text-left text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg truncate transition-colors"
                >
                  {emote}
                </button>
              ))}
            </div>
          )}

          {/* Chat Form */}
          <form onSubmit={handleSend} className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowEmotes(!showEmotes)}
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              title="Biểu cảm nhanh"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              maxLength={100}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#18dcff]"
            />
            <button
              type="submit"
              className="p-2 bg-gradient-to-r from-[#32ff7e] to-[#18dcff] text-slate-950 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
