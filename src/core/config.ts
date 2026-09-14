import type { Difficulty, GameConfig, ScoringConfig } from "./types";
import { SHAPE_IDS } from "./shapes";

// 정사각형 배점: 한 변의 칸 수 x 100 (GAME_RULES.md 잠정값)
const SQUARE_SCORE_PER_SIDE = 100;

function buildSquareScore(sizes: number[]): Record<number, number> {
  return Object.fromEntries(sizes.map((n) => [n, n * SQUARE_SCORE_PER_SIDE]));
}

function buildScoring(sizes: number[]): ScoringConfig {
  return {
    squareScore: buildSquareScore(sizes),
    recyclePenalty: 1000,
    trackBonus: 700,
    handBonus: 50,
    clearBonus: 5000,
  };
}

// 덱의 칸 수별 비율 (GAME_RULES.md 「도형 카드」)
const SIZE_RATIO: Record<number, number> = { 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.35 };

function buildConfig(targetSizes: number[], storageCooldown: number, cardsPerColor: number): GameConfig {
  return {
    rows: 10,
    cols: 10,
    colorCount: 4,
    targetSizes,
    handSize: 5,
    storageEnabled: true,
    storageSlots: 2,
    storageCooldown,
    cardsPerColor,
    shapeIds: [...SHAPE_IDS],
    sizeRatio: SIZE_RATIO,
    maxRecycles: null,
    scoring: buildScoring(targetSizes),
  };
}

// 난이도별 기본 설정. 목표 3~6이 기본, 3~8은 상위. 쿨타임은 「보관함」, 장수는 「도형 카드」 참조
export const DIFFICULTY_PRESETS: Record<Difficulty, GameConfig> = {
  easy: buildConfig([3, 4, 5], 1, 35),
  normal: buildConfig([3, 4, 5, 6], 2, 35),
  hard: buildConfig([3, 4, 5, 6, 7, 8], 3, 55),
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];
export const DEFAULT_DIFFICULTY: Difficulty = "normal";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

export function getConfig(difficulty: Difficulty): GameConfig {
  return DIFFICULTY_PRESETS[difficulty];
}
