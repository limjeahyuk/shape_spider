import type { Coord, GameConfig, GameState, Snapshot } from "./types";
import { at, canPlace, connectedGroup, createBoard, extract, place, removeCells, snapToNearestValid, squareCells } from "./board";
import { createDeck, drawHand, passHand, type Rng } from "./deck";
import { applyRecyclePenalty, collectTarget, computeTotal, createTracks, isCleared, isStuck, scoreSquare } from "./rules";
import { makeShape } from "./shapes";

export type GameAction =
  | { type: "PLACE_PIECE"; handIndex: number; anchor: Coord }
  | { type: "PLACE_STORED"; slotIndex: number; anchor: Coord }
  | { type: "PASS_HAND" }
  | { type: "BEGIN_SELECTION"; cell: Coord }
  | { type: "MOVE_SELECTION"; anchor: Coord }
  | { type: "CONFIRM_SELECTION" }
  | { type: "CANCEL_SELECTION" }
  | { type: "STORE_GROUP"; cell: Coord; slotIndex: number }
  | { type: "UNDO" }
  | { type: "RESIGN" };

export function createGame(config: GameConfig, rng: Rng = Math.random): GameState {
  const { deck } = drawHand(createDeck(config, rng), config.handSize);
  const base: GameState = {
    config,
    board: createBoard(config.rows, config.cols),
    deck,
    collection: createTracks(config),
    storage: { slots: Array.from({ length: config.storageEnabled ? config.storageSlots : 0 }, () => null) },
    selection: null,
    score: computeTotal({ collected: 0, penalty: 0, bonus: 0 }, config.scoring),
    prev: null,
    status: "playing",
    nextPieceId: 1,
    placedSinceRebuild: true,
  };
  return base;
}

function snapshot(state: GameState): Snapshot {
  const { prev: _prev, selection: _selection, ...rest } = state;
  return rest;
}

// 종료 판정. 전량 완성 시 보너스는 한 번만 가산한다
function finalize(state: GameState): GameState {
  if (state.status !== "playing") return state;
  if (isCleared(state.collection)) {
    const score = computeTotal({ ...state.score, bonus: state.config.scoring.clearBonus }, state.config.scoring);
    return { ...state, score, status: "cleared", selection: null };
  }
  if (isStuck(state)) return { ...state, status: "stuck", selection: null };
  return state;
}

// 손패가 비면 새로 제시한다. 재구성이 일어나면 감점하고 정체 여부를 본다
function refillIfEmpty(state: GameState): GameState {
  if (state.deck.hand.length > 0) return state;
  const { deck, rebuilds } = drawHand(state.deck, state.config.handSize);
  if (rebuilds === 0) return { ...state, deck, prev: null };
  const stalled = !state.placedSinceRebuild;
  return {
    ...state,
    deck,
    score: applyRecyclePenalty(state.score, state.config.scoring, rebuilds),
    prev: null,
    placedSinceRebuild: false,
    status: stalled ? "stalled" : state.status,
  };
}

export function reduce(state: GameState, action: GameAction): GameState {
  if (state.status !== "playing" && action.type !== "UNDO") return state;

  switch (action.type) {
    case "PLACE_PIECE": {
      const card = state.deck.hand[action.handIndex];
      if (!card || !canPlace(state.board, card.shape, action.anchor)) return state;
      const board = place(state.board, card.shape, card.color, state.nextPieceId, action.anchor);
      const hand = state.deck.hand.filter((_, i) => i !== action.handIndex);
      const next: GameState = {
        ...state,
        prev: snapshot(state),
        board,
        deck: { ...state.deck, hand },
        nextPieceId: state.nextPieceId + 1,
        placedSinceRebuild: true,
        selection: null,
      };
      return finalize(refillIfEmpty(next));
    }

    case "PLACE_STORED": {
      const piece = state.storage.slots[action.slotIndex];
      if (!piece || !canPlace(state.board, piece.shape, action.anchor)) return state;
      const board = place(state.board, piece.shape, piece.color, state.nextPieceId, action.anchor);
      const slots = state.storage.slots.with(action.slotIndex, null);
      return finalize({
        ...state,
        prev: snapshot(state),
        board,
        storage: { slots },
        nextPieceId: state.nextPieceId + 1,
        selection: null,
      });
    }

    case "PASS_HAND": {
      const next: GameState = { ...state, deck: passHand(state.deck), prev: null, selection: null };
      return finalize(refillIfEmpty(next));
    }

    case "BEGIN_SELECTION": {
      const cell = at(state.board, action.cell.r, action.cell.c);
      if (!cell) return { ...state, selection: null };
      const pick = { kind: "pick" as const, color: cell.color, origin: action.cell, group: connectedGroup(state.board, action.cell) };
      const { size, candidates } = collectTarget(state.board, state.collection, cell.color);
      if (size === null || candidates.length === 0) return { ...state, selection: pick };
      // 탭한 칸을 포함하는 위치를 우선, 없으면 가장 가까운 위치로 스냅
      const containing = candidates.filter((a) => squareCells(a, size).some((p) => p.r === action.cell.r && p.c === action.cell.c));
      const anchor = snapToNearestValid(containing.length ? containing : candidates, { r: action.cell.r - Math.floor(size / 2), c: action.cell.c - Math.floor(size / 2) })!;
      return { ...state, selection: { kind: "collect", color: cell.color, size, origin: action.cell, anchor, candidates } };
    }

    case "MOVE_SELECTION": {
      const sel = state.selection;
      if (sel?.kind !== "collect") return state;
      const anchor = snapToNearestValid(sel.candidates, action.anchor);
      if (!anchor || (anchor.r === sel.anchor.r && anchor.c === sel.anchor.c)) return state;
      return { ...state, selection: { ...sel, anchor } };
    }

    case "CONFIRM_SELECTION": {
      const sel = state.selection;
      if (sel?.kind !== "collect") return state;
      const board = extract(state.board, sel.anchor, sel.size);
      const collection = state.collection.map((t) => {
        if (t.color !== sel.color) return t;
        const collected = [...t.collected, sel.size];
        const nextIdx = state.config.targetSizes.indexOf(sel.size) + 1;
        return { ...t, collected, nextSize: state.config.targetSizes[nextIdx] ?? null };
      });
      const score = computeTotal({ ...state.score, collected: state.score.collected + scoreSquare(state.config.scoring, sel.size) }, state.config.scoring);
      return finalize({ ...state, prev: snapshot(state), board, collection, score, selection: null });
    }

    case "CANCEL_SELECTION":
      return state.selection ? { ...state, selection: null } : state;

    case "STORE_GROUP": {
      if (state.storage.slots[action.slotIndex] !== null || action.slotIndex >= state.storage.slots.length) return state;
      const group = connectedGroup(state.board, action.cell);
      if (group.length === 0) return state;
      const color = at(state.board, action.cell.r, action.cell.c)!.color;
      const shape = makeShape(`stored-${state.nextPieceId}`, group);
      const slots = state.storage.slots.with(action.slotIndex, { color, shape });
      return finalize({ ...state, prev: snapshot(state), board: removeCells(state.board, group), storage: { slots }, selection: null });
    }

    case "UNDO": {
      if (!state.prev) return state;
      return { ...state.prev, prev: null, selection: null };
    }

    case "RESIGN":
      return { ...state, status: "resigned", selection: null, prev: null };
  }
}
