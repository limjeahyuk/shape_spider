import type { CSSProperties } from "react";
import "./PieceIcon.css";

interface PieceIconProps {
  cells: readonly (readonly [number, number])[];
  color: string;
  shade: string;
  cellSize?: number;
  span?: number; // 지정하면 span×span 고정 격자 중앙에 그려 회전해도 크기가 안 변한다
  className?: string;
}

// 장식용 폴리오미노 아이콘. cells는 [r, c] 좌표 목록이며 CSS Grid로 그린다
function PieceIcon({ cells, color, shade, cellSize = 22, span, className = "" }: PieceIconProps) {
  const rows = Math.max(...cells.map(([r]) => r)) + 1;
  const cols = Math.max(...cells.map(([, c]) => c)) + 1;
  const offR = span ? Math.floor((span - rows) / 2) : 0;
  const offC = span ? Math.floor((span - cols) / 2) : 0;
  const style = {
    gridTemplateRows: span ? `repeat(${span}, 1fr)` : `repeat(${rows}, ${cellSize}px)`,
    gridTemplateColumns: span ? `repeat(${span}, 1fr)` : `repeat(${cols}, ${cellSize}px)`,
    "--piece-color": color,
    "--piece-shade": shade,
  } as CSSProperties;

  return (
    <div className={`ss-piece ${className}`.trim()} style={style} aria-hidden="true">
      {cells.map(([r, c]) => (
        <span key={`${r}-${c}`} className="ss-piece__cell" style={{ gridRow: r + offR + 1, gridColumn: c + offC + 1 }} />
      ))}
    </div>
  );
}

export default PieceIcon;
