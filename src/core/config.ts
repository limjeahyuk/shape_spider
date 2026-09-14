import type { Difficulty, GameConfig, ScoringConfig } from "./types";
import { PENTOMINO_IDS } from "./shapes";

// 정사각형 배점: 칸 수 x 10 (GAME_RULES.md 잠정값)
const SQUARE_SCORE_PER_CELL = 10;

function buildSquareScore(sizes: number[]): Record<number, number> {
  return Object.fromEntries(sizes.map((n) => [n, n * n * SQUARE_SCORE_PER_CELL]));
}

function buildScoring(sizes: number[]): ScoringConfig {
  return {
    squareScore: buildSquareScore(sizes),
    recyclePenalty: 50,
    clearBonus: 2000,
    allowNegative: false,
  };
}

function buildConfig(targetSizes: number[]): GameConfig {
  return {
    rows: 10,
    cols: 10,
    colorCount: 4,
    targetSizes,
    handSize: 5,
    storageEnabled: true,
    storageSlots: 2,
    cardsPerColor: 35,
    shapeIds: [...PENTOMINO_IDS],
    maxRecycles: null,
    scoring: buildScoring(targetSizes),
  };
}

// 난이도별 기본 설정. 기본은 3~6, 상위 난이도는 3~8 (GAME_RULES.md 「난이도」)
export const DIFFICULTY_PRESETS: Record<Difficulty, GameConfig> = {
  easy: buildConfig([3, 4, 5]),
  normal: buildConfig([3, 4, 5, 6]),
  hard: buildConfig([3, 4, 5, 6, 7, 8]),
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
