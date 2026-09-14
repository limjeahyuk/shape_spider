import type { Card, Deck, GameConfig } from "./types";
import { getShape } from "./shapes";

export type Rng = () => number;

// 한 색상분 도형 목록. 칸 수별 장수는 비율을 최대 잉여 방식으로 반올림하고, 같은 크기 안에서는 돌아가며 채운다
export function colorRecipe(config: GameConfig): string[] {
  const sizes = Object.keys(config.sizeRatio).map(Number);
  const raw = sizes.map((s) => config.sizeRatio[s] * config.cardsPerColor);
  const counts = raw.map(Math.floor);
  const byFraction = sizes.map((_, i) => i).sort((a, b) => raw[b] - counts[b] - (raw[a] - counts[a]));
  for (let k = 0; k < config.cardsPerColor - counts.reduce((a, b) => a + b, 0); k++) counts[byFraction[k]]++;
  return sizes.flatMap((size, i) => {
    const ids = config.shapeIds.filter((id) => getShape(id).size === size);
    return ids.length ? Array.from({ length: counts[i] }, (_, j) => ids[j % ids.length]) : [];
  });
}

// 색상별 동일 분포로 카드를 만든 뒤 한 번만 섞는다. 이후 순서는 고정
export function createDeck(config: GameConfig, rng: Rng = Math.random): Deck {
  const cards: Card[] = [];
  const recipe = colorRecipe(config);
  let pieceId = 1;
  for (let color = 0; color < config.colorCount; color++) {
    for (const shapeId of recipe) cards.push({ pieceId: pieceId++, shape: getShape(shapeId), color });
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
