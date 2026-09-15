import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  Coord,
  Difficulty,
  GameConfig,
  PieceShape,
} from "../../core/types";
import { DIFFICULTY_LABEL } from "../../core/config";
import { at, canPlace, connectedGroup, shapeCellsAt, squareCells } from "../../core/board";
import { remainingCount } from "../../core/deck";
import { createGame, reduce } from "../../core/game";
import { remainingTargets } from "../../core/rules";
import { grabCell, rotateShape, shapeBounds } from "../../core/shapes";
import Button from "../../components/Button";
import IconButton from "../../components/IconButton";
import Panel from "../../components/Panel";
import BoardGrid, { type Ghost } from "./BoardGrid";
import CollectionTray from "./CollectionTray";
import DeckCard from "./DeckCard";
import { cellsNode, boundsOf, fly } from "./fly";
import HandTray from "./HandTray";
import InfoPanel from "./InfoPanel";
import { pieceColor } from "./palette";
import ResultOverlay from "./ResultOverlay";
import StoragePanel from "./StoragePanel";
import { useMediaQuery } from "../useMediaQuery";
import "./GameScreen.css";

interface GameScreenProps {
  difficulty: Difficulty;
  config: GameConfig;
  onExit: () => void;
}

// 손패 또는 보관함에서 집어 든 조각
interface Armed {
  source: "hand" | "storage";
  index: number;
}

interface CardDrag extends Armed {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  wasArmed: boolean;
}

interface FrameDrag {
  pointerId: number;
  grab: Coord;
  startX: number;
  startY: number;
  moved: boolean;
}

const DRAG_THRESHOLD_PX = 6;
const MOBILE_QUERY = "(max-width: 900px)";
const TOUCH_LIFT_ROWS = 1;

