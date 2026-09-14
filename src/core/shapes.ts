import type { Coord, PieceShape } from "./types";

// 2~5칸 폴리오미노 22종. 회전만 가능하고 반전은 없으므로 S/Z, J/L 등은 서로 다른 도형이다
const RAW: Record<string, [number, number][]> = {
  D2: [[0, 0], [0, 1]],
  I3: [[0, 0], [0, 1], [0, 2]],
  L3: [[0, 0], [1, 0], [1, 1]],
  I4: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O4: [[0, 0], [0, 1], [1, 0], [1, 1]],
  T4: [[0, 0], [0, 1], [0, 2], [1, 1]],
  S4: [[0, 1], [0, 2], [1, 0], [1, 1]],
  Z4: [[0, 0], [0, 1], [1, 1], [1, 2]],
  J4: [[0, 1], [1, 1], [2, 0], [2, 1]],
  L4: [[0, 0], [1, 0], [2, 0], [2, 1]],
  F5: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  I5: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  L5: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  N5: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]],
  P5: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  T5: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  U5: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  V5: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  W5: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  X5: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  Y5: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]],
  Z5: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
};

export const SHAPE_IDS = Object.keys(RAW);

export const SHAPE_CATALOG: Record<string, PieceShape> = Object.fromEntries(
  Object.entries(RAW).map(([id, cells]) => [id, makeShape(id, cells.map(([r, c]) => ({ r, c })))]),
);

export function getShape(id: string): PieceShape {
  const shape = SHAPE_CATALOG[id];
  if (!shape) throw new Error(`unknown shape: ${id}`);
  return shape;
}

// 좌표 목록을 min(r)=0, min(c)=0 으로 정규화해 PieceShape를 만든다
export function makeShape(id: string, cells: Coord[]): PieceShape {
  const minR = Math.min(...cells.map((p) => p.r));
  const minC = Math.min(...cells.map((p) => p.c));
  const normalized = cells
    .map((p) => ({ r: p.r - minR, c: p.c - minC }))
    .sort((a, b) => a.r - b.r || a.c - b.c);
  return { id, cells: normalized, size: normalized.length };
}

// 시계 방향 90도 회전을 times번 적용한다. id는 유지한다
export function rotateShape(shape: PieceShape, times: number): PieceShape {
  let cells = shape.cells;
  for (let i = 0; i < times % 4; i++) cells = cells.map((p) => ({ r: p.c, c: -p.r }));
  return makeShape(shape.id, cells);
}

export function shapeBounds(shape: PieceShape): { rows: number; cols: number } {
  return {
    rows: Math.max(...shape.cells.map((p) => p.r)) + 1,
    cols: Math.max(...shape.cells.map((p) => p.c)) + 1,
  };
}

// 드래그 시 포인터 아래에 둘 칸: 무게중심에 가장 가까운 칸
export function grabCell(shape: PieceShape): Coord {
  const n = shape.cells.length;
  const cr = shape.cells.reduce((s, p) => s + p.r, 0) / n;
  const cc = shape.cells.reduce((s, p) => s + p.c, 0) / n;
  let best = shape.cells[0];
  let bestD = Infinity;
  for (const p of shape.cells) {
    const d = (p.r - cr) ** 2 + (p.c - cc) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}
