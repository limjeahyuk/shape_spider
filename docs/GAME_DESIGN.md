# Shape Spider — 기술 설계 문서

> 기획서 원본: https://lim-it.vercel.app/posts/shapespider/
> 이 문서는 기획서를 **구현 관점**으로 옮긴 것이다. 게임 룰 자체의 최종 정의는 `GAME_RULES.md`를 따른다.

---

## 1. 확정된 설계 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 렌더링 | **DOM + CSS Grid** (Canvas·게임엔진 미사용) | 10×10 = 100셀, 실시간 렌더 루프 불필요. 잘린 모양·구멍 뚫린 모양을 셀 단위로 그리므로 도형이 분해돼도 렌더링 변화 없음 |
| 스택 | Vite + React 19 + TypeScript | 클라이언트 전용 SPA. 백엔드·SSR 요구 없음 |
| 보드 모델 | **칸(cell) 단위 소유권** | 정사각형 추출 시 배치된 도형이 잘리므로, 도형 단위 모델은 성립하지 않음 |
| 추출 위치 | **유저가 직접 선택** | 7×8에서 4×4를 뽑는 위치가 20가지 → 전략의 핵심 |
| 선택 규칙 | **목적지가 규칙을 결정한다** | 하이라이트 모호성 제거 (아래 2절) |
| 조작 | 탭으로 프레임 소환 → 드래그로 조정 → 확정 | 더블클릭은 모바일 줌 충돌로 배제 |
| 입력 | **Pointer Events** | 마우스·터치 단일 코드. HTML5 Drag&Drop API는 터치 미지원이라 사용 금지 |

---

## 2. 핵심 원칙: 목적지가 선택 규칙을 결정한다

판 위에서 "무엇을 뽑을지"를 유저가 지정하려 하면 모호해진다. **목적지를 먼저 정하면 규칙이 유일해진다.**

| 목적지 | 선택 규칙 | 유저가 정하는 것 |
|---|---|---|
| **수집함** | 해당 색의 다음 목표 `N×N` | 위치만 |
| **보관함** *(도입 시)* | 연결된 같은 색 덩어리 **전체** | 없음 (자동 결정) |

이 원칙 덕분에 보관함 도입 여부를 나중에 결정해도 구조가 흔들리지 않는다.
선택 로직을 `(board, startCell, destination) → Coord[]` 형태의 **교체 가능한 함수**로 분리하고,
하이라이트 렌더러는 "칸 집합"만 받게 한다. 보관함 추가 = 함수 하나 추가.

---

## 3. 데이터 모델

```ts
type ColorId = number;              // 0..colorCount-1
type PieceId = number;              // 배치된 도형의 고유 ID
type Coord   = { r: number; c: number };

// ── 보드 ───────────────────────────────────────────────
type Cell = { color: ColorId; pieceId: PieceId } | null;

interface Board {
  rows: number;
  cols: number;
  cells: Cell[];                    // 길이 rows*cols, index = r * cols + c
}
```

> **1차원 배열 권장.** 불변 업데이트(`cells.with(i, v)`)가 단순하고, 인덱스 산술이 좌표 변환과 직결된다.

> `pieceId`를 함께 저장하는 이유: 같은 색 도형끼리 맞닿았을 때 **내부 이음새를 옅게 렌더링**하기 위함.
> 판정 로직은 `color`만 사용한다.

