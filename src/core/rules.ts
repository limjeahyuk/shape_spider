import type { Board, CollectionTrack, Coord, Destination, GameConfig, GameState, PieceShape, Score, ScoringConfig } from "./types";
import { canPlace, connectedGroup, findExtractPositions, squareCells } from "./board";
import { allCards } from "./deck";

// ── 배치 가능 여부 ─────────────────────────────────────
export function hasAnyPlacement(board: Board, shapes: PieceShape[]): boolean {
  const seen = new Set<string>();
  for (const shape of shapes) {
    if (seen.has(shape.id)) continue;
    seen.add(shape.id);
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

// ── 선택 규칙 디스패치: 목적지가 규칙을 결정한다 ───────
export function selectCells(board: Board, start: Coord, dest: Destination, tracks: CollectionTrack[]): Coord[] {
  const cell = board.cells[start.r * board.cols + start.c];
  if (!cell) return [];
  switch (dest.kind) {
    case "collect": {
      const track = tracks.find((t) => t.color === cell.color);
      if (!track || track.nextSize === null) return [];
      const candidates = findExtractPositions(board, cell.color, track.nextSize);
      const anchor = candidates.find((a) => squareCells(a, track.nextSize!).some((p) => p.r === start.r && p.c === start.c)) ?? candidates[0];
      return anchor ? squareCells(anchor, track.nextSize) : [];
    }
    case "store":
      return connectedGroup(board, start);
  }
}

// ── 점수 ───────────────────────────────────────────────
export function scoreSquare(cfg: ScoringConfig, size: number): number {
  return cfg.squareScore[size] ?? 0;
}

export function computeTotal(score: Omit<Score, "total">, cfg: ScoringConfig): Score {
  const raw = score.collected - score.penalty + score.bonus;
  return { ...score, total: cfg.allowNegative ? raw : Math.max(0, raw) };
}

export function applyRecyclePenalty(score: Score, cfg: ScoringConfig, times = 1): Score {
  return computeTotal({ ...score, penalty: score.penalty + cfg.recyclePenalty * times }, cfg);
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
