import type { GameStatus, Score } from "../../core/types";
import Button from "../../components/Button";
import Panel from "../../components/Panel";
import "./ResultOverlay.css";

const TITLE: Record<Exclude<GameStatus, "playing">, string> = {
  cleared: "모든 수집함 완성",
  stuck: "더 놓을 곳이 없습니다",
  stalled: "덱이 한 바퀴 돌았습니다",
  resigned: "게임 종료",
};

interface ResultOverlayProps {
  status: GameStatus;
  score: Score;
  recycleCount: number;
  onExit: () => void;
}

// 게임 종료 결과 창. 점수 내역과 시작 화면으로 가는 버튼을 보여준다
function ResultOverlay({ status, score, recycleCount, onExit }: ResultOverlayProps) {
  if (status === "playing") return null;
  return (
    <div className="result" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <Panel tone="wood" className="result__panel">
        <h2 id="result-title" className={`result__title ${status === "cleared" ? "is-win" : ""}`}>
          {TITLE[status]}
        </h2>
        <Panel tone="green" className="result__lines">
          <div>
            <span>정사각형 점수</span>
            <span>{score.collected.toLocaleString()}</span>
          </div>
          <div>
            <span>재구성 감점 ({recycleCount}회)</span>
            <span>-{score.penalty.toLocaleString()}</span>
          </div>
          <div>
            <span>완성 보너스</span>
            <span>+{score.bonus.toLocaleString()}</span>
          </div>
          <div className="result__total">
            <span>최종 점수</span>
            <span>{score.total.toLocaleString()}</span>
          </div>
        </Panel>
        <Button variant="primary" size="lg" onClick={onExit}>
          시작 화면으로
        </Button>
      </Panel>
    </div>
  );
}

export default ResultOverlay;
