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
  storageSlots: number;
  cardsPerColor: number;
  shapeIds: string[];
  maxRecycles: number | null;
  scoring: ScoringConfig;
}

// ── 보드 ───────────────────────────────────────────────
export type ColorId = number;
export type PieceId = number;
export interface Coord {
  r: number;
  c: number;
}

export type Cell = { color: ColorId; pieceId: PieceId } | null;

export interface Board {
  rows: number;
  cols: number;
  cells: Cell[]; // 길이 rows*cols, index = r * cols + c
}

// ── 도형 / 덱 ──────────────────────────────────────────
export interface PieceShape {
  id: string;
  cells: Coord[]; // 정규화: min(r)=0, min(c)=0
  size: number;
}

export interface Card {
  pieceId: PieceId;
  shape: PieceShape;
  color: ColorId;
}

export interface Deck {
  pending: Card[];
  hand: Card[];
  recycled: Card[]; // 넘긴 카드. 원래 덱 순서 유지
  recycleCount: number;
}

// ── 수집함 / 보관함 ────────────────────────────────────
export interface CollectionTrack {
  color: ColorId;
  nextSize: number | null;
  collected: number[];
}

export interface StoredPiece {
  color: ColorId;
  shape: PieceShape;
}

export interface Storage {
  slots: (StoredPiece | null)[];
}

// ── 선택 ───────────────────────────────────────────────
export type Destination = { kind: "collect" } | { kind: "store" };

// collect: 수집함용 N×N 프레임. pick: 정사각형이 없어 프레임을 못 띄운 상태 (보관함 이동만 가능)
export type Selection =
  | {
      kind: "collect";
      color: ColorId;
      size: number;
      origin: Coord; // 처음 탭한 칸. 보관함으로 보낼 때 덩어리 기준점
      anchor: Coord;
      candidates: Coord[]; // 유효한 앵커 목록
    }
  | { kind: "pick"; color: ColorId; origin: Coord; group: Coord[] };

// ── 점수 / 전체 상태 ───────────────────────────────────
export interface Score {
  collected: number;
  penalty: number;
  bonus: number;
  total: number;
}

export type GameStatus = "playing" | "cleared" | "stuck" | "stalled" | "resigned";

export interface GameState {
  config: GameConfig;
  board: Board;
  deck: Deck;
  collection: CollectionTrack[];
  storage: Storage;
  selection: Selection | null;
  score: Score;
  prev: Snapshot | null;
  status: GameStatus;
  nextPieceId: PieceId;
  placedSinceRebuild: boolean;
}

export type Snapshot = Omit<GameState, "prev" | "selection">;
