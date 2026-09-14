import type { Board, CollectionTrack, ColorId, Coord, Destination, GameConfig, GameState, PieceShape, Score, ScoringConfig } from "./types";
import { at, canPlace, connectedGroup, findExtractPositions, squareCells } from "./board";
import { allCards } from "./deck";
import { rotateShape } from "./shapes";

// ── 배치 가능 여부 ─────────────────────────────────────
// 회전한 형태까지 모두 검사한다. 같은 형태는 한 번만 본다
export function hasAnyPlacement(board: Board, shapes: PieceShape[]): boolean {
  const seen = new Set<string>();
  for (const shape of shapes.flatMap((s) => [0, 1, 2, 3].map((t) => rotateShape(s, t)))) {
    const key = JSON.stringify(shape.cells);
    if (seen.has(key)) continue;
    seen.add(key);
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (canPlace(board, shape, { r, c })) return true;
      }
    }
  }
  return false;
}

export function anyExtractable(board: Board, tracks: CollectionTrack[]): boolean {
  return tracks.some((t) => t.nextSize !== null && findExtractPositions(board, t.color, t.nextSize).length > 0);
}

export function isCleared(tracks: CollectionTrack[]): boolean {
  return tracks.every((t) => t.nextSize === null);
}

// 막힘: 덱 전체(손패+대기+미사용)와 보관함 조각을 어디에도 놓을 수 없고 추출도 불가
export function isStuck(state: GameState): boolean {
  const shapes = allCards(state.deck).map((c) => c.shape);
  for (const slot of state.storage.slots) if (slot) shapes.push(slot.shape);
  if (hasAnyPlacement(state.board, shapes)) return false;
  return !anyExtractable(state.board, state.collection);
}

// 색상의 다음 수집 크기와 추출 가능 위치. size가 null이면 수집함 완료, candidates가 비면 정사각형 없음
export function collectTarget(board: Board, tracks: CollectionTrack[], color: ColorId): { size: number | null; candidates: Coord[] } {
  const size = tracks.find((t) => t.color === color)?.nextSize ?? null;
  return { size, candidates: size === null ? [] : findExtractPositions(board, color, size) };
}

// ── 선택 규칙 디스패치: 목적지가 규칙을 결정한다 ───────
export function selectCells(board: Board, start: Coord, dest: Destination, tracks: CollectionTrack[]): Coord[] {
  const cell = at(board, start.r, start.c);
  if (!cell) return [];
  switch (dest.kind) {
    case "collect": {
      const { size, candidates } = collectTarget(board, tracks, cell.color);
      if (size === null) return [];
      const anchor = candidates.find((a) => squareCells(a, size).some((p) => p.r === start.r && p.c === start.c)) ?? candidates[0];
      return anchor ? squareCells(anchor, size) : [];
    }
    case "store":
      return connectedGroup(board, start);
  }
}

// ── 점수 ───────────────────────────────────────────────
export function scoreSquare(cfg: ScoringConfig, size: number): number {
  return cfg.squareScore[size] ?? 0;
}

// 클램프 전 합계. 음수면 즉시 종료 판정에 쓴다
export function rawTotal(score: Omit<Score, "total">): number {
  return score.collected - score.penalty + score.bonus;
}

export function computeTotal(score: Omit<Score, "total">): Score {
  return { ...score, total: Math.max(0, rawTotal(score)) };
}

export function addBonus(score: Score, amount: number): Score {
  return computeTotal({ ...score, bonus: score.bonus + amount });
}

export function applyRecyclePenalty(score: Score, cfg: ScoringConfig, times = 1): Score {
  return computeTotal({ ...score, penalty: score.penalty + cfg.recyclePenalty * times });
}

export function createTracks(config: GameConfig): CollectionTrack[] {
  return Array.from({ length: config.colorCount }, (_, color) => ({
    color,
    nextSize: config.targetSizes[0] ?? null,
    collected: [],
  }));
}

export function remainingTargets(tracks: CollectionTrack[], config: GameConfig): number {
  return tracks.reduce((s, t) => s + (config.targetSizes.length - t.collected.length), 0);
}
