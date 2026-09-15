import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { Card as CardData, PieceShape } from "../../core/types";
import Card from "../../components/Card";
import PieceIcon from "../../components/PieceIcon";
import { MAX_SHAPE_SPAN } from "../../core/shapes";
import { dealIn } from "./fly";
import { pieceColor, toIconCells } from "./palette";
import "./HandTray.css";

interface HandTrayProps {
  hand: CardData[];
  handSize: number;
  columns?: number; // 한 줄에 놓을 카드 수. 기본은 절반(10장이면 5장씩 2줄)
  armedIndex: number | null;
  armedShape: PieceShape | null; // 집어 든 카드의 회전된 모양
  disabled: boolean;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>, handIndex: number) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLButtonElement>) => void;
}

type Layout = (number | null)[];
// deals: 새 손패가 깔린 횟수. 바뀔 때마다 덱에서 날아오는 연출을 튼다
type State = { slots: Layout; deals: number };

const DEAL_STAGGER_MS = 70;

// 새 손패면 순서대로 채운다. 배치로 빠진 카드도 자리를 유지해 되돌리기 시 같은 자리로 돌아온다
function nextLayout(prev: State, hand: CardData[], handSize: number): State {
  const ids = hand.map((c) => c.pieceId);
  const isNewHand = ids.some((id) => !prev.slots.includes(id));
  if (!isNewHand) return prev;
  return { slots: [...ids, ...Array<null>(Math.max(0, handSize - ids.length)).fill(null)], deals: prev.deals + 1 };
}

// 제시된 손패. 배치한 자리는 빈 슬롯으로 남겨 카드 위치가 흔들리지 않게 한다
function HandTray({ hand, handSize, columns = Math.ceil(handSize / 2), armedIndex, armedShape, disabled, onPointerDown, onPointerMove, onPointerUp }: HandTrayProps) {
  const [state, setState] = useState<State>(() => nextLayout({ slots: [], deals: 0 }, hand, handSize));
  const computed = nextLayout(state, hand, handSize);
  if (computed !== state) setState(computed);
  const root = useRef<HTMLDivElement>(null);

  // 새 손패가 깔리면 각 카드가 덱에서 순서대로 날아온다
  useLayoutEffect(() => {
    const deck = document.querySelector(".deck__stack");
    if (!deck || !root.current) return;
    const from = deck.getBoundingClientRect();
    root.current.querySelectorAll<HTMLElement>(".ss-card:not(.is-flying)").forEach((el, i) => dealIn(el, from, i * DEAL_STAGGER_MS));
  }, [state.deals]);

  return (
    <div ref={root} className="hand" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {computed.slots.map((id, slot) => {
        const handIndex = hand.findIndex((c) => c.pieceId === id);
        const card = handIndex >= 0 ? hand[handIndex] : null;
        if (!card) return <div key={`empty-${slot}`} className="hand__empty" aria-hidden="true" />;
        const p = pieceColor(card.color);
        const shape = armedIndex === handIndex && armedShape ? armedShape : card.shape;
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
            <PieceIcon cells={toIconCells(shape.cells)} color={p.color} shade={p.shade} span={MAX_SHAPE_SPAN} />
          </Card>
        );
      })}
    </div>
  );
}

export default HandTray;