function GameScreen({ difficulty, config, onExit }: GameScreenProps) {
  const [game, dispatch] = useReducer(reduce, config, createGame);
  const [armed, setArmed] = useState<Armed | null>(null);
  const [hover, setHover] = useState<Coord | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardDrag = useRef<CardDrag | null>(null);
  const frameDrag = useRef<FrameDrag | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  // 집어 든 조각의 시계 방향 90도 회전 횟수. 다른 조각을 집거나 내려놓으면 0으로 돌아간다
  const [rotation, setRotation] = useState(0);

  const playing = game.status === "playing";

  // 포인터 좌표를 DOM 탐색 없이 산술로 칸 좌표로 바꾼다
  // extraRows: 터치 드래그는 조각을 손가락 위로 올리므로 판 아래쪽을 그만큼 더 허용한다
  const cellFromPoint = useCallback(
    (x: number, y: number, extraRows = 0): Coord | null => {
      const el = gridRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const size = rect.width / game.board.cols;
      const c = Math.floor((x - rect.left) / size);
      const r = Math.floor((y - rect.top) / size);
      if (r < 0 || c < 0 || r >= game.board.rows + extraRows || c >= game.board.cols)
        return null;
      return { r, c };
    },
    [game.board.rows, game.board.cols],
  );

  const armedPiece = useMemo((): {
    shape: PieceShape;
    color: number;
  } | null => {
    if (!armed) return null;
    const piece =
      armed.source === "hand"
        ? game.deck.hand[armed.index]
        : game.storage.slots[armed.index];
    return piece
      ? { shape: rotateShape(piece.shape, rotation), color: piece.color }
      : null;
  }, [armed, rotation, game.deck.hand, game.storage.slots]);

  // 집어 든 조각의 앵커: 포인터 아래 칸에서 잡은 칸만큼 빼고, 터치면 손가락 위로 올린다
  const anchorFor = useCallback(
    (cell: Coord, shape: PieceShape): Coord => {
      const g = grabCell(shape);
      const lift = isTouch ? TOUCH_LIFT_ROWS : 0;
      return { r: cell.r - g.r - lift, c: cell.c - g.c };
    },
    [isTouch],
  );

  const ghost = useMemo((): Ghost | null => {
    if (!armedPiece || !hover) return null;
    const anchor = anchorFor(hover, armedPiece.shape);
    const cells = shapeCellsAt(armedPiece.shape, anchor).filter(
      (p) =>
        p.r >= 0 && p.c >= 0 && p.r < game.board.rows && p.c < game.board.cols,
    );
    return {
      cells,
      valid: canPlace(game.board, armedPiece.shape, anchor),
      color: armedPiece.color,
    };
  }, [armedPiece, hover, anchorFor, game.board]);

  const rotate = () => setRotation((r) => (r + 1) % 4);

  // ── 집어 든 조각을 포인터에 붙여 보여준다. 리렌더 없이 transform만 갱신 ──
  const cursorEl = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const moveCursor = useCallback((x: number, y: number) => {
    lastPointer.current = { x, y };
    if (cursorEl.current) cursorEl.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);
  useEffect(() => {
    if (!dragging) return;
    moveCursor(lastPointer.current.x, lastPointer.current.y);
    const onMove = (e: PointerEvent) => moveCursor(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [dragging, moveCursor]);

  const disarm = useCallback(() => {
    setArmed(null);
    setDragging(false);
    setHover(null);
    setRotation(0);
  }, []);

  const tryPlace = useCallback(
    (cell: Coord): boolean => {
      if (!armed || !armedPiece) return false;
      const anchor = anchorFor(cell, armedPiece.shape);
      if (!canPlace(game.board, armedPiece.shape, anchor)) return false;
      if (armed.source === "hand")
        dispatch({
          type: "PLACE_PIECE",
          handIndex: armed.index,
          anchor,
          rotation,
        });
      else
        dispatch({
          type: "PLACE_STORED",
          slotIndex: armed.index,
          anchor,
          rotation,
        });
      return true;
    },
    [armed, armedPiece, anchorFor, rotation, game.board],
  );

  // ── 연출: 판 위 칸 집합을 to 요소로 날린다 ──
  const flyCells = useCallback(
    (cells: Coord[], color: number, to: Element | null | undefined) => {
      const grid = gridRef.current;
      if (!grid || !to || cells.length === 0) return;
      const g = grid.getBoundingClientRect();
      const size = g.width / game.board.cols;
      const b = boundsOf(cells);
      const from = new DOMRect(g.left + b.c0 * size, g.top + b.r0 * size, (b.c1 - b.c0 + 1) * size, (b.r1 - b.r0 + 1) * size);
      fly(cellsNode(cells, color), from, to.getBoundingClientRect());
    },
    [game.board.cols],
  );

  const confirmSelection = useCallback(() => {
    const sel = game.selection;
    if (sel?.kind !== "collect") return;
    flyCells(squareCells(sel.anchor, sel.size), sel.color, document.querySelector(`.tray[data-color="${sel.color}"] .is-next`));
    dispatch({ type: "CONFIRM_SELECTION" });
  }, [game.selection, flyCells]);

  const storeGroup = (slotIndex: number) => {
    const sel = game.selection;
    if (!sel) return;
    flyCells(connectedGroup(game.board, sel.origin), sel.color, document.querySelectorAll(".storage__slot")[slotIndex]);
    dispatch({ type: "STORE_GROUP", cell: sel.origin, slotIndex });
  };

  // 손패를 넘기면 남은 카드가 덱으로 날아 돌아간다
  const passHand = () => {
    disarm();
    const deck = document.querySelector(".deck__stack")?.getBoundingClientRect();
    if (deck)
      for (const el of document.querySelectorAll<HTMLElement>(".hand .ss-card"))
        fly(el.cloneNode(true) as HTMLElement, el.getBoundingClientRect(), deck, el.parentElement!, 250);
    dispatch({ type: "PASS_HAND" });
  };

  // ── 카드(손패/보관함) 포인터 처리: 클릭이면 집기, 집은 카드를 다시 클릭하면 회전, 끌면 드래그 배치 ──
  const onCardDown =
    (source: Armed["source"]) =>
    (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      // 바깥 클릭 해제(onGamePointerDown)로 전파되지 않게 막는다
      e.stopPropagation();
      if (!playing || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsTouch(e.pointerType === "touch");
      moveCursor(e.clientX, e.clientY);
      const wasArmed = armed?.source === source && armed.index === index;
      if (!wasArmed) setRotation(0);
      cardDrag.current = {
        source,
        index,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        wasArmed,
      };
      setArmed({ source, index });
      if (game.selection) dispatch({ type: "CANCEL_SELECTION" });
    };

  const dragLift = isTouch ? TOUCH_LIFT_ROWS : 0;

  const onCardMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = cardDrag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (
      !d.moved &&
      Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD_PX
    ) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) setHover(cellFromPoint(e.clientX, e.clientY, dragLift));
  };

  const onCardUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = cardDrag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    cardDrag.current = null;
    if (d.moved) {
      const cell = cellFromPoint(e.clientX, e.clientY, dragLift);
      if (cell) tryPlace(cell);
      disarm();
    } else if (d.wasArmed) {
      rotate();
    }
  };

  // 카드와 보드 밖을 누르면 집어 든 조각을 내려놓는다
  const onGamePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (armed && !gridRef.current?.contains(e.target as Node)) disarm();
  };

  // ── 보드 포인터 처리 ──
  const onBoardDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!playing || e.button !== 0) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setIsTouch(e.pointerType === "touch");

    if (armedPiece) {
      tryPlace(cell);
      disarm();
      return;
    }

    const sel = game.selection;
    if (
      sel?.kind === "collect" &&
      cell.r >= sel.anchor.r &&
      cell.r < sel.anchor.r + sel.size &&
      cell.c >= sel.anchor.c &&
      cell.c < sel.anchor.c + sel.size
    ) {
      e.currentTarget.setPointerCapture(e.pointerId);
      frameDrag.current = {
        pointerId: e.pointerId,
        grab: { r: cell.r - sel.anchor.r, c: cell.c - sel.anchor.c },
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      return;
    }

    if (!at(game.board, cell.r, cell.c)) {
      dispatch({ type: "CANCEL_SELECTION" });
      return;
    }
    // 정사각형이 없는 덩어리를 다시 누르면 빈 보관함 칸으로 바로 보낸다
    if (sel?.kind === "pick" && sel.group.some((p) => p.r === cell.r && p.c === cell.c)) {
      const slotIndex = game.storage.slots.findIndex((s, i) => s === null && game.storage.locks[i] === 0);
      if (config.storageEnabled && slotIndex >= 0) {
        storeGroup(slotIndex);
        return;
      }
    }
    dispatch({ type: "BEGIN_SELECTION", cell });
  };

  const onBoardMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const f = frameDrag.current;
    if (f && f.pointerId === e.pointerId) {
      if (
        !f.moved &&
        Math.hypot(e.clientX - f.startX, e.clientY - f.startY) >
          DRAG_THRESHOLD_PX
      )
        f.moved = true;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell && f.moved)
        dispatch({
          type: "MOVE_SELECTION",
          anchor: { r: cell.r - f.grab.r, c: cell.c - f.grab.c },
        });
      return;
    }
    if (armed && !cardDrag.current)
      setHover(cellFromPoint(e.clientX, e.clientY));
  };

  const onBoardUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const f = frameDrag.current;
    if (!f || f.pointerId !== e.pointerId) return;
    frameDrag.current = null;
    if (!f.moved) confirmSelection();
  };

  const onBoardLeave = () => {
    if (!cardDrag.current) setHover(null);
  };

  // ── 키보드: 방향키로 프레임 이동, Enter 확정, Escape 취소 ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!playing) return;
      if (e.key === "Escape") {
        disarm();
        dispatch({ type: "CANCEL_SELECTION" });
        return;
      }
      const sel = game.selection;
      if (sel?.kind !== "collect") return;
      if (e.key === "Enter") {
        confirmSelection();
        return;
      }
      const dir: Record<string, Coord> = {
        ArrowUp: { r: -1, c: 0 },
        ArrowDown: { r: 1, c: 0 },
        ArrowLeft: { r: 0, c: -1 },
        ArrowRight: { r: 0, c: 1 },
      };
      const d = dir[e.key];
      if (!d) return;
      e.preventDefault();
      // 해당 방향으로 가장 가까운 유효 위치를 찾는다
      const next = sel.candidates
        .filter((a) =>
          d.r !== 0
            ? Math.sign(a.r - sel.anchor.r) === d.r
            : Math.sign(a.c - sel.anchor.c) === d.c,
        )
        .sort(
          (a, b) =>
            Math.abs(a.r - sel.anchor.r) +
            Math.abs(a.c - sel.anchor.c) -
            (Math.abs(b.r - sel.anchor.r) + Math.abs(b.c - sel.anchor.c)),
        )[0];
      if (next) dispatch({ type: "MOVE_SELECTION", anchor: next });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, game.selection, disarm, confirmSelection]);

  // 넘기기·되돌리기로 집어 든 조각이 사라지면 렌더 단계에서 해제된 것으로 취급한다
  const activeArmed = armedPiece ? armed : null;

  const infoRows = [
    { label: "난이도", value: DIFFICULTY_LABEL[difficulty] },
    {
      label: "남은 목표",
      value: String(remainingTargets(game.collection, config)),
    },
    { label: "재구성", value: `${game.deck.recycleCount}회` },
    { label: "점수", value: game.score.total.toLocaleString(), strong: true },
  ];

  const sel = game.selection;

  const deckCard = (
    <DeckCard
      remaining={game.deck.pending.length}
      recycled={game.deck.recycled.length}
      disabled={
        !playing || remainingCount(game.deck) + game.deck.hand.length === 0
      }
      onClick={passHand}
    />
  );
  const undoButton = (
    <Button
      disabled={!game.prev}
      onClick={() => {
        disarm();
        dispatch({ type: "UNDO" });
      }}
    >
      되돌리기
    </Button>
  );
  const handTray = (
    <HandTray
      hand={game.deck.hand}
      handSize={config.handSize}
      armedIndex={activeArmed?.source === "hand" ? activeArmed.index : null}
      armedShape={armedPiece?.shape ?? null}
      disabled={!playing}
      onPointerDown={onCardDown("hand")}
      onPointerMove={onCardMove}
      onPointerUp={onCardUp}
    />
  );
  const trays = game.collection.map((track) => (
    <CollectionTray
      key={track.color}
      track={track}
      targetSizes={config.targetSizes}
    />
  ));
  const boardGrid = (
    <BoardGrid
      board={game.board}
      selection={game.selection}
      ghost={ghost}
      gridRef={gridRef}
      onPointerDown={onBoardDown}
      onPointerMove={onBoardMove}
      onPointerUp={onBoardUp}
      onPointerLeave={onBoardLeave}
    />
  );
  const boardFoot = (
    <p className="board__foot">
      <span className="board__size">
        {game.board.rows} × {game.board.cols}
      </span>
    </p>
  );
  const storagePanel = config.storageEnabled && (
    <StoragePanel
      storage={game.storage}
      armedIndex={activeArmed?.source === "storage" ? activeArmed.index : null}
      armedShape={armedPiece?.shape ?? null}
      canStore={!!sel}
      disabled={!playing}
      onStore={storeGroup}
      onPointerDown={onCardDown("storage")}
      onPointerMove={onCardMove}
      onPointerUp={onCardUp}
    />
  );
  const cursorPiece = armedPiece && dragging && (() => {
    const { shape, color } = armedPiece;
    const g = grabCell(shape);
    const b = shapeBounds(shape);
    const p = pieceColor(color);
    const style = {
      gridTemplateRows: `repeat(${b.rows}, var(--cell))`,
      gridTemplateColumns: `repeat(${b.cols}, var(--cell))`,
      "--grab-r": g.r,
      "--grab-c": g.c,
      "--lift": isTouch ? TOUCH_LIFT_ROWS : 0,
      "--piece-color": p.color,
      "--piece-shade": p.shade,
    } as CSSProperties;
    return (
      <div ref={cursorEl} className="drag-piece" style={style} aria-hidden="true">
        {shape.cells.map((q) => (
          <span key={`${q.r}-${q.c}`} style={{ gridArea: `${q.r + 1} / ${q.c + 1}` }} />
        ))}
      </div>
    );
  })();
  const result = !playing && (
    <ResultOverlay
      status={game.status}
      score={game.score}
      recycleCount={game.deck.recycleCount}
      onExit={onExit}
    />
  );

  if (isMobile) {
    const stats = [
      ...infoRows.filter((r) => !r.strong),
      { label: "카드", value: String(game.deck.pending.length) },
    ];
    return (
      <main className="game game--mobile" onPointerDown={onGamePointerDown}>
        <header className="m-head">
          <IconButton label="나가기" className="m-head__back" onClick={onExit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </IconButton>
          <h1 className="m-head__title">SHAPE SPIDER</h1>
          <Panel tone="gold" className="m-head__score">
            <span>점수</span>
            <strong>{game.score.total.toLocaleString()}</strong>
          </Panel>
          <IconButton
            label="되돌리기"
            className="m-head__undo"
            disabled={!game.prev}
            onClick={() => {
              disarm();
              dispatch({ type: "UNDO" });
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
            </svg>
          </IconButton>
        </header>
        <ul className="m-stats">
          {stats.map((r) => (
            <li key={r.label}>
              {r.label} <strong>{r.value}</strong>
            </li>
          ))}
        </ul>
        <div className="m-hand">
          {deckCard}
          {handTray}
        </div>
        <Panel tone="wood" className="board board--mobile">
          {boardGrid}
          {boardFoot}
        </Panel>
        <div className="m-bottom">
          <Panel tone="wood" className="m-trays">
            {trays}
          </Panel>
          {storagePanel}
        </div>
        {cursorPiece}
        {result}
      </main>
    );
  }

  return (
    <main className="game" onPointerDown={onGamePointerDown}>
      <header className="game__top">
        <div className="game__deck">
          {deckCard}
          {undoButton}
        </div>
        {handTray}
        <div className="game__info">
          <InfoPanel rows={infoRows} />
          <button
            type="button"
            className="game__resign"
            disabled={!playing}
            onClick={() => dispatch({ type: "RESIGN" })}
          >
            게임 포기
          </button>
        </div>
      </header>

      <section className="game__middle">
        <aside className="game__side game__side--left">{trays}</aside>

        <Panel tone="wood" className="board">
          <h1 className="board__title">
            <span className="board__rule" />
            SHAPE SPIDER
            <span className="board__rule" />
          </h1>
          {boardGrid}
          {boardFoot}
        </Panel>

        <aside className="game__side">{storagePanel}</aside>
      </section>

      {cursorPiece}
      {result}
    </main>
  );
}

export default GameScreen;
