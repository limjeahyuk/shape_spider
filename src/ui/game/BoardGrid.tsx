import { memo, type CSSProperties, type PointerEventHandler, type RefObject } from "react";
import type { Board, Coord, Selection } from "../../core/types";
import { outlineEdges } from "../../core/board";
import { pieceColor } from "./palette";
import "./BoardGrid.css";

export interface Ghost {
  cells: Coord[];
  valid: boolean;
  color: number;
}

interface BoardGridProps {
  board: Board;
  selection: Selection | null;
  ghost: Ghost | null;
  gridRef: RefObject<HTMLDivElement | null>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
}

interface CellProps {
  color: number | null;
  edges: string;
}

// 칸 하나. color/edges가 바뀔 때만 리렌더된다
const BoardCell = memo(function BoardCell({ color, edges }: CellProps) {
  if (color === null) return <div className="board-cell" />;
  const p = pieceColor(color);
  const style = { "--piece-color": p.color, "--piece-shade": p.shade } as CSSProperties;
  return <div className={`board-cell is-filled ${edges}`} style={style} />;
});

function edgeClass(board: Board, r: number, c: number): string {
  const e = outlineEdges(board, r, c);
  return [e.top && "e-t", e.right && "e-r", e.bottom && "e-b", e.left && "e-l"].filter(Boolean).join(" ");
}

// 오버레이는 grid 자동 배치를 방해하지 않도록 절대 좌표로 놓는다
function overlayRect(r: number, c: number, rows: number, cols: number): CSSProperties {
  return {
    top: `calc(var(--cell) * ${r})`,
    left: `calc(var(--cell) * ${c})`,
    width: `calc(var(--cell) * ${cols})`,
    height: `calc(var(--cell) * ${rows})`,
  };
}

function boundsOf(cells: Coord[]) {
  const rs = cells.map((p) => p.r);
  const cs = cells.map((p) => p.c);
  return { r0: Math.min(...rs), c0: Math.min(...cs), r1: Math.max(...rs), c1: Math.max(...cs) };
}

// 임의 칸 집합 오버레이 (배치 미리보기, 보관 대상 덩어리). div 1개 안에 span으로 그린다
function CellsOverlay({ cells, color, className }: { cells: Coord[]; color: number; className: string }) {
  const b = boundsOf(cells);
  const p = pieceColor(color);
  const style = {
    ...overlayRect(b.r0, b.c0, b.r1 - b.r0 + 1, b.c1 - b.c0 + 1),
    gridTemplateRows: `repeat(${b.r1 - b.r0 + 1}, var(--cell))`,
    gridTemplateColumns: `repeat(${b.c1 - b.c0 + 1}, var(--cell))`,
    "--piece-color": p.color,
  } as CSSProperties;
  return (
    <div className={`board-ghost ${className}`} style={style}>
      {cells.map((q) => (
        <span key={`${q.r}-${q.c}`} style={{ gridRow: q.r - b.r0 + 1, gridColumn: q.c - b.c0 + 1 }} />
      ))}
    </div>
  );
}

function BoardGrid({ board, selection, ghost, gridRef, ...handlers }: BoardGridProps) {
  const style = {
    gridTemplateRows: `repeat(${board.rows}, var(--cell))`,
    gridTemplateColumns: `repeat(${board.cols}, var(--cell))`,
  } as CSSProperties;

  const pickNode = selection?.kind === "pick" ? <CellsOverlay cells={selection.group} color={selection.color} className="is-pick" /> : null;
  const ghostNode = ghost && ghost.cells.length ? <CellsOverlay cells={ghost.cells} color={ghost.color} className={ghost.valid ? "is-valid" : "is-invalid"} /> : null;

  return (
    <div ref={gridRef} className="board-grid" style={style} {...handlers}>
      {board.cells.map((cell, i) => {
        const r = Math.floor(i / board.cols);
        const c = i % board.cols;
        return <BoardCell key={i} color={cell ? cell.color : null} edges={cell ? edgeClass(board, r, c) : ""} />;
      })}
      {pickNode}
      {selection?.kind === "collect" && (
        <div className="board-frame" style={overlayRect(selection.anchor.r, selection.anchor.c, selection.size, selection.size)}>
          <span className="board-frame__tag">{selection.size}×{selection.size}</span>
        </div>
      )}
      {ghostNode}
    </div>
  );
}

export default BoardGrid;
