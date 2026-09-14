import { useState, type PointerEvent } from "react";
import type { Card as CardData } from "../../core/types";
import Card from "../../components/Card";
import PieceIcon from "../../components/PieceIcon";
import { pieceColor, toIconCells } from "./palette";
import "./HandTray.css";

interface HandTrayProps {
  hand: CardData[];
  handSize: number;
  armedIndex: number | null;
  disabled: boolean;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>, handIndex: number) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLButtonElement>) => void;
}

type Layout = (number | null)[];

// 새 손패면 순서대로 채우고, 배치로 빠진 카드는 자리만 비운다
function nextLayout(prev: Layout, hand: CardData[], handSize: number): Layout {
  const ids = hand.map((c) => c.pieceId);
  const isNewHand = ids.some((id) => !prev.includes(id));
  if (isNewHand) return [...ids, ...Array<null>(Math.max(0, handSize - ids.length)).fill(null)];
  return prev.map((id) => (id !== null && ids.includes(id) ? id : null));
}

function same(a: Layout, b: Layout): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// 제시된 손패. 배치한 자리는 빈 슬롯으로 남겨 카드 위치가 흔들리지 않게 한다
function HandTray({ hand, handSize, armedIndex, disabled, onPointerDown, onPointerMove, onPointerUp }: HandTrayProps) {
  const [layout, setLayout] = useState<Layout>(() => nextLayout([], hand, handSize));
  const computed = nextLayout(layout, hand, handSize);
  if (!same(computed, layout)) setLayout(computed);

  return (
    <div className="hand" style={{ gridTemplateColumns: `repeat(${computed.length}, 1fr)` }}>
      {computed.map((id, slot) => {
        const handIndex = hand.findIndex((c) => c.pieceId === id);
        const card = handIndex >= 0 ? hand[handIndex] : null;
        if (!card) return <div key={`empty-${slot}`} className="hand__empty" aria-hidden="true" />;
        const p = pieceColor(card.color);
        return (
          <Card
            key={card.pieceId}
            title={card.shape.id}
            meta={`${card.shape.size}칸`}
            label={`${card.shape.id} 조각`}
            selected={armedIndex === handIndex}
            disabled={disabled}
            onPointerDown={(e) => onPointerDown(e, handIndex)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <PieceIcon cells={toIconCells(card.shape.cells)} color={p.color} shade={p.shade} cellSize={22} />
          </Card>
        );
      })}
    </div>
  );
}

export default HandTray;
