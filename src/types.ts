export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';

export type CardValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'SKIP' | 'REV' | '+2' | 'WILD' | '+4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
  selectedColor?: CardColor; // For wild cards once played
}

export interface Player {
  id: number;
  socketId: string;
  name: string;
  avatar: string | null;
  isReady: boolean;
  isHost: boolean;
  handCount: number;
  hand: Card[]; // Only populated for the current local player
  hasCalledUno: boolean;
  isConnected: boolean;
  score: number;
  cardsPlayed: number;
  rank?: number; // 1 = First place, 2 = Second, 3 = Third, 4 = Fourth
  roundScore?: number; // Points earned in the latest round
  isBotReplacement?: boolean; // When human player leaves and bot takes over
}

export interface PlayerRanking {
  playerId: number;
  playerName: string;
  avatar: string | null;
  rank: number;
  scoreEarned: number;
  totalScore: number;
  cardsPlayed: number;
  isAi: boolean;
}

export interface GameLog {
  id: string;
  timestamp: string;
  playerId: number;
  playerName: string;
  message: string;
  type: 'play' | 'draw' | 'uno' | 'skip' | 'reverse' | 'color' | 'win' | 'penalty' | 'system';
  card?: Card;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: string;
  isEmote?: boolean;
}

export interface GameSettings {
  roomName: string;
  roomPassword?: string;
  numPlayers: number; // 2, 3, or 4
  enableTurnTimer: boolean;
  turnDuration: number; // in seconds, e.g. 20
  enableUnoPenalty: boolean; // must press UNO before next turn or get +2
  stackingDrawTwo: boolean; // allow stacking +2 on +2
  drawUntilPlayable?: boolean; // Luật Rừng: Bốc đến khi nào có lá bài đánh được
  soundEnabled: boolean;
}

export interface RoomSummary {
  id: string;
  name: string;
  hasPassword: boolean;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  hostName: string;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  hasPassword: boolean;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  hostId: number;
  players: Player[];
  currentCard: Card | null;
  currentColor: CardColor;
  currentTurnIndex: number;
  playDirection: 1 | -1;
  deckCount: number;
  settings: GameSettings;
  logs: GameLog[];
  winner: Player | null;
  rankings?: PlayerRanking[];
  chatMessages: ChatMessage[];
  lastActionAnnouncement?: string;
}
