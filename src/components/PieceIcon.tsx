import type { CSSProperties } from "react";
import "./PieceIcon.css";

interface PieceIconProps {
  cells: readonly (readonly [number, number])[];
  color: string;
  shade: string;
  cellSize?: number;
  className?: string;
}

// 장식용 폴리오미노 아이콘. cells는 [r, c] 좌표 목록이며 CSS Grid로 그린다
function PieceIcon({ cells, color, shade, cellSize = 22, className = "" }: PieceIconProps) {
  const rows = Math.max(...cells.map(([r]) => r)) + 1;
  const cols = Math.max(...cells.map(([, c]) => c)) + 1;
  const style = {
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    "--piece-color": color,
    "--piece-shade": shade,
  } as CSSProperties;

  return (
    <div className={`ss-piece ${className}`.trim()} style={style} aria-hidden="true">
      {cells.map(([r, c]) => (
        <span key={`${r}-${c}`} className="ss-piece__cell" style={{ gridRow: r + 1, gridColumn: c + 1 }} />
      ))}
    </div>
  );
}

export default PieceIcon;
