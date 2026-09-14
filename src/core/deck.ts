import type { Card, Deck, GameConfig } from "./types";
import { getShape } from "./shapes";

export type Rng = () => number;

// 색상별 동일 분포로 카드를 만든 뒤 한 번만 섞는다. 이후 순서는 고정
export function createDeck(config: GameConfig, rng: Rng = Math.random): Deck {
  const cards: Card[] = [];
  let pieceId = 1;
  for (let color = 0; color < config.colorCount; color++) {
    for (let i = 0; i < config.cardsPerColor; i++) {
      const shapeId = config.shapeIds[i % config.shapeIds.length];
      cards.push({ pieceId: pieceId++, shape: getShape(shapeId), color });
    }
  }
  return { pending: shuffle(cards, rng), hand: [], recycled: [], recycleCount: 0 };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface DrawResult {
  deck: Deck;
  rebuilds: number;
}

// pending에서 handSize장 제시. 비면 recycled를 섞지 않고 그대로 pending으로 되돌린다
export function drawHand(deck: Deck, handSize: number): DrawResult {
  let pending = deck.pending.slice();
  let recycled = deck.recycled.slice();
  const hand = deck.hand.slice();
  let rebuilds = 0;
  while (hand.length < handSize) {
    if (pending.length === 0) {
      if (recycled.length === 0) break;
      pending = recycled;
      recycled = [];
      rebuilds++;
    }
    hand.push(pending.shift()!);
  }
  return { deck: { pending, hand, recycled, recycleCount: deck.recycleCount + rebuilds }, rebuilds };
}

// 손패의 미사용 카드를 recycled 끝에 붙인다. 제시 순서 그대로이므로 덱 순서가 유지된다
export function passHand(deck: Deck): Deck {
  return { ...deck, hand: [], recycled: [...deck.recycled, ...deck.hand] };
}

export function allCards(deck: Deck): Card[] {
  return [...deck.hand, ...deck.pending, ...deck.recycled];
}

export function remainingCount(deck: Deck): number {
  return deck.pending.length + deck.recycled.length;
}
