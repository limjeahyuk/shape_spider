import type { Coord } from "../../core/types";
import { pieceColor } from "./palette";

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function center(r: DOMRect): [number, number] {
  return [r.left + r.width / 2, r.top + r.height / 2];
}

// node를 화면 좌표 from에 고정으로 붙여 to로 날려 보내고, 도착하면 제거한다
export function fly(node: HTMLElement, from: DOMRect, to: DOMRect, parent: Element = document.body, ms = 350): void {
  Object.assign(node.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "100",
    pointerEvents: "none",
  });
  node.classList.add("is-flying");
  parent.append(node);
  const [fx, fy] = center(from);
  const [tx, ty] = center(to);
  // 큰 칸으로 갈 때 확대하진 않는다
  const s = Math.min(1, to.width / from.width, to.height / from.height);
  node
    .animate(
      [{ transform: "none", opacity: 1 }, { transform: `translate(${tx - fx}px, ${ty - fy}px) scale(${s})`, opacity: 0.85 }],
      { duration: reduced() ? 0 : ms, easing: EASE },
    )
    .finished.then(() => node.remove());
}

// 이미 제자리에 놓인 el이 from 위치에서 날아온 것처럼 보이게 한다 (FLIP)
export function dealIn(el: HTMLElement, from: DOMRect, delay = 0, ms = 320): void {
  const to = el.getBoundingClientRect();
  const [fx, fy] = center(from);
  const [tx, ty] = center(to);
  el.animate(
    [{ transform: `translate(${fx - tx}px, ${fy - ty}px) scale(${from.width / to.width})`, opacity: 0.6 }, { transform: "none", opacity: 1 }],
    { duration: reduced() ? 0 : ms, delay: reduced() ? 0 : delay, easing: EASE, fill: "backwards" },
  );
}

export function boundsOf(cells: Coord[]) {
  const rs = cells.map((p) => p.r);
  const cs = cells.map((p) => p.c);
  return { r0: Math.min(...rs), c0: Math.min(...cs), r1: Math.max(...rs), c1: Math.max(...cs) };
}

// 판 위 칸 집합을 색칠한 격자 div로 만든다. 판에서 떼어 날리는 용도
export function cellsNode(cells: Coord[], color: number): HTMLElement {
  const b = boundsOf(cells);
  const p = pieceColor(color);
  const el = document.createElement("div");
  el.className = "board-ghost";
  el.style.setProperty("--piece-color", p.color);
  el.style.setProperty("--piece-shade", p.shade);
  el.style.gridTemplateRows = `repeat(${b.r1 - b.r0 + 1}, 1fr)`;
  el.style.gridTemplateColumns = `repeat(${b.c1 - b.c0 + 1}, 1fr)`;
  for (const q of cells) {
    const s = document.createElement("span");
    s.style.gridArea = `${q.r - b.r0 + 1} / ${q.c - b.c0 + 1}`;
    el.append(s);
  }
  return el;
}
