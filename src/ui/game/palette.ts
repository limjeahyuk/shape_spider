import type { ColorId } from "../../core/types";
import { Color } from "../../theme";

export interface PieceColor {
  name: string;
  color: string;
  shade: string;
}

// ColorId 순서: 빨강, 파랑, 초록, 노랑 (수집함 표시 순서와 동일)
export const PIECE_PALETTE: PieceColor[] = [
  { name: "빨강", color: Color.PIECE_RED, shade: Color.PIECE_RED_DEEP },
  { name: "파랑", color: Color.PIECE_BLUE, shade: Color.PIECE_BLUE_DEEP },
  { name: "초록", color: Color.PIECE_GREEN, shade: Color.PIECE_GREEN_DEEP },
  { name: "노랑", color: Color.PIECE_YELLOW, shade: Color.PIECE_YELLOW_DEEP },
];

export function pieceColor(id: ColorId): PieceColor {
  return PIECE_PALETTE[id % PIECE_PALETTE.length];
}

export function toIconCells(cells: { r: number; c: number }[]): [number, number][] {
  return cells.map((p) => [p.r, p.c]);
}
