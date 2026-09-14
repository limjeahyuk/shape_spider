import { useState } from "react";
import type { Difficulty } from "../core/types";
import { DEFAULT_DIFFICULTY, DIFFICULTY_LABEL, DIFFICULTY_ORDER, getConfig } from "../core/config";
import Button from "../components/Button";
import IconButton from "../components/IconButton";
import Panel from "../components/Panel";
import PieceIcon from "../components/PieceIcon";
import { Color } from "../theme";
import "./StartScreen.css";

// 타이틀 양옆 장식 조각 (X 펜토미노, Z 펜토미노)
const PIECE_PLUS = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] as const;
const PIECE_ZIG = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] as const;

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
  onSettings?: () => void;
}

function StartScreen({ onStart, onSettings }: StartScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const sizes = getConfig(difficulty).targetSizes;
  const sizeRange = `${sizes[0]}×${sizes[0]} ~ ${sizes.at(-1)}×${sizes.at(-1)}`;

  const steps = [
    "덱에서 펼쳐진 카드 5장 중 하나를 골라 조각을 꺼냅니다.",
    "조립 판에 조각을 놓아 빈틈 없는 정사각형을 만듭니다.",
    `완성한 정사각형은 색깔별 수집함의 ${sizeRange} 칸에 들어갑니다.`,
    "수집함을 다 채우거나 쓸수있는 카드가 없을때 게임이 끝납니다",
  ];

  return (
    <main className="start">
      <Panel tone="wood" className="start__board">
        <header className="start__header">
          <p className="start__kicker">
            <span className="start__kicker-line" />
            <span>PENTOMINO PUZZLE</span>
            <span className="start__kicker-line" />
          </p>
          <div className="start__title-row">
            <PieceIcon cells={PIECE_PLUS} color={Color.PIECE_RED} shade={Color.PIECE_RED_DEEP} />
            <h1 className="start__title">SHAPE SPIDER</h1>
            <PieceIcon cells={PIECE_ZIG} color={Color.PIECE_GREEN} shade={Color.PIECE_GREEN_DEEP} />
          </div>
          <p className="start__tagline">다섯 칸 조각으로 정사각형을 완성하세요</p>
        </header>

        <Panel tone="green" className="start__info">
          <section className="start__howto">
            <h2 className="start__section-title">게임 방법</h2>
            <ol className="start__steps">
              {steps.map((text, i) => (
                <li key={i}>
                  <span className="start__step-num">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="start__difficulty">
            <h2 className="start__section-title">난이도</h2>
            <div className="start__difficulty-list" role="group" aria-label="난이도">
              {DIFFICULTY_ORDER.map((d) => (
                <Button key={d} selected={difficulty === d} onClick={() => setDifficulty(d)}>
                  {DIFFICULTY_LABEL[d]}
                </Button>
              ))}
            </div>
          </section>
        </Panel>

        <footer className="start__footer">
          <Button variant="primary" size="lg" className="start__play" onClick={() => onStart(difficulty)}>
            게임 시작
          </Button>
          <IconButton label="설정" className="start__settings" onClick={onSettings}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </IconButton>
        </footer>
      </Panel>
    </main>
  );
}

export default StartScreen;
