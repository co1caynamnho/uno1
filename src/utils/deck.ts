import { Card, CardColor, CardValue, Player } from '../types';

export const CARD_COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];
export const NUMBER_VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const ACTION_VALUES: CardValue[] = ['SKIP', 'REV', '+2'];

export const AVATAR_PRESETS = [
  { id: 'avatar1', name: 'Ninja Mèo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NinjaCat' },
  { id: 'avatar2', name: 'Học Giả', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Scholar' },
  { id: 'avatar3', name: 'Thám Tử', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Detective' },
  { id: 'avatar4', name: 'Phi Hành Gia', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Astronaut' },
  { id: 'avatar5', name: 'Phù Thủy', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wizard' },
  { id: 'avatar6', name: 'Hiệp Sĩ', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Knight' },
  { id: 'avatar7', name: 'Chiến Binh Rồng', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DragonWarrior' },
  { id: 'avatar8', name: 'Siêu Anh Hùng', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SuperHero' },
];

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let cardCount = 0;

  CARD_COLORS.forEach(color => {
    // Exactly one '0' per color
    deck.push({
      id: `card_${color}_0_${cardCount++}`,
      color,
      value: '0',
    });

    // Two of '1' through '9' per color
    for (let i = 1; i <= 9; i++) {
      const val = `${i}` as CardValue;
      deck.push({ id: `card_${color}_${val}_a_${cardCount++}`, color, value: val });
      deck.push({ id: `card_${color}_${val}_b_${cardCount++}`, color, value: val });
    }

    // Two of each action card per color (Skip, Reverse, Draw Two)
    ACTION_VALUES.forEach(val => {
      deck.push({ id: `card_${color}_${val}_a_${cardCount++}`, color, value: val });
      deck.push({ id: `card_${color}_${val}_b_${cardCount++}`, color, value: val });
    });
  });

  // 4 Wild and 4 Wild Draw 4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_wild_${i}_${cardCount++}`, color: 'wild', value: 'WILD' });
    deck.push({ id: `card_wild4_${i}_${cardCount++}`, color: 'wild', value: '+4' });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isValidCardPlay(
  card: Card,
  currentCard: Card | null,
  activeColor: CardColor
): boolean {
  if (!currentCard) return true;
  // Wild card is always playable
  if (card.color === 'wild') return true;

  // Matching color with active/chosen color
  if (card.color === activeColor) return true;

  // Matching value
  if (card.value === currentCard.value) return true;

  return false;
}

export function calculatePlayerHandPoints(hand: Card[]): number {
  return hand.reduce((total, card) => {
    if (card.value === 'WILD' || card.value === '+4') {
      return total + 50;
    }
    if (card.value === 'SKIP' || card.value === 'REV' || card.value === '+2') {
      return total + 20;
    }
    return total + (parseInt(card.value, 10) || 0);
  }, 0);
}

export function getColorNameVietnamese(color: CardColor): string {
  switch (color) {
    case 'red':
      return 'Đỏ';
    case 'yellow':
      return 'Vàng';
    case 'green':
      return 'Xanh Lá';
    case 'blue':
      return 'Xanh Dương';
    case 'wild':
      return 'Đổi Màu';
  }
}

export function getColorHex(color: CardColor): string {
  switch (color) {
    case 'red':
      return '#ef4444';
    case 'yellow':
      return '#eab308';
    case 'green':
      return '#22c55e';
    case 'blue':
      return '#3b82f6';
    case 'wild':
      return '#1e293b';
  }
}

export function createInitialPlayers(
  count: number,
  existingPlayers?: Player[]
): Player[] {
  const result: Player[] = [];
  const defaultNames = ['Người chơi 1', 'Người chơi 2', 'Người chơi 3', 'Người chơi 4'];

  for (let i = 0; i < count; i++) {
    const existing = existingPlayers?.[i];
    const name = existing?.name || defaultNames[i];
    const avatar = existing !== undefined ? existing.avatar : null;

    result.push({
      id: i,
      socketId: '',
      name,
      avatar,
      isHost: i === 0,
      isReady: i === 0,
      isConnected: true,
      hand: [],
      handCount: 0,
      hasCalledUno: false,
      score: existing?.score || 0,
      cardsPlayed: 0,
    });
  }

  return result;
}
