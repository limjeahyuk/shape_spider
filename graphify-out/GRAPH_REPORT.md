# Graph Report - ShapeSpider  (2026-09-14)

## Corpus Check
- Corpus is ~10,930 words - fits in a single context window. You may not need a graph.

## Summary
- 317 nodes · 591 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.89)
- Token cost: 157,163 input · 0 output

## Community Hubs (Navigation)
- Board Core Logic
- App Shell and UI Components
- Design Docs and Cards
- NPM Dependencies
- Game State Data Model
- Core Types and Panel
- Selection and Placement Rules
- App TS Config
- Board Grid Rendering
- Node TS Config
- Rendering and Input Constraints
- Oxlint Config
- Stack and Template
- TS Project References
- Immutable State
- Pure Core Constraint
- Favicon and Vite
- Component Reuse Rule
- Tap-Drag-Confirm Interaction

## God Nodes (most connected - your core abstractions)
1. `reduce()` - 18 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 15 edges
4. `react` - 14 edges
5. `pieceColor` - 12 edges
6. `canPlace()` - 11 edges
7. `GameScreen()` - 11 edges
8. `findExtractPositions()` - 9 edges
9. `Coord` - 9 edges
10. `GameState` - 9 edges

## Surprising Connections (you probably didn't know these)
- `<CollectionPanel>` --semantically_similar_to--> `CollectionTray()`  [INFERRED] [semantically similar]
  docs/GAME_DESIGN.md → src/ui/game/CollectionTray.tsx
- `<HandTray>` --conceptually_related_to--> `HandTray()`  [INFERRED]
  docs/GAME_DESIGN.md → src/ui/game/HandTray.tsx
- `<BoardGrid> / <BoardCell>` --conceptually_related_to--> `BoardGrid()`  [INFERRED]
  docs/GAME_DESIGN.md → src/ui/game/BoardGrid.tsx
- `<StoragePanel>` --conceptually_related_to--> `StoragePanel()`  [INFERRED]
  docs/GAME_DESIGN.md → src/ui/game/StoragePanel.tsx
- `CLAUDE.md (Project Instructions)` --references--> `Button()`  [EXTRACTED]
  CLAUDE.md → src/components/Button.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Game End Detection (stuck / stall / clear)** — docs_game_rules_game_end, docs_game_rules_stall_prevention, docs_game_design_isstuck, docs_game_design_isstalled, docs_game_design_hasanyplacement, docs_game_design_findextractpositions [INFERRED 0.85]
- **Destination-Based Selection Pipeline** — docs_game_design_destination_determines_selection, docs_game_design_selectcells, docs_game_design_findextractpositions, docs_game_design_connectedgroup, docs_game_design_snaptonearestvalid, docs_game_design_selectionoverlay [INFERRED 0.85]
- **GameState Data Model Composition** — docs_game_design_gamestate, docs_game_design_board, docs_game_design_deck, docs_game_design_collectiontrack, docs_game_design_storage, docs_game_design_selection, docs_game_design_score, docs_game_design_snapshot, docs_game_design_gameconfig [EXTRACTED 1.00]

## Communities (19 total, 6 thin omitted)

### Community 0 - "Board Core Logic"
Cohesion: 0.10
Nodes (48): at(), canPlace(), connectedGroup(), createBoard(), Edges, extract(), findExtractPositions(), findPlacements() (+40 more)

### Community 1 - "App Shell and UI Components"
Cohesion: 0.10
Nodes (28): theme.ts Color Usage Rule (no inline hex), index.html (SPA Entry), #root Mount Element, react, App(), Screen, Button(), ButtonProps (+20 more)

### Community 2 - "Design Docs and Cards"
Cohesion: 0.11
Nodes (25): CLAUDE.md (Project Instructions), GAME_DESIGN.md (Technical Design), <StoragePanel>, GAME_RULES.md (Canonical Game Rules), Shape Spider Planning Document (lim-it.vercel.app), Card(), CardProps, PieceIcon() (+17 more)

### Community 3 - "NPM Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, react, react-dom, devDependencies, oxlint, @types/node, @types/react, @types/react-dom (+20 more)

### Community 4 - "Game State Data Model"
Cohesion: 0.08
Nodes (26): No Magic Numbers (all settings via GameConfig), 1D Board Array (index = r * cols + c), Action List (DRAW_HAND, PLACE_PIECE, PASS_HAND, REBUILD_DECK, *_SELECTION, UNDO), Balance Numbers (target 3~6, 140-card deck), Board (rows, cols, cells[]), Card (pieceId, shape, color), Cell ({color, pieceId} | null), Cell-Level Ownership Board Model (+18 more)

### Community 5 - "Core Types and Panel"
Cohesion: 0.10
Nodes (22): Panel(), PanelProps, Tone, DrawResult, Cell, CollectionTrack, ColorId, Deck (+14 more)

### Community 6 - "Selection and Placement Rules"
Cohesion: 0.10
Nodes (19): Destination-Based Selection Rule Constraint, canPlace(), <CollectionPanel>, CollectionTrack (per-color nextSize, collected), connectedGroup() (4-direction), Principle: Destination Determines Selection Rule, findExtractPositions(), hasAnyPlacement() (+11 more)

### Community 7 - "App TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "Board Grid Rendering"
Cohesion: 0.19
Nodes (17): outlineEdges(), Board, Coord, GameConfig, Selection, BoardGrid(), BoardGridProps, boundsOf() (+9 more)

### Community 9 - "Node TS Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 10 - "Rendering and Input Constraints"
Cohesion: 0.18
Nodes (11): DOM + CSS Grid Rendering Constraint (no Canvas, single overlay div), Pointer Events Input Constraint (no HTML5 DnD, touch-action: none), <BoardGrid> / <BoardCell>, DOM + CSS Grid Rendering Decision, Keyboard Accessibility (arrows + Enter), Open Technical Decisions (useReducer vs zustand, dnd-kit, Vitest, score location, snapshot scope), outlineEdges() Render Helper, Pointer Events Input Decision (+3 more)

### Community 11 - "Oxlint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "Stack and Template"
Cohesion: 0.50
Nodes (5): Stack: Vite 8 + React 19 + TypeScript + oxlint, README.md (Vite React Template), Oxlint Type-Aware Configuration, React Compiler (disabled), React + TypeScript + Vite Template

## Ambiguous Edges - Review These
- `Pointer Events Input Decision` → `Open Technical Decisions (useReducer vs zustand, dnd-kit, Vitest, score location, snapshot scope)`  [AMBIGUOUS]
  docs/GAME_DESIGN.md · relation: conceptually_related_to

## Knowledge Gaps
- **100 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 119 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Pointer Events Input Decision` and `Open Technical Decisions (useReducer vs zustand, dnd-kit, Vitest, score location, snapshot scope)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `App Shell and UI Components` to `Board Grid Rendering`, `Design Docs and Cards`, `NPM Dependencies`, `Core Types and Panel`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `CollectionTrack (per-color nextSize, collected)` connect `Selection and Placement Rules` to `Game State Data Model`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `CollectionTray()` connect `Selection and Placement Rules` to `Board Grid Rendering`, `Design Docs and Cards`, `Core Types and Panel`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Board Core Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.09898989898989899 - nodes in this community are weakly interconnected._
- **Should `App Shell and UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._