import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import {
  Card,
  CardColor,
  CardValue,
  ChatMessage,
  GameLog,
  GameSettings,
  Player,
  PlayerRanking,
  RoomState,
  RoomSummary,
} from './src/types';

interface ServerRoom {
  roomId: string;
  roomName: string;
  roomPassword?: string;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  hostSocketId: string;
  hostId: number;
  players: (Player & { socketId: string })[];
  deck: Card[];
  discardPile: Card[];
  currentCard: Card | null;
  currentColor: CardColor;
  currentTurnIndex: number;
  playDirection: 1 | -1;
  settings: GameSettings;
  logs: GameLog[];
  winner: Player | null;
  rankings?: PlayerRanking[];
  chatMessages: ChatMessage[];
  lastActionAnnouncement?: string;
  turnTimeout?: NodeJS.Timeout;
}

// Map to track pending UNO penalty timers for players who just dropped to 1 card
const unoPendingTimers = new Map<string, NodeJS.Timeout>();

const colors: CardColor[] = ['red', 'yellow', 'green', 'blue'];
const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'SKIP', 'REV', '+2'];

function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;

  for (const color of colors) {
    deck.push({ id: `card_${id++}`, color, value: '0' });
    for (const val of values.slice(1)) {
      deck.push({ id: `card_${id++}`, color, value: val });
      deck.push({ id: `card_${id++}`, color, value: val });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${id++}`, color: 'wild', value: 'WILD' });
    deck.push({ id: `card_${id++}`, color: 'wild', value: '+4' });
  }

  return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getColorNameVietnamese(color: CardColor): string {
  switch (color) {
    case 'red': return 'Đỏ';
    case 'yellow': return 'Vàng';
    case 'green': return 'Xanh lá';
    case 'blue': return 'Xanh dương';
    case 'wild': return 'Đổi màu';
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const PORT = 3000;
  const rooms = new Map<string, ServerRoom>();

  // Helper to serialize room state safely per socket (so opponent cards remain hidden!)
  function getSanitizedRoomState(room: ServerRoom, targetSocketId: string): RoomState {
    const targetPlayer = room.players.find(p => p.socketId === targetSocketId);

    const sanitizedPlayers: Player[] = room.players.map(p => ({
      id: p.id,
      socketId: p.socketId,
      name: p.name,
      avatar: p.avatar,
      isReady: p.isReady,
      isHost: p.isHost,
      handCount: p.hand.length,
      // Only include actual cards if this is the target player themselves
      hand: p.socketId === targetSocketId ? p.hand : [],
      hasCalledUno: p.hasCalledUno,
      isConnected: p.isConnected,
      score: p.score,
      cardsPlayed: p.cardsPlayed,
      rank: p.rank,
      roundScore: p.roundScore,
    }));

    return {
      roomId: room.roomId,
      roomName: room.roomName,
      hasPassword: Boolean(room.roomPassword && room.roomPassword.length > 0),
      maxPlayers: room.maxPlayers,
      status: room.status,
      hostId: room.hostId,
      players: sanitizedPlayers,
      currentCard: room.currentCard,
      currentColor: room.currentColor,
      currentTurnIndex: room.currentTurnIndex,
      playDirection: room.playDirection,
      deckCount: room.deck.length,
      settings: room.settings,
      logs: room.logs,
      winner: room.winner,
      rankings: room.rankings,
      chatMessages: room.chatMessages,
      lastActionAnnouncement: room.lastActionAnnouncement,
    };
  }

  function broadcastRoomUpdate(room: ServerRoom) {
    for (const player of room.players) {
      if (player.isConnected) {
        const state = getSanitizedRoomState(room, player.socketId);
        io.to(player.socketId).emit('room_state_updated', state);
      }
    }
  }

  function broadcastRoomsList() {
    const list: RoomSummary[] = [];
    rooms.forEach(r => {
      const host = r.players.find(p => p.isHost);
      list.push({
        id: r.roomId,
        name: r.roomName,
        hasPassword: Boolean(r.roomPassword && r.roomPassword.length > 0),
        playerCount: r.players.filter(p => p.isConnected).length,
        maxPlayers: r.maxPlayers,
        status: r.status,
        hostName: host ? host.name : 'Chủ phòng',
      });
    });
    io.emit('rooms_list_updated', list);
  }

  function addRoomLog(room: ServerRoom, playerId: number, message: string, type: GameLog['type'] = 'play', card?: Card) {
    const p = room.players.find(pl => pl.id === playerId);
    const newLog: GameLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      playerId,
      playerName: p ? p.name : 'Hệ thống',
      message,
      type,
      card,
    };
    room.logs = [newLog, ...room.logs.slice(0, 49)];
  }

  function getNextPlayerIndex(room: ServerRoom, steps: number = 1): number {
    const activePlayers = room.players.filter(p => p.isConnected && p.rank === undefined && p.hand.length > 0);
    if (activePlayers.length === 0) return 0;

    let next = room.currentTurnIndex;
    let stepsLeft = steps;
    let attempts = 0;

    while (stepsLeft > 0 && attempts < room.players.length * 3) {
      next = (next + room.playDirection) % room.players.length;
      while (next < 0) next += room.players.length;
      attempts++;
      const candidate = room.players[next];
      if (candidate && candidate.isConnected && candidate.rank === undefined && candidate.hand.length > 0) {
        stepsLeft--;
      }
    }

    return next;
  }

  function handlePlayerFinishedHand(room: ServerRoom, player: Player, skipTurn: boolean, nextIdx: number) {
    if (player.rank !== undefined) return;

    const finishedCount = room.players.filter(p => p.rank !== undefined).length;
    const assignedRank = finishedCount + 1;
    player.rank = assignedRank;

    if (assignedRank === 1) {
      room.winner = player;
      addRoomLog(room, player.id, `Đã đánh hết bài và giành Hạng 1 (Quán Quân)! 🥇`, 'win');
    } else {
      const medal = assignedRank === 2 ? '🥈' : assignedRank === 3 ? '🥉' : '🎖️';
      addRoomLog(room, player.id, `Đã đánh hết bài và giành Hạng ${assignedRank}! ${medal}`, 'win');
    }

    const remainingActive = room.players.filter(p => p.isConnected && p.rank === undefined && p.hand.length > 0);

    if (remainingActive.length <= 1) {
      if (remainingActive.length === 1) {
        remainingActive[0].rank = room.players.length;
        addRoomLog(room, remainingActive[0].id, `Về đích cuối cùng (Hạng ${room.players.length})`, 'system');
      }

      // Finalize match & calculate score points
      room.status = 'ended';

      const rankPoints: Record<number, number> = {
        1: 300,
        2: 150,
        3: 75,
        4: 25,
      };

      room.players.forEach(p => {
        const r = p.rank || room.players.length;
        const pts = rankPoints[r] || 25;
        p.roundScore = pts;
        p.score = (p.score || 0) + pts;
      });

      room.rankings = room.players
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          avatar: p.avatar,
          rank: p.rank || room.players.length,
          scoreEarned: p.roundScore || 0,
          totalScore: p.score || 0,
          cardsPlayed: p.cardsPlayed || 0,
          isAi: p.socketId.startsWith('ai_'),
        }))
        .sort((a, b) => a.rank - b.rank);

      room.lastActionAnnouncement = `🎉 Trận đấu hoàn tất! Hãy xem bảng xếp hạng tổng kết.`;
    } else {
      room.lastActionAnnouncement = `🎉 ${player.name} đã về đích Hạng ${assignedRank}! ${remainingActive.length} người chơi còn lại tiếp tục đấu...`;
      room.currentTurnIndex = skipTurn ? getNextPlayerIndex(room, 2) : nextIdx;
    }
  }

  function drawCardsForPlayer(room: ServerRoom, player: Player, count: number) {
    for (let i = 0; i < count; i++) {
      if (room.deck.length === 0) {
        if (room.discardPile.length <= 1) break;
        const top = room.discardPile[room.discardPile.length - 1];
        const cardsToShuffle = room.discardPile.slice(0, room.discardPile.length - 1);
        room.deck = shuffle(cardsToShuffle);
        room.discardPile = [top];
      }
      if (room.deck.length > 0) {
        player.hand.push(room.deck.pop()!);
      }
    }
  }

  function executeAiMove(room: ServerRoom) {
    if (room.status !== 'playing') return;
    const activePlayer = room.players[room.currentTurnIndex];
    if (!activePlayer || !activePlayer.socketId.startsWith('ai_') || activePlayer.rank !== undefined) return;

    setTimeout(() => {
      if (room.status !== 'playing') return;
      const currentActive = room.players[room.currentTurnIndex];
      if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.socketId.startsWith('ai_') || currentActive.rank !== undefined) return;

      // Find playable cards
      const playableCards = currentActive.hand.filter(
        c => c.color === 'wild' || c.color === room.currentColor || c.value === room.currentCard?.value
      );

      if (playableCards.length > 0) {
        // AI chooses playable card
        const chosenCard = playableCards[0];
        const cardIdx = currentActive.hand.findIndex(c => c.id === chosenCard.id);
        currentActive.hand.splice(cardIdx, 1);
        currentActive.cardsPlayed++;

        let chosenColor: CardColor = 'red';
        if (chosenCard.color === 'wild') {
          const colorCounts: Record<CardColor, number> = { red: 0, yellow: 0, green: 0, blue: 0, wild: 0 };
          currentActive.hand.forEach(c => {
            if (c.color !== 'wild') colorCounts[c.color]++;
          });
          const best = (Object.entries(colorCounts) as [CardColor, number][]).sort((a, b) => b[1] - a[1])[0][0];
          chosenColor = best && best !== 'wild' ? best : 'red';
        }

        if (currentActive.hand.length === 1) {
          currentActive.hasCalledUno = true;
          io.to(room.roomId).emit('uno_shout_broadcast', { playerName: currentActive.name });
        }

        const playedCard: Card = {
          ...chosenCard,
          selectedColor: chosenCard.color === 'wild' ? chosenColor : chosenCard.color,
        };

        room.currentCard = playedCard;
        room.currentColor = chosenCard.color === 'wild' ? chosenColor : chosenCard.color;
        room.discardPile.push(playedCard);

        let skipTurn = false;
        let nextIdx = getNextPlayerIndex(room, 1);

        if (chosenCard.value === '+4') {
          const nextPlayer = room.players[nextIdx];
          drawCardsForPlayer(room, nextPlayer, 4);
          room.lastActionAnnouncement = `${currentActive.name} đánh +4! ${nextPlayer.name} bị bốc 4 lá và mất lượt.`;
          addRoomLog(room, currentActive.id, `Đánh +4 và chọn màu ${getColorNameVietnamese(chosenColor)}! ${nextPlayer.name} bị bốc 4 lá!`, 'play', chosenCard);
          skipTurn = true;
        } else if (chosenCard.value === '+2') {
          const nextPlayer = room.players[nextIdx];
          drawCardsForPlayer(room, nextPlayer, 2);
          room.lastActionAnnouncement = `${currentActive.name} đánh +2! ${nextPlayer.name} bị bốc 2 lá và mất lượt.`;
          addRoomLog(room, currentActive.id, `Đánh +2! ${nextPlayer.name} bị bốc 2 lá!`, 'play', chosenCard);
          skipTurn = true;
        } else if (chosenCard.value === 'SKIP') {
          const nextPlayer = room.players[nextIdx];
          room.lastActionAnnouncement = `${currentActive.name} đánh ⛔ SKIP! ${nextPlayer.name} bị mất lượt.`;
          addRoomLog(room, currentActive.id, `Đánh ⛔ SKIP! ${nextPlayer.name} bị mất lượt!`, 'skip', chosenCard);
          skipTurn = true;
        } else if (chosenCard.value === 'REV') {
          room.playDirection = (room.playDirection * -1) as 1 | -1;
          room.lastActionAnnouncement = `${currentActive.name} đánh 🔄 REVERSE! Đổi chiều đánh.`;
          addRoomLog(room, currentActive.id, `Đánh 🔄 REVERSE! Đổi chiều chơi.`, 'reverse', chosenCard);
          if (room.players.length === 2) skipTurn = true;
          else nextIdx = getNextPlayerIndex(room, 1);
        } else if (chosenCard.color === 'wild') {
          room.lastActionAnnouncement = `${currentActive.name} đánh WILD và chọn màu ${getColorNameVietnamese(chosenColor)}!`;
          addRoomLog(room, currentActive.id, `Đánh WILD và chọn màu ${getColorNameVietnamese(chosenColor)}!`, 'color', chosenCard);
        } else {
          room.lastActionAnnouncement = `${currentActive.name} đánh lá ${chosenCard.value} ${getColorNameVietnamese(chosenCard.color)}`;
          addRoomLog(room, currentActive.id, `Đánh lá ${chosenCard.value} ${getColorNameVietnamese(chosenCard.color)}`, 'play', chosenCard);
        }

        if (currentActive.hand.length === 0) {
          handlePlayerFinishedHand(room, currentActive, skipTurn, nextIdx);
        } else {
          room.currentTurnIndex = skipTurn ? getNextPlayerIndex(room, 2) : nextIdx;
        }

        broadcastRoomUpdate(room);
        if (room.status === 'playing') {
          executeAiMove(room);
        }
      } else {
        // AI has no playable card in current hand
        if (room.settings.drawUntilPlayable) {
          // Luật Rừng: AI bốc liên tục đến khi nào có lá bài đánh được
          const drawStep = (attempt: number) => {
            if (room.status !== 'playing') return;
            const currentAi = room.players[room.currentTurnIndex];
            if (!currentAi || currentAi.id !== activePlayer.id || !currentAi.socketId.startsWith('ai_') || currentAi.rank !== undefined) return;

            drawCardsForPlayer(room, currentAi, 1);
            const drawn = currentAi.hand[currentAi.hand.length - 1];
            const isPlayable = drawn && (
              drawn.color === 'wild' ||
              drawn.color === room.currentColor ||
              drawn.value === room.currentCard?.value
            );

            if (isPlayable) {
              room.lastActionAnnouncement = `${currentAi.name} bốc được lá hợp lệ sau ${attempt} lần bốc [Luật Rừng]!`;
              addRoomLog(room, currentAi.id, `Đã bốc được lá bài hợp lệ sau ${attempt} lần bốc (Luật Rừng)!`, 'draw');
              broadcastRoomUpdate(room);

              // Delay slightly then play the card
              setTimeout(() => {
                executeAiMove(room);
              }, 600);
            } else if (attempt < 15) {
              room.lastActionAnnouncement = `${currentAi.name} bốc 1 lá (chưa có bài đánh, tiếp tục bốc...) [Luật Rừng]`;
              addRoomLog(room, currentAi.id, `Bốc bài lần ${attempt} chưa có lá đánh được (Luật Rừng).`, 'draw');
              broadcastRoomUpdate(room);
              setTimeout(() => drawStep(attempt + 1), 400);
            } else {
              // Safety fallback
              room.lastActionAnnouncement = `${currentAi.name} đã bốc nhiều lá bài.`;
              room.currentTurnIndex = getNextPlayerIndex(room, 1);
              broadcastRoomUpdate(room);
              if (room.status === 'playing') {
                executeAiMove(room);
              }
            }
          };

          drawStep(1);
        } else {
          // Standard rules: Draw 1 card
          drawCardsForPlayer(room, currentActive, 1);
          const drawnCard = currentActive.hand[currentActive.hand.length - 1];
          const isDrawnPlayable =
            drawnCard &&
            (drawnCard.color === 'wild' ||
              drawnCard.color === room.currentColor ||
              drawnCard.value === room.currentCard?.value);

          if (isDrawnPlayable) {
            currentActive.hand.pop();
            currentActive.cardsPlayed++;
            let chosenColor: CardColor = drawnCard.color === 'wild' ? 'red' : drawnCard.color;

            const playedCard: Card = {
              ...drawnCard,
              selectedColor: chosenColor,
            };
            room.currentCard = playedCard;
            room.currentColor = chosenColor;
            room.discardPile.push(playedCard);

            if (currentActive.hand.length === 1) {
              currentActive.hasCalledUno = true;
              io.to(room.roomId).emit('uno_shout_broadcast', { playerName: currentActive.name });
            }

            room.lastActionAnnouncement = `${currentActive.name} bốc được lá hợp lệ và đánh luôn!`;
            addRoomLog(room, currentActive.id, `Bốc và đánh lá ${drawnCard.value}`, 'play', drawnCard);

            if (currentActive.hand.length === 0) {
              handlePlayerFinishedHand(room, currentActive, false, getNextPlayerIndex(room, 1));
            } else {
              room.currentTurnIndex = getNextPlayerIndex(room, 1);
            }
          } else {
            room.lastActionAnnouncement = `${currentActive.name} đã bốc 1 lá bài.`;
            addRoomLog(room, currentActive.id, `Đã rút 1 lá bài.`, 'draw');
            room.currentTurnIndex = getNextPlayerIndex(room, 1);
          }

          broadcastRoomUpdate(room);
          if (room.status === 'playing') {
            executeAiMove(room);
          }
        }
      }
    }, 1000);
  }

  // Socket.IO Connection Handler
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentUserId: number | null = null;

    // Send initial list of rooms
    socket.emit('rooms_list_updated', Array.from(rooms.values()).map(r => ({
      id: r.roomId,
      name: r.roomName,
      hasPassword: Boolean(r.roomPassword && r.roomPassword.length > 0),
      playerCount: r.players.filter(p => p.isConnected).length,
      maxPlayers: r.maxPlayers,
      status: r.status,
      hostName: r.players.find(p => p.isHost)?.name || 'Chủ phòng',
    })));

    // 1. Create Room
    socket.on('create_room', ({ roomName, roomPassword, maxPlayers, playerName, avatar, settings }) => {
      const roomId = `room_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
      const safeRoomName = (roomName || 'Phòng VIP').trim();
      const numPlayers = Math.min(Math.max(parseInt(maxPlayers, 10) || 4, 2), 4);

      const hostPlayer: Player & { socketId: string } = {
        id: 0,
        socketId: socket.id,
        name: (playerName || 'Chủ phòng').trim(),
        avatar: avatar || null,
        isReady: true,
        isHost: true,
        handCount: 0,
        hand: [],
        hasCalledUno: false,
        isConnected: true,
        score: 0,
        cardsPlayed: 0,
      };

      const newRoom: ServerRoom = {
        roomId,
        roomName: safeRoomName,
        roomPassword: roomPassword ? roomPassword.trim() : undefined,
        maxPlayers: numPlayers,
        status: 'waiting',
        hostSocketId: socket.id,
        hostId: 0,
        players: [hostPlayer],
        deck: [],
        discardPile: [],
        currentCard: null,
        currentColor: 'red',
        currentTurnIndex: 0,
        playDirection: 1,
        settings: {
          roomName: safeRoomName,
          roomPassword: roomPassword ? roomPassword.trim() : undefined,
          numPlayers,
          enableTurnTimer: settings?.enableTurnTimer || false,
          turnDuration: settings?.turnDuration || 20,
          enableUnoPenalty: settings?.enableUnoPenalty ?? true,
          stackingDrawTwo: settings?.stackingDrawTwo ?? false,
          drawUntilPlayable: Boolean(settings?.drawUntilPlayable),
          soundEnabled: true,
        },
        logs: [],
        winner: null,
        chatMessages: [],
        lastActionAnnouncement: `Chào mừng đến với ${safeRoomName}! Chờ người chơi khác tham gia...`,
      };

      rooms.set(roomId, newRoom);
      socket.join(roomId);
      currentRoomId = roomId;
      currentUserId = 0;

      addRoomLog(newRoom, 0, `Đã tạo phòng ${safeRoomName}`, 'system');
      broadcastRoomUpdate(newRoom);
      broadcastRoomsList();

      socket.emit('joined_room_success', { roomId, playerId: 0 });
    });

    // 2. Join Room
    socket.on('join_room', ({ roomId, roomPassword, playerName, avatar }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error_message', 'Phòng chơi không tồn tại hoặc đã bị đóng!');
        return;
      }

      if (room.roomPassword && room.roomPassword !== (roomPassword || '').trim()) {
        socket.emit('error_message', 'Mật khẩu phòng không đúng!');
        return;
      }

      if (room.status === 'playing') {
        socket.emit('error_message', 'Ván đấu trong phòng đang diễn ra!');
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('error_message', 'Phòng đã đủ người chơi!');
        return;
      }

      // Assign unique ID 0..maxPlayers-1
      const existingIds = new Set(room.players.map(p => p.id));
      let newId = 0;
      while (existingIds.has(newId)) newId++;

      const newPlayer: Player & { socketId: string } = {
        id: newId,
        socketId: socket.id,
        name: (playerName || `Người chơi ${newId + 1}`).trim(),
        avatar: avatar || null,
        isReady: false,
        isHost: false,
        handCount: 0,
        hand: [],
        hasCalledUno: false,
        isConnected: true,
        score: 0,
        cardsPlayed: 0,
      };

      room.players.push(newPlayer);
      socket.join(roomId);
      currentRoomId = roomId;
      currentUserId = newId;

      addRoomLog(room, newId, `Đã tham gia phòng chơi`, 'system');
      room.lastActionAnnouncement = `${newPlayer.name} đã vào phòng (${room.players.length}/${room.maxPlayers})`;

      broadcastRoomUpdate(room);
      broadcastRoomsList();

      socket.emit('joined_room_success', { roomId, playerId: newId });
    });

    // 3. Toggle Ready
    socket.on('toggle_ready', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'waiting') return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player && !player.isHost) {
        player.isReady = !player.isReady;
        broadcastRoomUpdate(room);
      }
    });

    // 4. Start Game (Host only - requires at least 2 players)
    socket.on('start_game', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || (room.status !== 'waiting' && room.status !== 'ended')) return;
      if (room.hostSocketId !== socket.id) {
        socket.emit('error_message', 'Chỉ chủ phòng mới có quyền bắt đầu ván đấu!');
        return;
      }

      // Must have at least 2 players to start the game
      if (room.players.length < 2) {
        socket.emit('error_message', 'Cần ít nhất 2 người chơi trong phòng để bắt đầu ván đấu!');
        return;
      }

      // Setup initial game deck
      const newDeck = generateDeck();
      room.deck = newDeck;
      room.status = 'playing';
      room.winner = null;
      room.rankings = undefined;
      room.playDirection = 1;
      room.currentTurnIndex = 0;

      // Deal 7 cards each
      room.players.forEach(p => {
        p.hand = [];
        p.hasCalledUno = false;
        p.isReady = true;
        p.rank = undefined;
        p.roundScore = 0;
        p.cardsPlayed = 0;
        for (let i = 0; i < 7; i++) {
          p.hand.push(room.deck.pop()!);
        }
      });

      // Flip first non-wild card
      let firstCard: Card;
      do {
        firstCard = room.deck.pop()!;
      } while (firstCard.color === 'wild');

      room.discardPile = [firstCard];
      room.currentCard = firstCard;
      room.currentColor = firstCard.color;
      room.lastActionAnnouncement = `Ván mới bắt đầu! Lượt đầu tiên của ${room.players[0].name}`;

      addRoomLog(room, room.players[0].id, `Bắt đầu ván đấu mới!`, 'system');
      broadcastRoomUpdate(room);
      broadcastRoomsList();

      // Trigger AI if first player is AI
      if (room.players[0].socketId.startsWith('ai_')) {
        executeAiMove(room);
      }
    });

    // 5. Play Card
    socket.on('play_card', ({ cardId, chosenColor }: { cardId: string; chosenColor?: CardColor }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'playing') return;

      const playerIdx = room.currentTurnIndex;
      const activePlayer = room.players[playerIdx];

      if (!activePlayer || activePlayer.socketId !== socket.id) {
        socket.emit('error_message', 'Chưa đến lượt của bạn!');
        return;
      }

      const cardIdx = activePlayer.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) {
        socket.emit('error_message', 'Lá bài không tồn tại trên tay!');
        return;
      }

      const card = activePlayer.hand[cardIdx];

      // Validate move
      const isValid =
        card.color === 'wild' ||
        card.color === room.currentColor ||
        card.value === room.currentCard?.value;

      if (!isValid) {
        socket.emit('error_message', 'Lá bài không hợp lệ!');
        return;
      }

      // Remove card from hand
      activePlayer.hand.splice(cardIdx, 1);
      activePlayer.cardsPlayed++;

      const playedCard: Card = {
        ...card,
        selectedColor: chosenColor || card.color,
      };

      room.currentCard = playedCard;
      room.currentColor = chosenColor || card.color;
      room.discardPile.push(playedCard);

      // Handle card effects
      let skipTurn = false;
      let nextIdx = getNextPlayerIndex(room, 1);

      if (card.value === '+4') {
        const nextPlayer = room.players[nextIdx];
        drawCardsForPlayer(room, nextPlayer, 4);
        room.lastActionAnnouncement = `${activePlayer.name} đánh +4! ${nextPlayer.name} bị bốc 4 lá và mất lượt.`;
        addRoomLog(room, activePlayer.id, `Đánh +4 và chọn màu ${getColorNameVietnamese(chosenColor || 'red')}. ${nextPlayer.name} bị bốc 4 lá!`, 'play', card);
        skipTurn = true;
      } else if (card.value === '+2') {
        const nextPlayer = room.players[nextIdx];
        drawCardsForPlayer(room, nextPlayer, 2);
        room.lastActionAnnouncement = `${activePlayer.name} đánh +2! ${nextPlayer.name} bị bốc 2 lá và mất lượt.`;
        addRoomLog(room, activePlayer.id, `Đánh +2! ${nextPlayer.name} bị bốc 2 lá!`, 'play', card);
        skipTurn = true;
      } else if (card.value === 'SKIP') {
        const nextPlayer = room.players[nextIdx];
        room.lastActionAnnouncement = `${activePlayer.name} đánh ⛔ SKIP! ${nextPlayer.name} bị mất lượt.`;
        addRoomLog(room, activePlayer.id, `Đánh ⛔ SKIP! ${nextPlayer.name} bị mất lượt!`, 'skip', card);
        skipTurn = true;
      } else if (card.value === 'REV') {
        room.playDirection = (room.playDirection * -1) as 1 | -1;
        room.lastActionAnnouncement = `${activePlayer.name} đánh 🔄 REVERSE! Đổi chiều đánh.`;
        addRoomLog(room, activePlayer.id, `Đánh 🔄 REVERSE! Đổi chiều chơi.`, 'reverse', card);

        if (room.players.length === 2) {
          skipTurn = true;
        } else {
          nextIdx = getNextPlayerIndex(room, 1);
        }
      } else if (card.color === 'wild') {
        room.lastActionAnnouncement = `${activePlayer.name} đánh WILD và chọn màu ${getColorNameVietnamese(chosenColor || 'red')}!`;
        addRoomLog(room, activePlayer.id, `Đánh WILD và chọn màu ${getColorNameVietnamese(chosenColor || 'red')}!`, 'color', card);
      } else {
        room.lastActionAnnouncement = `${activePlayer.name} đánh lá ${card.value} ${getColorNameVietnamese(card.color)}`;
        addRoomLog(room, activePlayer.id, `Đánh lá ${card.value} ${getColorNameVietnamese(card.color)}`, 'play', card);
      }

      // Check UNO Penalty: when player drops to 1 card, they must call UNO immediately
      if (activePlayer.hand.length === 1 && !activePlayer.hasCalledUno && room.settings.enableUnoPenalty) {
        const timeoutKey = `${room.roomId}_${activePlayer.id}`;
        if (unoPendingTimers.has(timeoutKey)) {
          clearTimeout(unoPendingTimers.get(timeoutKey)!);
        }

        const timer = setTimeout(() => {
          unoPendingTimers.delete(timeoutKey);
          const targetPlayer = room.players.find(p => p.id === activePlayer.id);
          if (targetPlayer && targetPlayer.hand.length === 1 && !targetPlayer.hasCalledUno && room.status === 'playing') {
            drawCardsForPlayer(room, targetPlayer, 2);
            room.lastActionAnnouncement = `⚠️ ${targetPlayer.name} quên hô UNO sau khi đánh bài và bị phạt bốc 2 lá!`;
            addRoomLog(room, targetPlayer.id, `Không kịp hô UNO sau khi đánh bài, bị phạt bốc 2 lá!`, 'penalty');
            broadcastRoomUpdate(room);
          }
        }, 5000);

        unoPendingTimers.set(timeoutKey, timer);
      }

      if (activePlayer.hand.length > 1) {
        activePlayer.hasCalledUno = false;
      }

      // Check Finish Hand
      if (activePlayer.hand.length === 0) {
        handlePlayerFinishedHand(room, activePlayer, skipTurn, nextIdx);
      } else {
        room.currentTurnIndex = skipTurn ? getNextPlayerIndex(room, 2) : nextIdx;
      }

      broadcastRoomUpdate(room);
      if (room.status === 'playing') {
        executeAiMove(room);
      }
    });

    // 6. Draw Card
    socket.on('draw_card', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'playing') return;

      const activePlayer = room.players[room.currentTurnIndex];
      if (!activePlayer || activePlayer.socketId !== socket.id) {
        socket.emit('error_message', 'Chưa đến lượt của bạn!');
        return;
      }

      drawCardsForPlayer(room, activePlayer, 1);

      if (room.settings.drawUntilPlayable) {
        // Luật Rừng: Kiểm tra xem người chơi hiện tại đã có lá bài đánh được chưa
        const hasPlayableCard = activePlayer.hand.some(
          c => c.color === 'wild' || c.color === room.currentColor || c.value === room.currentCard?.value
        );

        if (hasPlayableCard) {
          room.lastActionAnnouncement = `${activePlayer.name} đã bốc được lá bài hợp lệ! (Có thể đánh bài)`;
          addRoomLog(room, activePlayer.id, `Đã bốc được lá bài hợp lệ (Luật Rừng)!`, 'draw');
          // Keep turn on activePlayer so they can play their card
        } else {
          room.lastActionAnnouncement = `${activePlayer.name} bốc 1 lá (chưa có bài đánh, tiếp tục bốc...) [Luật Rừng]`;
          addRoomLog(room, activePlayer.id, `Bốc bài nhưng chưa có lá đánh được (Luật Rừng: tiếp tục bốc).`, 'draw');
          // Keep turn on activePlayer
        }
      } else {
        // Standard rule: draw 1 and pass turn
        room.lastActionAnnouncement = `${activePlayer.name} đã bốc 1 lá bài.`;
        addRoomLog(room, activePlayer.id, `Đã rút 1 lá bài từ chồng bài.`, 'draw');
        room.currentTurnIndex = getNextPlayerIndex(room, 1);
      }

      broadcastRoomUpdate(room);
      if (room.status === 'playing') {
        executeAiMove(room);
      }
    });

    // 7. Shout UNO
    socket.on('call_uno', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player && player.hand.length === 1) {
        // Clear any pending timeout penalty for this player
        const timeoutKey = `${room.roomId}_${player.id}`;
        if (unoPendingTimers.has(timeoutKey)) {
          clearTimeout(unoPendingTimers.get(timeoutKey)!);
          unoPendingTimers.delete(timeoutKey);
        }

        player.hasCalledUno = true;
        room.lastActionAnnouncement = `🔥 ${player.name.toUpperCase()} ĐÃ HÔ UNO! 🔥`;
        addRoomLog(room, player.id, `Đã hô UNO! 🔥`, 'uno');
        io.to(room.roomId).emit('uno_shout_broadcast', { playerName: player.name });
        broadcastRoomUpdate(room);
      }
    });

    // 8. Catch Forgotten UNO Penalty
    socket.on('catch_uno_penalty', ({ targetPlayerId }: { targetPlayerId: number }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'playing') return;

      const catcher = room.players.find(p => p.socketId === socket.id);
      const target = room.players.find(p => p.id === targetPlayerId);

      if (target && target.hand.length === 1 && !target.hasCalledUno) {
        // Clear any automated timer to avoid duplicate penalty
        const timeoutKey = `${room.roomId}_${target.id}`;
        if (unoPendingTimers.has(timeoutKey)) {
          clearTimeout(unoPendingTimers.get(timeoutKey)!);
          unoPendingTimers.delete(timeoutKey);
        }

        drawCardsForPlayer(room, target, 2);
        room.lastActionAnnouncement = `⚠️ ${catcher?.name} đã bắt quả tang ${target.name} quên hô UNO! (${target.name} +2 lá)`;
        addRoomLog(room, target.id, `Bị ${catcher?.name} bắt phạt bốc 2 lá vì quên hô UNO!`, 'penalty');
        broadcastRoomUpdate(room);
      }
    });

    // 9. Send Chat & Emotes
    socket.on('send_chat', ({ text, isEmote }: { text: string; isEmote?: boolean }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const sender = room.players.find(p => p.socketId === socket.id);
      if (!sender) return;

      const msg: ChatMessage = {
        id: `chat_${Date.now()}_${Math.random()}`,
        senderId: sender.id,
        senderName: sender.name,
        text: (text || '').trim().slice(0, 150),
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isEmote,
      };

      room.chatMessages = [...room.chatMessages.slice(-30), msg];
      io.to(room.roomId).emit('chat_received', msg);
    });

    // 10. Update Profile (Name & Avatar)
    socket.on('update_profile', ({ name, avatar }: { name: string; avatar: string | null }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        if (name && name.trim()) player.name = name.trim();
        player.avatar = avatar;
        broadcastRoomUpdate(room);
        broadcastRoomsList();
      }
    });

    // 11. Rematch / Play Again
    socket.on('rematch', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== 'ended') return;
      if (room.hostSocketId !== socket.id) {
        socket.emit('error_message', 'Chỉ chủ phòng mới có thể tạo ván tái đấu!');
        return;
      }

      // Start new round directly
      const newDeck = generateDeck();
      room.deck = newDeck;
      room.status = 'playing';
      room.winner = null;
      room.rankings = undefined;
      room.playDirection = 1;
      room.currentTurnIndex = 0;

      // Deal 7 cards each
      room.players.forEach(p => {
        p.hand = [];
        p.hasCalledUno = false;
        p.isReady = true;
        p.rank = undefined;
        p.roundScore = 0;
        p.cardsPlayed = 0;
        for (let i = 0; i < 7; i++) {
          p.hand.push(room.deck.pop()!);
        }
      });

      // Flip first non-wild card
      let firstCard: Card;
      do {
        firstCard = room.deck.pop()!;
      } while (firstCard.color === 'wild');

      room.discardPile = [firstCard];
      room.currentCard = firstCard;
      room.currentColor = firstCard.color;
      room.lastActionAnnouncement = `Ván mới bắt đầu! Lượt đầu tiên của ${room.players[0].name}`;

      addRoomLog(room, room.players[0].id, `Bắt đầu ván đấu tiếp theo!`, 'system');
      broadcastRoomUpdate(room);
      broadcastRoomsList();

      if (room.players[0].socketId.startsWith('ai_')) {
        executeAiMove(room);
      }
    });

    // Player Exit Logic (AI Replacement on playing status)
    const handlePlayerExit = (socketId: string) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex === -1) return;

      const leavingPlayer = room.players[playerIndex];
      const wasHost = leavingPlayer.isHost;

      // If game is in progress, AI takes over to continue match seamlessly!
      if (room.status === 'playing') {
        const remainingRealPlayers = room.players.filter(
          p => !p.socketId.startsWith('ai_') && p.socketId !== socketId
        );

        if (remainingRealPlayers.length > 0) {
          // Switch this player to AI Takeover
          leavingPlayer.socketId = `ai_takeover_${leavingPlayer.id}`;
          leavingPlayer.isBotReplacement = true;
          const cleanName = leavingPlayer.name.replace(/\s*\(Bot đang đánh\)/gi, '').replace(/\s*\(AI\)/gi, '');
          leavingPlayer.name = `${cleanName} (Bot đang đánh)`;

          if (wasHost) {
            leavingPlayer.isHost = false;
            remainingRealPlayers[0].isHost = true;
            room.hostSocketId = remainingRealPlayers[0].socketId;
            room.hostId = remainingRealPlayers[0].id;
          }

          addRoomLog(room, leavingPlayer.id, `${cleanName} đã thoát, Bot đang đánh thay!`, 'system');
          room.lastActionAnnouncement = `${cleanName} đã thoát bàn, Bot đang đánh thay!`;

          broadcastRoomUpdate(room);
          broadcastRoomsList();

          // If it was the leaving player's turn, trigger AI move immediately
          if (room.currentTurnIndex === playerIndex) {
            executeAiMove(room);
          }
          return;
        }
      }

      // If not playing, or no real players left in match, remove player
      room.players.splice(playerIndex, 1);

      const realPlayersLeft = room.players.filter(p => !p.socketId.startsWith('ai_'));
      if (room.players.length === 0 || realPlayersLeft.length === 0) {
        if (room.turnTimeout) clearTimeout(room.turnTimeout);
        rooms.delete(currentRoomId);
      } else {
        if (wasHost) {
          realPlayersLeft[0].isHost = true;
          room.hostSocketId = realPlayersLeft[0].socketId;
          room.hostId = realPlayersLeft[0].id;
        }
        if (room.currentTurnIndex >= room.players.length) {
          room.currentTurnIndex = 0;
        }
        broadcastRoomUpdate(room);
      }

      broadcastRoomsList();
    };

    // 12. Leave Room
    socket.on('leave_room', () => {
      if (!currentRoomId) return;
      socket.leave(currentRoomId);
      handlePlayerExit(socket.id);

      currentRoomId = null;
      currentUserId = null;
      socket.emit('left_room_success');
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      handlePlayerExit(socket.id);
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`UNO Color Party Server running on http://localhost:${PORT}`);
  });
}

startServer();