```ts
// ── 도형 / 덱 ──────────────────────────────────────────
interface PieceShape {
  id: string;
  cells: Coord[];                   // 정규화: min(r)=0, min(c)=0
  size: number;                     // cells.length
}

interface Card {
  pieceId: PieceId;
  shape: PieceShape;
  color: ColorId;
}

interface Deck {
  pending: Card[];                  // 아직 제시되지 않은 카드 (덱 순서)
  hand: Card[];                     // 현재 제시된 카드 (기본 5장)
  recycled: Card[];                 // 미사용으로 넘어간 카드 (덱 소진 후 재구성용)
}

// ── 수집함 ─────────────────────────────────────────────
interface CollectionTrack {
  color: ColorId;
  nextSize: number | null;          // 다음에 넣어야 할 크기. null이면 해당 색 완료
  collected: number[];              // 완료한 크기 목록 [3, 4, ...]
}

// ── 보관함 (도입 시) ───────────────────────────────────
interface Storage {
  slot: { color: ColorId; cells: Coord[] } | null;   // 한 조각만
}

// ── 선택 상태 ──────────────────────────────────────────
type Selection =
  | { kind: 'collect'; color: ColorId; size: number; anchor: Coord; valid: boolean }
  | { kind: 'store';   color: ColorId; cells: Coord[] };

// ── 전체 상태 ──────────────────────────────────────────
interface GameConfig {
  rows: number;                     // 기본 10
  cols: number;                     // 기본 10
  colorCount: number;               // 기본 4
  targetSizes: number[];            // 기본 [3,4,5,6,7,8]
  handSize: number;                 // 기본 5
  storageEnabled: boolean;
}

interface GameState {
  config: GameConfig;
  board: Board;
  deck: Deck;
  collection: CollectionTrack[];    // 색상별
  storage: Storage;
  selection: Selection | null;
  status: 'playing' | 'won' | 'stuck';
}
```

---

## 4. 상태 흐름

```
   ┌──────────────┐
   │  카드 제시    │  hand ← pending에서 handSize장
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐   배치 가능한 카드가 하나도 없음
   │  도형 배치    │ ─────────────────────────────► status = 'stuck'
   │  (재배치 불가)│
   └──────┬───────┘
          │ hand 소진             ┌─────────────────────┐
          ├──────────────────────►│ 미사용 카드 → recycled│
          │                       └──────────┬──────────┘
          │                                  │ pending 소진 시
          │                                  │ recycled → pending 재구성
          ▼                                  ▼
   ┌──────────────────────────────────────────────────┐
   │  정사각형 추출 (언제든 가능)                        │
   │   1. 색 칸 탭 → N×N 프레임 소환 (유효 위치로 스냅)   │
   │   2. 드래그로 위치 조정 (실시간 유효성 표시)         │
   │   3. 확정 → 해당 칸 null, 수집함에 기록             │
   └──────────────────────────────────────────────────┘
          │ 모든 색 targetSizes 완료
          ▼
      status = 'won'
```

### 액션 목록

| 액션 | 페이로드 | 설명 |
|---|---|---|
| `DRAW_HAND` | — | pending에서 handSize장 제시 |
| `PLACE_PIECE` | `{ handIndex, anchor }` | 도형을 판에 고정 (되돌리기 없음) |
| `RECYCLE_HAND` | — | 미사용 카드를 recycled로 이동 후 재제시 |
| `BEGIN_SELECTION` | `{ cell, destination }` | 프레임 소환. destination이 규칙 결정 |
| `MOVE_SELECTION` | `{ anchor }` | 프레임 이동 (칸 단위 변화 시에만 재계산) |
| `CONFIRM_SELECTION` | — | 추출 실행 |
| `CANCEL_SELECTION` | — | 프레임 해제 |

---

## 5. 핵심 순수 함수 (core/)

React와 무관한 순수 함수. **여기가 게임의 본체이며 유닛 테스트 대상이다.**

```ts
// 좌표
const idx  = (b: Board, r: number, c: number) => r * b.cols + c;
const at   = (b: Board, r: number, c: number): Cell => ...;
const inBounds = (b: Board, r: number, c: number): boolean => ...;

// 배치
canPlace(board: Board, shape: PieceShape, anchor: Coord): boolean;
place(board: Board, card: Card, anchor: Coord): Board;              // 새 Board 반환
hasAnyPlacement(board: Board, hand: Card[]): boolean;               // 막힘(stuck) 판정

// 추출
isUniformSquare(board: Board, color: ColorId, size: number, anchor: Coord): boolean;
findExtractPositions(board: Board, color: ColorId, size: number): Coord[];
extract(board: Board, anchor: Coord, size: number): Board;
snapToNearestValid(candidates: Coord[], desired: Coord): Coord | null;

// 보관함 (도입 시)
connectedGroup(board: Board, start: Coord): Coord[];                 // 상하좌우 4방향 연결

// 선택 규칙 디스패치 — 보관함 추가 시 여기에 케이스 하나 추가
selectCells(board: Board, start: Coord, dest: Destination): Coord[];

// 렌더 보조
outlineEdges(board: Board, r: number, c: number): Edges;             // 이웃과 다른 변만 true
```

### 계산량

