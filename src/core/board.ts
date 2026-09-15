import type { Board, Cell, ColorId, Coord, PieceId, PieceShape } from "./types";

export const idx = (b: Board, r: number, c: number): number => r * b.cols + c;
export const toCoord = (b: Board, i: number): Coord => ({ r: Math.floor(i / b.cols), c: i % b.cols });
export const inBounds = (b: Board, r: number, c: number): boolean => r >= 0 && r < b.rows && c >= 0 && c < b.cols;
export const at = (b: Board, r: number, c: number): Cell => (inBounds(b, r, c) ? b.cells[idx(b, r, c)] : null);

export function createBoard(rows: number, cols: number): Board {
  return { rows, cols, cells: Array.from({ length: rows * cols }, () => null) };
}

export function shapeCellsAt(shape: PieceShape, anchor: Coord): Coord[] {
  return shape.cells.map((p) => ({ r: anchor.r + p.r, c: anchor.c + p.c }));
}

// ── 배치 ───────────────────────────────────────────────
export function canPlace(board: Board, shape: PieceShape, anchor: Coord): boolean {
  return shapeCellsAt(shape, anchor).every((p) => inBounds(board, p.r, p.c) && board.cells[idx(board, p.r, p.c)] === null);
}

export function place(board: Board, shape: PieceShape, color: ColorId, pieceId: PieceId, anchor: Coord): Board {
  const cells = board.cells.slice();
  for (const p of shapeCellsAt(shape, anchor)) cells[idx(board, p.r, p.c)] = { color, pieceId };
  return { ...board, cells };
}

export function findPlacements(board: Board, shape: PieceShape): Coord[] {
  const out: Coord[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (canPlace(board, shape, { r, c })) out.push({ r, c });
    }
  }
  return out;
}

// ── 추출 ───────────────────────────────────────────────
export function isUniformSquare(board: Board, color: ColorId, size: number, anchor: Coord): boolean {
  if (!inBounds(board, anchor.r, anchor.c) || !inBounds(board, anchor.r + size - 1, anchor.c + size - 1)) return false;
  for (let r = anchor.r; r < anchor.r + size; r++) {
    for (let c = anchor.c; c < anchor.c + size; c++) {
      const cell = board.cells[idx(board, r, c)];
      if (!cell || cell.color !== color) return false;
    }
  }
  return true;
}

export function findExtractPositions(board: Board, color: ColorId, size: number): Coord[] {
  const out: Coord[] = [];
  for (let r = 0; r + size <= board.rows; r++) {
    for (let c = 0; c + size <= board.cols; c++) {
      if (isUniformSquare(board, color, size, { r, c })) out.push({ r, c });
    }
  }
  return out;
}

export function removeCells(board: Board, targets: Coord[]): Board {
  const cells = board.cells.slice();
  for (const p of targets) cells[idx(board, p.r, p.c)] = null;
  return { ...board, cells };
}

// 해당 색의 칸을 전부 비운다 (색상 완성 시 정리)
export function removeColor(board: Board, color: ColorId): Board {
  return { ...board, cells: board.cells.map((cell) => (cell?.color === color ? null : cell)) };
}

export function squareCells(anchor: Coord, size: number): Coord[] {
  const out: Coord[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out.push({ r: anchor.r + r, c: anchor.c + c });
  return out;
}

export function extract(board: Board, anchor: Coord, size: number): Board {
  return removeCells(board, squareCells(anchor, size));
}

export function snapToNearestValid(candidates: Coord[], desired: Coord): Coord | null {
  let best: Coord | null = null;
  let bestD = Infinity;
  for (const p of candidates) {
    const d = (p.r - desired.r) ** 2 + (p.c - desired.c) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

// 상하좌우 4방향으로 연결된 같은 색 칸 집합
export function connectedGroup(board: Board, start: Coord): Coord[] {
  const origin = at(board, start.r, start.c);
  if (!origin) return [];
  const seen = new Set<number>([idx(board, start.r, start.c)]);
  const stack: Coord[] = [start];
  const out: Coord[] = [];
  while (stack.length) {
    const p = stack.pop()!;
    out.push(p);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = p.r + dr;
      const c = p.c + dc;
      if (!inBounds(board, r, c)) continue;
      const i = idx(board, r, c);
      if (seen.has(i)) continue;
      const cell = board.cells[i];
      if (cell && cell.color === origin.color) {
        seen.add(i);
        stack.push({ r, c });
      }
    }
  }
  return out;
}

// ── 렌더 보조 ──────────────────────────────────────────
export interface Edges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

// 이웃 칸과 pieceId가 다른 변만 true. 같은 도형 내부 이음새는 그리지 않는다
export function outlineEdges(board: Board, r: number, c: number): Edges {
  const me = at(board, r, c);
  const diff = (o: Cell) => !me || !o || o.pieceId !== me.pieceId;
  return {
    top: diff(at(board, r - 1, c)),
    right: diff(at(board, r, c + 1)),
    bottom: diff(at(board, r + 1, c)),
    left: diff(at(board, r, c - 1)),
  };
}
