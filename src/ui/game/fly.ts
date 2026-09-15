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

const POP = [
  { transform: "none", opacity: 1, filter: "brightness(1)" },
  { transform: "scale(1.35)", opacity: 1, filter: "brightness(1.8)", offset: 0.35 },
  { transform: "scale(0)", opacity: 0 },
];
const WAVE = [
  { transform: "none", opacity: 1, filter: "brightness(1)" },
  { transform: "scale(1.1)", opacity: 1, filter: "brightness(1.6)", offset: 0.3 },
  { transform: "scale(0)", opacity: 0 },
];
// 칸당 지연(ms). pop은 정사각형 수집, wave는 색상 완성 소멸
const BURST = { pop: { frames: POP, ms: 420, stagger: 45 }, wave: { frames: WAVE, ms: 300, stagger: 52 } };

// 판 위 칸 집합을 제자리에서 터뜨린다. origin에서 가까운 칸부터 순서대로 사라진다
export function burstCells(cells: Coord[], color: number, from: DOMRect, origin: Coord, style: keyof typeof BURST, delay = 0): void {
  if (cells.length === 0) return;
  const { frames, ms, stagger } = BURST[style];
  const node = cellsNode(cells, color);
  Object.assign(node.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, zIndex: "100", pointerEvents: "none" });
  node.classList.add("is-flying");
  document.body.append(node);
  const spans = node.querySelectorAll<HTMLElement>("span");
  const done = cells.map((q, i) => {
    const d = reduced() ? 0 : delay + Math.hypot(q.r - origin.r, q.c - origin.c) * stagger;
    return spans[i].animate(frames, { duration: reduced() ? 0 : ms, delay: d, easing: EASE, fill: "forwards" }).finished;
  });
  Promise.all(done).then(() => node.remove());
}

// 색상 완성 시 origin 화면 좌표에서 퍼지는 링
export function ripple(x: number, y: number, radius: number, delay = 0): void {
  const el = document.createElement("div");
  el.className = "burst-ring";
  Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
  document.body.append(el);
  el.animate(
    [{ width: "0px", height: "0px", opacity: 0.9 }, { width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: 0 }],
    { duration: reduced() ? 0 : 700, delay: reduced() ? 0 : delay, easing: "ease-out", fill: "forwards" },
  ).finished.then(() => el.remove());
}

// 카드·보관함 칸 등 요소를 제자리에서 튀어 사라지게 한다 (복제본을 띄우므로 원본은 바로 제거해도 된다)
export function popOut(el: HTMLElement, delay = 0): void {
  const r = el.getBoundingClientRect();
  const node = el.cloneNode(true) as HTMLElement;
  Object.assign(node.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: "0", zIndex: "100", pointerEvents: "none" });
  node.classList.add("is-flying");
  document.body.append(node);
  node
    .animate([{ transform: "none", opacity: 1 }, { transform: "scale(1.18)", opacity: 1, offset: 0.4 }, { transform: "scale(0.4)", opacity: 0 }], { duration: reduced() ? 0 : 380, delay: reduced() ? 0 : delay, easing: EASE, fill: "forwards" })
    .finished.then(() => node.remove());
}
