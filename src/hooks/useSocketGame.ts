import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CardColor, ChatMessage, GameSettings, Player, RoomState, RoomSummary } from '../types';
import { sound } from '../utils/audio';

export function useSocketGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomsList, setRoomsList] = useState<RoomSummary[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unoAnnouncement, setUnoAnnouncement] = useState<{ playerName: string; timestamp: number } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('rooms_list_updated', (list: RoomSummary[]) => {
      setRoomsList(list);
    });

    newSocket.on('room_state_updated', (room: RoomState) => {
      setCurrentRoom(room);
    });

    newSocket.on('joined_room_success', ({ roomId, playerId }) => {
      setLocalPlayerId(playerId);
      setErrorMessage(null);
    });

    newSocket.on('left_room_success', () => {
      setCurrentRoom(null);
      setLocalPlayerId(null);
    });

    newSocket.on('error_message', (msg: string) => {
      setErrorMessage(msg);
      sound.playError();
      setTimeout(() => setErrorMessage(null), 4000);
    });

    newSocket.on('uno_shout_broadcast', ({ playerName }) => {
      setUnoAnnouncement({ playerName, timestamp: Date.now() });
      sound.playUno();
      setTimeout(() => setUnoAnnouncement(null), 3500);
    });

    newSocket.on('chat_received', (msg: ChatMessage) => {
      sound.playChat();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Action methods
  const createRoom = useCallback(
    (params: {
      roomName: string;
      roomPassword?: string;
      maxPlayers: number;
      playerName: string;
      avatar: string | null;
      settings: Partial<GameSettings>;
    }) => {
      if (socket) {
        socket.emit('create_room', params);
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (params: {
      roomId: string;
      roomPassword?: string;
      playerName: string;
      avatar: string | null;
    }) => {
      if (socket) {
        socket.emit('join_room', params);
      }
    },
    [socket]
  );

  const toggleReady = useCallback(() => {
    if (socket) {
      socket.emit('toggle_ready');
    }
  }, [socket]);

  const startGame = useCallback(() => {
    if (socket) {
      socket.emit('start_game');
    }
  }, [socket]);

  const addBot = useCallback(() => {
    if (socket) {
      socket.emit('add_bot');
    }
  }, [socket]);

  const playCard = useCallback(
    (cardId: string, chosenColor?: CardColor) => {
      if (socket) {
        socket.emit('play_card', { cardId, chosenColor });
      }
    },
    [socket]
  );

  const drawCard = useCallback(() => {
    if (socket) {
      socket.emit('draw_card');
    }
  }, [socket]);

  const callUno = useCallback(() => {
    if (socket) {
      socket.emit('call_uno');
    }
  }, [socket]);

  const catchUnoPenalty = useCallback(
    (targetPlayerId: number) => {
      if (socket) {
        socket.emit('catch_uno_penalty', { targetPlayerId });
      }
    },
    [socket]
  );

  const sendChat = useCallback(
    (text: string, isEmote?: boolean) => {
      if (socket && text.trim()) {
        const trimmed = text.trim().slice(0, 150);
        socket.emit('send_chat', { text: trimmed, isEmote });

        if (currentRoom && localPlayerId !== null) {
          const player = currentRoom.players.find(p => p.id === localPlayerId);
          if (player) {
            const optMsg: ChatMessage = {
              id: `chat_opt_${Date.now()}_${Math.random()}`,
              senderId: player.id,
              senderName: player.name,
              text: trimmed,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              isEmote,
            };
            setCurrentRoom({
              ...currentRoom,
              chatMessages: [...currentRoom.chatMessages.slice(-30), optMsg],
            });
          }
        }
      }
    },
    [socket, currentRoom, localPlayerId]
  );

  const updateProfile = useCallback(
    (name: string, avatar: string | null) => {
      if (socket) {
        socket.emit('update_profile', { name, avatar });
      }
    },
    [socket]
  );

  const rematch = useCallback(() => {
    if (socket) {
      socket.emit('rematch');
    }
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leave_room');
    }
  }, [socket]);

  const localPlayer: Player | undefined = currentRoom?.players.find(
    p => p.id === localPlayerId
  );

  return {
    socket,
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
    addBot,
    playCard,
    drawCard,
    callUno,
    catchUnoPenalty,
    sendChat,
    updateProfile,
    rematch,
    leaveRoom,
    clearError: () => setErrorMessage(null),
  };
}
