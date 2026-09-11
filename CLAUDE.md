# Shape Spider

2D 공간 전략 퍼즐 (폴리오미노 + 스파이더 카드게임). 클라이언트 전용 SPA.
Game Rules: `docs/GAME_RULES.md` 참조
데이터 모델과 설계: `docs/GAME_DESIGN.md` 참조

## STACK & Cmd

- Vite 8, React 19, TypeScript, oxlint
- `npm run dev` | `npm run build` | `npm run lint`

## Architecture Constraints (STRICT)

- 순수 Core: `src/core/` 내부 코드는 순수 TypeScript로만 작성하며 `React` 관련 임포트를 절대 금지한다.
- 1차원 보드: 보드는 1차원 배열로 모델링한다 (`index = r * cols + c`). 도형 단위로 관리하지 마라.
  - `type Cell = { color: ColorId; pieceId: PieceId } | null;`
- 목적지 기반 선택 규칙: 추출 선택 로직은 목적지가 결정하며, `(board, startCell, dest) -> Coord[]` 형태로 분리한다.
- DOM 렌더링: Canvas 및 외부 게임 엔진 사용을 금지한다. DOM + CSS Grid만 사용하고, 이동 시 셀 리렌더링을 피하라. (선택 프레임은 오버레이 `div` 1개로 처리)
- 입력 처리: HTML5 Drag & Drop API 사용을 금지한다. Pointer Events를 사용하고, 보드 컨테이너에 `touch-action: none`을 필수로 지정하라.

## Coding Conventions & Agent Rules

- 불변성 유지: 상태는 불변(Immutable) 객체로 다루고, 핵심 함수는 새 객체를 반환한다.
- 매직 넘버 금지: 모든 설정값은 `GameConfig`를 참조한다.
- 주석 규칙: 주석은 한국어로 작성하되 2줄 이하로 제한한다. (이모티콘 절대 금지)
- Git Commit: 기능 구현이나 버그 수정이 "완전히" 끝났을 때만 자동으로 커밋을 진행하며, 메시지는 한 줄로 간결하게 작성한다.
- 답변 형식 (No Yapping): 인사말과 이모티콘을 생략하고, 다음 3가지만 개조식으로 간결히 출력하라.
  1. 수정한 파일명 (단, 수정 코드가 5줄 이하일 경우에만 해당 코드를 포함)
  2. 무엇을, 왜 수정했는지
  3. 수정 후 예상되는 동작 변화 (또는 확인이 필요한 터미널 검증 명령어)
- 개발 중 룰 자체가 수정이 되는 경우 `docs/GAME_RULES.md` 수정 요청.
- 개발 중 요소를 만들어야 하는 상황에서는 `components` 폴더 내부에 있는 컴포넌트를 우선적으로 사용하기.
  - 새로운 요소가 있을시에는 컴포넌트를 만들고 여기에 하단에 어떤 컴포넌트인지 작성 (설명은 최대 3줄 이하로)
- `theme.ts` 의 Color를 사용.
  - 만약 새로운 헥사코드를 사용해야하는 상황에서는 Color 내부에 선언 후 사용.
  - 코드에 직접적으로 hex 코드 사용하지 않기.
