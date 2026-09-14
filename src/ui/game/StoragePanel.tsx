import type { PointerEvent } from "react";
import type { Storage } from "../../core/types";
import Panel from "../../components/Panel";
import PieceIcon from "../../components/PieceIcon";
import { pieceColor, toIconCells } from "./palette";
import "./StoragePanel.css";

interface StoragePanelProps {
  storage: Storage;
  armedIndex: number | null;
  canStore: boolean;
  disabled: boolean;
  onStore: (slotIndex: number) => void;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>, index: number) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLButtonElement>) => void;
}

// 임시 보관함. 빈 칸은 선택한 덩어리를 받고, 찬 칸은 손패 카드처럼 다시 꺼내 놓는다
function StoragePanel({ storage, armedIndex, canStore, disabled, onStore, onPointerDown, onPointerMove, onPointerUp }: StoragePanelProps) {
  const used = storage.slots.filter(Boolean).length;
  return (
    <Panel tone="wood" className="storage">
      <h2 className="storage__title">임시 보관함</h2>
      <Panel tone="green" className="storage__well">
        {storage.slots.map((slot, i) =>
          slot ? (
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
              <PieceIcon cells={toIconCells(slot.shape.cells)} color={pieceColor(slot.color).color} shade={pieceColor(slot.color).shade} cellSize={slot.shape.cells.length > 12 ? 12 : 18} />
              <span className="storage__size">{slot.shape.size}칸</span>
            </button>
          ) : (
            <button
              key={i}
              type="button"
              className={`storage__slot ${canStore ? "can-store" : ""}`}
              disabled={disabled || !canStore}
              onClick={() => onStore(i)}
            >
              {canStore ? "여기에 보관" : "빈 칸"}
            </button>
          ),
        )}
      </Panel>
      <p className="storage__count">
        {used} / {storage.slots.length}
      </p>
    </Panel>
  );
}

export default StoragePanel;
