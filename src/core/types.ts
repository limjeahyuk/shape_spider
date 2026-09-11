// 게임 설정 타입. 값의 정의는 GAME_RULES.md, 구조는 GAME_DESIGN.md 참조
export type Difficulty = "easy" | "normal" | "hard";

export interface ScoringConfig {
  squareScore: Record<number, number>;
  recyclePenalty: number;
  clearBonus: number;
  allowNegative: boolean;
}

export interface GameConfig {
  rows: number;
  cols: number;
  colorCount: number;
  targetSizes: number[];
  handSize: number;
  storageEnabled: boolean;
  maxRecycles: number | null;
  scoring: ScoringConfig;
}