`findExtractPositions`는 최악의 경우에도 `(11-N)² × N²` 회 검사다.
`N=3..8` 전체를 매 상태 변화마다 돌려도 1만 회 미만 → **매 프레임 실행해도 무방**.
프레임 드래그 중에는 `anchor`가 칸 단위로 바뀔 때만 재계산한다.

---

## 6. 렌더링 구조

```
<BoardGrid>                 display: grid; touch-action: none;
  ├ <BoardCell> × 100       색상 배경 + 이웃 비교 기반 외곽선
  └ <SelectionOverlay>      div 1개. grid-area: r / c / r+N / c+N
                            pointer-events: none
                            유효=초록 / 무효=빨강
<HandTray>                  현재 제시된 카드 5장
<CollectionPanel>           색상별 다음 목표 + 완료 목록
<StoragePanel>              (도입 시)
```

**성능 원칙:** 프레임 이동 시 100개 셀을 리렌더하지 않는다.
오버레이 div 하나의 `grid-area`(또는 `transform`)만 갱신한다.

### 터치 관련 필수 처리

1. 보드 컨테이너에 `touch-action: none` — 없으면 드래그가 페이지 스크롤로 먹힌다
2. 손가락 가림 대응 — 프레임을 터치 지점보다 위로 오프셋하거나 확정 버튼을 둔다
3. grab offset 유지 — 처음 잡은 상대 위치를 보존해야 조작감이 안 튄다
4. 포인터 → 칸 변환은 DOM 탐색 없이 산술로: `Math.floor((e.clientX - rect.left) / cellSize)`

### 접근성 (저비용 추가)

프레임 모델이므로 **방향키 이동 + Enter 확정**을 몇 줄로 붙일 수 있다.

---

## 7. 폴더 구조

```
src/
  core/            # 순수 TS. React 의존성 0. 테스트 대상
    types.ts
    board.ts       # 좌표, 배치, 추출
    rules.ts       # 유효성, 종료 판정, 선택 규칙 디스패치
    deck.ts        # 덱 생성 / 제시 / 재구성
    shapes.ts      # 폴리오미노 카탈로그
  state/           # 상태 컨테이너 (useReducer 또는 zustand)
  ui/              # React 컴포넌트
  styles/
docs/
  GAME_DESIGN.md   # 이 문서
```

> **core/ 분리를 반드시 지킬 것.** 브라우저 없이 로직을 검증할 수 있고,
> 미결정 사항(판 크기, 색상 수, 보관함 유무)을 설정값으로 실험할 수 있으며,
> 나중에 렌더러를 바꿔도 핵심 로직이 살아남는다.

---

## 8. 검토가 필요한 밸런스 수치

색상별 3×3 ~ 8×8을 모두 완성하려면:

```
9 + 16 + 25 + 36 + 49 + 64 = 199칸  (색상 1개당)
199 × 4색                  = 796칸  (총 소요)
```

5칸 폴리오미노 기준 **약 160장**이 필요하고, 5장씩 제시하면 최소 32턴이다.
배치 낭비를 감안하면 실제 플레이는 훨씬 길어진다.

**검토안:** 목표 크기 범위를 `3~6`으로 줄이면 색상당 86칸, 총 344칸(약 69장)으로
한 판이 현실적인 길이가 된다. 8×8까지는 상위 난이도로 두는 편이 나을 수 있다.

---

## 9. 미결정 사항

기획서와 논의에서 아직 확정되지 않은 항목. **`GAME_RULES.md`에 룰이 확정되면 이 절을 정리한다.**

- [ ] 보관함 도입 여부 및 규칙 (연결 덩어리 전체 / 직사각형만 / 한 조각 제한)
- [ ] 보관함에서 꺼내지 못하는 상황의 처리 (회전 허용 / 경고 / 직사각형 제한)
- [ ] 폴리오미노 카탈로그 확정 (칸 수 범위, 종류, 등장 빈도)
- [ ] 판 크기 (10×10 vs 확대)
- [ ] 목표 크기 범위 (8절 참조)
- [ ] 덱 재구성 규칙의 세부 (recycled 순서 유지 여부, 섞기 여부)
- [ ] 추출 후 생긴 빈 칸에 재배치 허용 여부
- [ ] 회전 / 반전 허용 여부
- [ ] 되돌리기(undo) 제공 여부
