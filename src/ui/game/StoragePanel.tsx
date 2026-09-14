import type { PointerEvent } from "react";
import type { PieceShape, Storage } from "../../core/types";
import Panel from "../../components/Panel";
import PieceIcon from "../../components/PieceIcon";
import { pieceColor, toIconCells } from "./palette";
import "./StoragePanel.css";

// 보관 칸 아이콘이 들어갈 정사각 영역(px)과 칸 크기 상한
const ICON_BOX_PX = 74;
const MAX_ICON_CELL_PX = 16;

// 도형의 긴 변 기준으로 칸 크기를 줄여 슬롯 안에 들어가게 한다 (칸 사이 간격 2px 포함)
function iconCellSize(cells: { r: number; c: number }[]): number {
  const span = Math.max(...cells.flatMap((p) => [p.r, p.c])) + 1;
  return Math.min(MAX_ICON_CELL_PX, Math.floor(ICON_BOX_PX / span) - 2);
}

interface StoragePanelProps {
  storage: Storage;
  armedIndex: number | null;
  armedShape: PieceShape | null; // 집어 든 조각의 회전된 모양
  canStore: boolean;
  disabled: boolean;
  onStore: (slotIndex: number) => void;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>, index: number) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLButtonElement>) => void;
}

// 임시 보관함. 빈 칸은 선택한 덩어리를 받고, 찬 칸은 손패 카드처럼 다시 꺼내 놓는다
// 꺼낸 칸은 판에 도형을 쿨타임만큼 올릴 때까지 잠긴다
function StoragePanel({ storage, armedIndex, armedShape, canStore, disabled, onStore, onPointerDown, onPointerMove, onPointerUp }: StoragePanelProps) {
  const used = storage.slots.filter(Boolean).length;
  return (
    <Panel tone="wood" className="storage">
      <h2 className="storage__title">임시 보관함</h2>
      <Panel tone="green" className="storage__well">
        {storage.slots.map((slot, i) => {
          const shape = slot && (armedIndex === i && armedShape ? armedShape : slot.shape);
          const locked = storage.locks[i] > 0;
          const open = canStore && !locked;
          return slot && shape ? (
            <button
              key={i}
              type="button"
              className={`storage__slot is-filled ${armedIndex === i ? "is-armed" : ""}`}
              disabled={disabled}
              aria-pressed={armedIndex === i}
              aria-label={`보관된 ${pieceColor(slot.color).name} 조각 ${slot.shape.size}칸`}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <PieceIcon cells={toIconCells(shape.cells)} color={pieceColor(slot.color).color} shade={pieceColor(slot.color).shade} cellSize={iconCellSize(shape.cells)} />
              <span className="storage__size">{slot.shape.size}칸</span>
            </button>
          ) : (
            <button
              key={i}
              type="button"
              className={`storage__slot ${open ? "can-store" : ""} ${locked ? "is-locked" : ""}`}
              disabled={disabled || !open}
              onClick={() => onStore(i)}
            >
              {locked ? (
                <>
                  잠김
                  <span className="storage__size">도형 {storage.locks[i]}개 더 놓기</span>
                </>
              ) : open ? "여기에 보관" : "빈 칸"}
            </button>
          );
        })}
      </Panel>
      <p className="storage__count">
        {used} / {storage.slots.length}
      </p>
    </Panel>
  );
}

export default StoragePanel;
