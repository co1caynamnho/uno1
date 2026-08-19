import React, { useState, useEffect } from 'react';
import { Card, CardColor, CardValue, Player } from './types';
import { useSocketGame } from './hooks/useSocketGame';
import { sound } from './utils/audio';
import { UnoCard } from './components/UnoCard';
import { LobbyView } from './components/LobbyView';
import { LandscapeGuard } from './components/LandscapeGuard';
import { ColorPickerModal } from './components/ColorPickerModal';
import { GameOverModal } from './components/GameOverModal';
import { RuleGuideModal } from './components/RuleGuideModal';
import { GameLogModal } from './components/GameLogModal';
import { AVATAR_PRESETS, isValidCardPlay, getColorHex, getColorNameVietnamese } from './utils/deck';
import {
  Volume2,
  VolumeX,
  BookOpen,
  History,
  MessageSquare,
  LogOut,
  Flame,
  RotateCw,
  RotateCcw,
  Crown,
  Eye,
  EyeOff,
  User,
  Send,
  AlertCircle,
  Play,
  Users,
  Bot,
} from 'lucide-react';

export default function App() {
  const [localName, setLocalName] = useState(() => {
    const saved = localStorage.getItem('uno_player_name');
    if (!saved || /^Người chơi \d+$/i.test(saved.trim()) || saved.trim() === 'Người chơi 662') {
      return 'Người chơi';
    }
    return saved;
  });
  const [localAvatar, setLocalAvatar] = useState<string | null>(() => {
    return localStorage.getItem('uno_player_avatar') || null;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Modals & Panels
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  // Socket Game State
  const {
    isConnected,
    roomsList,
    currentRoom,
    localPlayerId,
    localPlayer,
    errorMessage,
    unoAnnouncement,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    playCard,
    drawCard,
    callUno,
    catchUnoPenalty,
    sendChat,
    updateProfile,
    rematch,
    leaveRoom,
  } = useSocketGame();

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  const handleUpdateProfile = (newName: string, newAvatar: string | null) => {
    const finalName = newName.trim() || 'Người chơi';
    setLocalName(finalName);
    setLocalAvatar(newAvatar);
    localStorage.setItem('uno_player_name', finalName);
    if (newAvatar) {
      localStorage.setItem('uno_player_avatar', newAvatar);
    } else {
      localStorage.removeItem('uno_player_avatar');
    }
    if (currentRoom) {
      updateProfile(finalName, newAvatar);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!currentRoom || !localPlayer) return;
    const card = localPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    if (card.color === 'wild') {
      setPendingWildCardId(cardId);
    } else {
      sound.playCard();
      playCard(cardId);
    }
  };

  const handleSelectWildColor = (color: CardColor) => {
    if (!pendingWildCardId) return;
    sound.playSpecial();
    playCard(pendingWildCardId, color);
    setPendingWildCardId(null);
  };

  const handleSendInGameChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  // Helper to check if a player is AI / Bot replacement
  const isBot = (player: Player) => {
    return (
      player.isBotReplacement ||
      player.socketId.startsWith('ai_') ||
      player.name.includes('(Bot đang đánh)') ||
      player.name.includes('(AI)')
    );
  };

  // Helper to extract clean name without bot tags
  const getDisplayName = (player: Player) => {
    return player.name
      .replace(/\s*\(Bot đang đánh\)/gi, '')
      .replace(/\s*\(AI\)/gi, '')
      .trim();
  };

  // Helper to render rank badge for finished players
  const renderRankBadge = (rank?: number) => {
    if (!rank) return null;
    if (rank === 1) return <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-2 py-0.5 rounded-full shadow">🥇 Hạng 1</span>;
    if (rank === 2) return <span className="text-[10px] font-black bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 px-2 py-0.5 rounded-full shadow">🥈 Hạng 2</span>;
    if (rank === 3) return <span className="text-[10px] font-black bg-gradient-to-r from-amber-700 to-amber-800 text-white px-2 py-0.5 rounded-full shadow">🥉 Hạng 3</span>;
    return <span className="text-[10px] font-bold bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded-full shadow">🎖️ Hạng {rank}</span>;
  };

  // Helper to render an avatar nicely with Bot status
  const renderAvatar = (player: Player, isActive: boolean) => {
    const isBotPlayer = isBot(player);
    return (
      <div className={`avatar-container relative ${isActive && player.rank === undefined ? 'ring-2 ring-[#32ff7e]' : ''}`}>
        {player.avatar ? (
          <img src={player.avatar} alt={player.name} className="avatar-img" />
        ) : isBotPlayer ? (
          <Bot className="avatar-default-icon text-cyan-400" />
        ) : (
          <User className="avatar-default-icon" />
        )}
        {isBotPlayer && (
          <div
            className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 p-0.5 rounded-full ring-1 ring-slate-900 shadow"
            title="Bot đang đánh thay"
          >
            <Bot className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
    );
  };

  // If not in a room, render Lobby
  if (!currentRoom || localPlayerId === null || !localPlayer) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-between p-2 sm:p-4 text-white font-sans overflow-x-hidden">
        <LandscapeGuard />
        <h1 className="m-0 font-black tracking-widest text-center mt-2 text-3xl sm:text-4xl text-white drop-shadow-md">
          UNO
        </h1>

        {errorMessage && (
          <div className="fixed top-4 z-50 px-4 py-2 bg-red-600/95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <LobbyView
          rooms={roomsList}
          playerName={localName}
          avatar={localAvatar}
          isConnected={isConnected}
          onUpdateProfile={handleUpdateProfile}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onOpenRules={() => setIsRulesOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        <footer className="text-center text-[11px] text-slate-500 py-2">
          UNO Online • Multiplayer Real-Time Room Engine
        </footer>

        <RuleGuideModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </div>
    );
  }

  // GAMEPLAY / IN-ROOM ARENA (Instant Table for Waiting, Playing, and Ended States)
  const activePlayer = currentRoom.players[currentRoom.currentTurnIndex];
  const isLocalTurn = activePlayer?.id === localPlayer.id;

  // Derive opponents relative to the 4 directions (top, left, right)
  const otherPlayers = currentRoom.players.filter(p => p.id !== localPlayer.id);

  const getOpponentAtSlot = (slot: 'top' | 'left' | 'right') => {
    if (otherPlayers.length === 1) {
      return slot === 'top' ? otherPlayers[0] : null;
    }
    if (otherPlayers.length === 2) {
      if (slot === 'left') return otherPlayers[0];
      if (slot === 'top') return otherPlayers[1];
      return null;
    }
    // 3 opponents (4 players total)
    if (slot === 'left') return otherPlayers[0];
    if (slot === 'top') return otherPlayers[1];
    if (slot === 'right') return otherPlayers[2];
    return null;
  };

  const topOpponent = getOpponentAtSlot('top');
  const leftOpponent = getOpponentAtSlot('left');
  const rightOpponent = getOpponentAtSlot('right');

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-2 sm:p-4 text-white font-sans overflow-x-hidden">
      <LandscapeGuard />
      {/* UNO Broadcast Toast */}
      {unoAnnouncement && (
        <div className="fixed top-12 z-50 px-6 py-3 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-black text-sm sm:text-base rounded-full shadow-2xl flex items-center gap-2 animate-bounce ring-4 ring-white/40">
          <Flame className="w-5 h-5 fill-current text-red-950" />
          <span>🔥 {unoAnnouncement.playerName.toUpperCase()} ĐÃ HÔ UNO! 🔥</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-4 z-50 px-4 py-2 bg-red-600/95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Title */}
      <h1 className="m-0 font-black tracking-widest text-center mt-1 text-3xl sm:text-4xl text-white drop-shadow-md">
        UNO
      </h1>

      {/* ROOM INFO BADGE */}
      <div
        id="room-info-badge"
        className="flex items-center gap-3 sm:gap-4 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs sm:text-sm text-[#18dcff] shadow-sm mb-2 flex-wrap justify-center backdrop-blur-md"
      >
        <span>
          🏠 Phòng: <strong className="text-white">{currentRoom.roomName}</strong> ({currentRoom.players.length}/{currentRoom.maxPlayers} người)
        </span>
        {currentRoom.settings.drawUntilPlayable && (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[11px] font-black">
            🌳 Luật Rừng
          </span>
        )}
        {currentRoom.hasPassword && (
          <span className="flex items-center gap-1">
            🔑 Mật khẩu:{' '}
            <strong className="text-white tracking-wider">
              {showPassword ? currentRoom.settings.roomPassword || '••••••' : '••••••'}
            </strong>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-white ml-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </span>
        )}
      </div>

      {/* Game Header Controls Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#32ff7e]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#ffaf40]" />
            <span className="hidden sm:inline">Luật chơi</span>
          </button>



          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
              isChatOpen
                ? 'bg-[#18dcff]/20 text-[#18dcff] border-[#18dcff]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({currentRoom.chatMessages.length})</span>
          </button>
        </div>

        <button
          onClick={leaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/80 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Rời Bàn</span>
        </button>
      </div>

      {/* Main Game Board - 4 DIRECTIONS */}
      <main className="w-full max-w-5xl my-auto py-1">
        <div
          id="game-board"
          className="relative w-full h-[590px] sm:h-[630px] bg-slate-900/60 backdrop-blur-md rounded-3xl border-3 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden"
        >
          {/* Ambient center radial color glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${getColorHex(currentRoom.currentColor)} 0%, transparent 65%)`,
            }}
          />

          {/* TOP OPPONENT SLOT */}
          <div id="slot-top" className="player-slot top">
            {topOpponent ? (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`player-tag ${
                    topOpponent.id === activePlayer?.id && topOpponent.rank === undefined ? 'active' : ''
                  }`}
                >
                  {renderAvatar(topOpponent, topOpponent.id === activePlayer?.id)}
                  <div className="flex flex-col items-start leading-tight">
                    <span className="player-name max-w-[100px] truncate">{getDisplayName(topOpponent)}</span>
                    {isBot(topOpponent) && (
                      <span className="text-[9px] font-black bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-sm mt-0.5 animate-pulse">
                        <Bot className="w-2.5 h-2.5 text-cyan-400" /> Bot đang đánh
                      </span>
                    )}
                  </div>
                  {renderRankBadge(topOpponent.rank)}
                  {currentRoom.status === 'playing' && topOpponent.rank === undefined && (
                    <span className="card-count-badge">{topOpponent.handCount}</span>
                  )}
                  {topOpponent.isHost && (
                    <Crown className="w-3 h-3 text-amber-400 fill-current ml-1" title="Chủ phòng" />
                  )}
                  {/* Catch UNO button if opponent forgot to call UNO on 1 card */}
                  {currentRoom.status === 'playing' && topOpponent.rank === undefined && topOpponent.handCount === 1 && !topOpponent.hasCalledUno && (
                    <button
                      onClick={() => catchUnoPenalty(topOpponent.id)}
                      className="text-[9px] font-black bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-2 py-0.5 rounded-full shadow-md animate-bounce ring-1 ring-red-300 ml-1 flex items-center gap-0.5 cursor-pointer"
                      title="Bắt quả tang quên hô UNO (+2 lá)"
                    >
                      <AlertCircle className="w-2.5 h-2.5" /> Bắt UNO (+2)
                    </button>
                  )}
                </div>

                {/* Opponent Card Backs - Evenly Layered & Directed to Center */}
                {currentRoom.status === 'playing' && topOpponent.rank === undefined && (
                  <div className="hand-container flex items-center justify-center">
                    {Array.from({ length: Math.min(topOpponent.handCount, 8) }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          zIndex: 30 - idx,
                          marginLeft: idx === 0 ? '0px' : '-8px',
                        }}
                        className="rotate-180 transition-transform origin-center"
                        title="Bài đối thủ trên"
                      >
                        <UnoCard isBack size="sm" />
                      </div>
                    ))}
                    {topOpponent.handCount > 8 && (
                      <span className="text-[10px] text-amber-300 font-bold ml-1">+{topOpponent.handCount - 8}</span>
                    )}
                  </div>
                )}
              </div>
            ) : currentRoom.status === 'waiting' ? (
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-600 bg-slate-950 flex items-center justify-center text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">Chờ người chơi</span>
              </div>
            ) : null}
          </div>

          {/* LEFT OPPONENT SLOT */}
          <div id="slot-left" className="player-slot left">
            {leftOpponent ? (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`player-tag ${
                    leftOpponent.id === activePlayer?.id && leftOpponent.rank === undefined ? 'active' : ''
                  }`}
                >
                  {renderAvatar(leftOpponent, leftOpponent.id === activePlayer?.id)}
                  <div className="flex flex-col items-start leading-tight">
                    <span className="player-name max-w-[80px] truncate">{getDisplayName(leftOpponent)}</span>
                    {isBot(leftOpponent) && (
                      <span className="text-[8px] font-black bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 px-1 py-0.2 rounded-full flex items-center gap-0.5 shadow-sm mt-0.5 animate-pulse">
                        <Bot className="w-2 h-2 text-cyan-400" /> Bot đang đánh
                      </span>
                    )}
                  </div>
                  {renderRankBadge(leftOpponent.rank)}
                  {currentRoom.status === 'playing' && leftOpponent.rank === undefined && (
                    <span className="card-count-badge">{leftOpponent.handCount}</span>
                  )}
                  {leftOpponent.isHost && (
                    <Crown className="w-3 h-3 text-amber-400 fill-current ml-1" title="Chủ phòng" />
                  )}
                  {/* Catch UNO button for left opponent */}
                  {currentRoom.status === 'playing' && leftOpponent.rank === undefined && leftOpponent.handCount === 1 && !leftOpponent.hasCalledUno && (
                    <button
                      onClick={() => catchUnoPenalty(leftOpponent.id)}
                      className="text-[8px] font-black bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-1.5 py-0.2 rounded-full shadow-md animate-bounce ring-1 ring-red-300 ml-1 flex items-center gap-0.5 cursor-pointer"
                      title="Bắt phạt quên hô UNO (+2 lá)"
                    >
                      <AlertCircle className="w-2 h-2" /> Bắt UNO
                    </button>
                  )}
                </div>

                {currentRoom.status === 'playing' && leftOpponent.rank === undefined && (
                  <div className="flex flex-col items-center justify-center -space-y-6 pt-1">
                    {Array.from({ length: Math.min(leftOpponent.handCount, 6) }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{ zIndex: 20 - idx }}
                        className="rotate-90 transition-transform origin-center"
                        title="Bài đối thủ bên trái"
                      >
                        <UnoCard isBack size="sm" />
                      </div>
                    ))}
                    {leftOpponent.handCount > 6 && (
                      <span className="text-[10px] text-amber-300 font-bold pt-1">+{leftOpponent.handCount - 6}</span>
                    )}
                  </div>
                )}
              </div>
            ) : currentRoom.status === 'waiting' && currentRoom.maxPlayers >= 3 ? (
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-600 bg-slate-950 flex items-center justify-center text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">Chờ người chơi</span>
              </div>
            ) : null}
          </div>

          {/* RIGHT OPPONENT SLOT */}
          <div id="slot-right" className="player-slot right">
            {rightOpponent ? (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`player-tag ${
                    rightOpponent.id === activePlayer?.id && rightOpponent.rank === undefined ? 'active' : ''
                  }`}
                >
                  {renderAvatar(rightOpponent, rightOpponent.id === activePlayer?.id)}
                  <div className="flex flex-col items-start leading-tight">
                    <span className="player-name max-w-[80px] truncate">{getDisplayName(rightOpponent)}</span>
                    {isBot(rightOpponent) && (
                      <span className="text-[8px] font-black bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 px-1 py-0.2 rounded-full flex items-center gap-0.5 shadow-sm mt-0.5 animate-pulse">
                        <Bot className="w-2 h-2 text-cyan-400" /> Bot đang đánh
                      </span>
                    )}
                  </div>
                  {renderRankBadge(rightOpponent.rank)}
                  {currentRoom.status === 'playing' && rightOpponent.rank === undefined && (
                    <span className="card-count-badge">{rightOpponent.handCount}</span>
                  )}
                  {rightOpponent.isHost && (
                    <Crown className="w-3 h-3 text-amber-400 fill-current ml-1" title="Chủ phòng" />
                  )}
                  {/* Catch UNO button for right opponent */}
                  {currentRoom.status === 'playing' && rightOpponent.rank === undefined && rightOpponent.handCount === 1 && !rightOpponent.hasCalledUno && (
                    <button
                      onClick={() => catchUnoPenalty(rightOpponent.id)}
                      className="text-[8px] font-black bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-1.5 py-0.2 rounded-full shadow-md animate-bounce ring-1 ring-red-300 ml-1 flex items-center gap-0.5 cursor-pointer"
                      title="Bắt phạt quên hô UNO (+2 lá)"
                    >
                      <AlertCircle className="w-2 h-2" /> Bắt UNO
                    </button>
                  )}
                </div>

                {currentRoom.status === 'playing' && rightOpponent.rank === undefined && (
                  <div className="flex flex-col items-center justify-center -space-y-6 pt-1">
                    {Array.from({ length: Math.min(rightOpponent.handCount, 6) }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{ zIndex: 20 - idx }}
                        className="-rotate-90 transition-transform origin-center"
                        title="Bài đối thủ bên phải"
                      >
                        <UnoCard isBack size="sm" />
                      </div>
                    ))}
                    {rightOpponent.handCount > 6 && (
                      <span className="text-[10px] text-amber-300 font-bold pt-1">+{rightOpponent.handCount - 6}</span>
                    )}
                  </div>
                )}
              </div>
            ) : currentRoom.status === 'waiting' && currentRoom.maxPlayers >= 4 ? (
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-600 bg-slate-950 flex items-center justify-center text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">Chờ người chơi</span>
              </div>
            ) : null}
          </div>

          {/* CENTER MAT: WAITING CONTROLS OR ACTIVE DECK PILE */}
          {currentRoom.status === 'waiting' ? (
            <div className="center-mat !flex-col !gap-3 max-w-xs sm:max-w-sm p-4 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl text-center z-20">
              <div className="flex items-center justify-center gap-2 text-indigo-300">
                <Users className="w-5 h-5" />
                <span className="text-sm font-bold text-white">
                  {currentRoom.players.length}/{currentRoom.maxPlayers} người chơi trong bàn
                </span>
              </div>

              {localPlayer.isHost ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  {currentRoom.players.length >= 2 ? (
                    <button
                      onClick={startGame}
                      className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 px-5 py-3 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 animate-pulse cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>BẮT ĐẦU VÁN ĐẤU</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <button
                        onClick={startGame}
                        className="w-full bg-slate-800 text-slate-400 border border-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                        title="Cần ít nhất 2 người chơi để bắt đầu"
                      >
                        <Play className="w-4 h-4 opacity-50" />
                        <span>Cần ít nhất 2 người để bắt đầu</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Đang chờ người chơi khác vào bàn...
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      {currentRoom.players.length >= 2
                        ? 'Đã đủ người • Chờ chủ phòng bắt đầu'
                        : 'Chờ thêm người chơi vào bàn...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="center-mat">
              {/* DECK PILE */}
              <div className="text-center flex flex-col items-center gap-1">
                <div
                  id="deck-pile"
                  onClick={isLocalTurn ? drawCard : undefined}
                  className={`relative ${
                    isLocalTurn
                      ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'
                      : 'cursor-not-allowed opacity-85'
                  }`}
                  title={
                    isLocalTurn
                      ? currentRoom.settings.drawUntilPlayable
                        ? 'Bấm để bốc bài (Luật Rừng: bốc đến khi có lá đánh được)'
                        : 'Bấm để bốc bài'
                      : 'Chưa đến lượt của bạn'
                  }
                >
                  <UnoCard isBack size="md" />
                  {isLocalTurn && (
                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 bg-[#ffaf40] text-slate-950 text-[10px] font-black rounded-full shadow-md animate-pulse">
                      {currentRoom.settings.drawUntilPlayable ? '🌳 Bốc (Luật Rừng)' : 'Bốc bài'}
                    </div>
                  )}
                </div>
              </div>

              {/* DISCARD PILE */}
              <div className="text-center flex flex-col items-center gap-1">
                <div id="discard-pile">
                  <UnoCard
                    card={currentRoom.currentCard}
                    size="md"
                    showChosenColorGlow={true}
                  />
                </div>
              </div>

              {/* DIRECTION INDICATOR */}
              <div className="flex flex-col items-center justify-center p-1 bg-slate-950/60 rounded-xl border border-white/10">
                <span className="text-[9px] text-slate-400 font-bold mb-0.5">Chiều</span>
                {currentRoom.playDirection === 1 ? (
                  <RotateCw className="w-4 h-4 text-[#32ff7e] animate-spin" style={{ animationDuration: '6s' }} />
                ) : (
                  <RotateCcw className="w-4 h-4 text-[#ffaf40] animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                )}
              </div>
            </div>
          )}

          {/* BOTTOM PLAYER SLOT (LOCAL PLAYER) */}
          <div id="slot-bottom" className="player-slot bottom w-full max-w-2xl px-2">
            <div className="flex flex-col items-center w-full gap-1.5">
              {/* Player Tag */}
              <div className="flex items-center justify-between w-full px-3 py-1 bg-slate-950/80 rounded-2xl border border-white/10">
                <div
                  className={`player-tag ${
                    isLocalTurn && localPlayer.rank === undefined ? 'active' : ''
                  }`}
                >
                  {renderAvatar(localPlayer, isLocalTurn)}
                  <span className="player-name max-w-[120px] truncate">{localPlayer.name}</span>
                  {renderRankBadge(localPlayer.rank)}
                  {currentRoom.status === 'playing' && localPlayer.rank === undefined && (
                    <span className="card-count-badge">{localPlayer.hand.length} lá</span>
                  )}
                  <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded ml-1">
                    Bạn
                  </span>
                  {localPlayer.isHost && (
                    <Crown className="w-3 h-3 text-amber-400 fill-current ml-1" title="Chủ phòng" />
                  )}
                </div>

                {/* Hand Action Controls */}
                {currentRoom.status === 'playing' && localPlayer.rank === undefined && localPlayer.hand.length <= 2 && (
                  <div className="flex items-center gap-2">
                    <button
                      id="call-uno-button"
                      onClick={callUno}
                      className={`flex items-center gap-1 px-3 py-1 font-black text-xs rounded-xl uppercase tracking-wider transition-all active:scale-95 shadow-md ${
                        localPlayer.hasCalledUno
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-[#ff3838] to-[#ffaf40] text-slate-950 animate-bounce ring-2 ring-yellow-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {localPlayer.hasCalledUno ? 'ĐÃ HÔ UNO!' : 'HÔ UNO! 🔥'}
                    </button>
                  </div>
                )}
              </div>

              {/* Hand Cards / Finished Status Banner */}
              <div className="hand-container w-full overflow-x-auto py-2 px-3 min-h-[125px] flex items-center justify-center">
                {currentRoom.status === 'playing' ? (
                  localPlayer.rank !== undefined ? (
                    <div className="w-full max-w-md bg-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-4 text-center shadow-lg backdrop-blur-md animate-fade-in my-1">
                      <div className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-2 mb-1">
                        <span>🎉 BẠN ĐÃ VỀ ĐÍCH HẠNG {localPlayer.rank}!</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Bạn đã đánh hết bài. Đang theo dõi các người chơi còn lại tiếp tục thi đấu... 🍿
                      </p>
                    </div>
                  ) : (
                    localPlayer.hand.map((card, idx) => {
                      const playable = isLocalTurn && isValidCardPlay(card, currentRoom.currentCard, currentRoom.currentColor);
                      const totalCards = localPlayer.hand.length;
                      // Mỗi lá đè lên khoảng 1/4 lá bài sau, tự động thu gọn nếu có nhiều bài để vừa màn hình
                      const dynamicMargin = idx === 0 
                        ? '0px' 
                        : totalCards <= 6 
                        ? '-18px' 
                        : totalCards <= 10 
                        ? '-26px' 
                        : totalCards <= 15 
                        ? '-36px' 
                        : '-46px';

                      return (
                        <div
                          key={card.id}
                          style={{
                            zIndex: localPlayer.hand.length - idx,
                            marginLeft: dynamicMargin,
                          }}
                          className="relative transition-all duration-200 hover:!z-50 shrink-0 cursor-pointer"
                        >
                          <UnoCard
                            card={card}
                            isPlayable={playable}
                            onClick={playable ? () => handleCardClick(card.id) : undefined}
                            size="md"
                          />
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="text-center py-4 text-xs font-bold text-slate-400">
                    {localPlayer.isHost
                      ? currentRoom.players.length >= 2
                        ? 'Nhấn "BẮT ĐẦU VÁN ĐẤU" ở giữa bàn để chia bài và chơi!'
                        : 'Chờ có ít nhất 2 người chơi vào bàn để bắt đầu...'
                      : currentRoom.players.length >= 2
                      ? 'Đã vào bàn chơi • Chờ chủ phòng bắt đầu chia bài...'
                      : 'Chờ thêm người chơi tham gia bàn đấu...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* IN-GAME CHAT OVERLAY DRAWER */}
      {isChatOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-3xl p-3.5 shadow-2xl animate-fade-in flex flex-col h-80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#18dcff]" />
              Chat Trực Tiếp
            </span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 pr-1">
            {currentRoom.chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`text-[11px] p-2 rounded-xl ${
                  msg.senderId === localPlayer.id
                    ? 'bg-[#18dcff]/15 border border-[#18dcff]/30 ml-4'
                    : 'bg-slate-950/60 border border-slate-800 mr-4'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                  <strong className={msg.senderId === localPlayer.id ? 'text-[#18dcff]' : 'text-slate-300'}>
                    {msg.senderName}
                  </strong>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="text-slate-200">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendInGameChat} className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              maxLength={100}
              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#18dcff]"
            />
            <button
              type="submit"
              className="p-1.5 bg-gradient-to-r from-[#32ff7e] to-[#18dcff] text-slate-950 rounded-xl font-bold hover:opacity-90"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* WILD COLOR PICKER MODAL */}
      <ColorPickerModal
        isOpen={Boolean(pendingWildCardId)}
        onSelectColor={handleSelectWildColor}
        isDrawFour={false}
      />

      {/* GAME OVER MODAL */}
      <GameOverModal
        isOpen={currentRoom.status === 'ended'}
        winner={currentRoom.winner}
        players={currentRoom.players}
        rankings={currentRoom.rankings}
        isHost={localPlayer.isHost}
        onRematch={rematch}
        onLeaveRoom={leaveRoom}
      />

      {/* RULE GUIDE MODAL */}
      <RuleGuideModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* GAME LOG MODAL */}
      <GameLogModal
        isOpen={isLogsOpen}
        logs={currentRoom.logs}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}
