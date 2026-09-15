import type { PointerEvent } from "react";
import type { PieceShape, Storage } from "../../core/types";
import Panel from "../../components/Panel";
import PieceIcon from "../../components/PieceIcon";
import { MAX_SHAPE_SPAN } from "../../core/shapes";
import { pieceColor, toIconCells } from "./palette";
import "./StoragePanel.css";

// 보관된 덩어리는 카드 도형보다 클 수 있어 긴 변 기준 정사각 격자에 그린다
function iconSpan(cells: { r: number; c: number }[]): number {
  return Math.max(MAX_SHAPE_SPAN, ...cells.flatMap((p) => [p.r + 1, p.c + 1]));
}

interface StoragePanelProps {
  storage: Storage;
  cooldown: number; // 잠금 해제까지 올려야 하는 도형 수. 진행 점 개수
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
function StoragePanel({ storage, cooldown, armedIndex, armedShape, canStore, disabled, onStore, onPointerDown, onPointerMove, onPointerUp }: StoragePanelProps) {
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
              <PieceIcon cells={toIconCells(shape.cells)} color={pieceColor(slot.color).color} shade={pieceColor(slot.color).shade} span={iconSpan(shape.cells)} />
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
                  <span className="storage__lock-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                  <span className="storage__lock-text">
                    <span className="storage__lock-aside">도형 </span>
                    <strong>{storage.locks[i]}</strong>
                    <span className="storage__lock-aside">개 배치 후 해제</span>
                  </span>
                  <span className="storage__lock-dots" aria-hidden="true">
                    {Array.from({ length: cooldown }, (_, k) => (
                      <i key={k} className={k < cooldown - storage.locks[i] ? "is-on" : ""} />
                    ))}
                  </span>
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
