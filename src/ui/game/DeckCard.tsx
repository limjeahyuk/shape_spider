import PieceIcon from "../../components/PieceIcon";
import { Color } from "../../theme";
import "./DeckCard.css";

const PIECE_PLUS = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] as const;

interface DeckCardProps {
  remaining: number;
  recycled: number;
  disabled: boolean;
  onClick: () => void;
}

// 덱 뒷면 카드와 남은 카드 수. 덱을 누르면 손패를 넘긴다
function DeckCard({ remaining, recycled, disabled, onClick }: DeckCardProps) {
  return (
    <div className="deck">
      <button type="button" className="deck__stack" disabled={disabled} onClick={onClick} aria-label="손패 넘기기">
        <div className="deck__back deck__back--under" />
        <div className="deck__back">
          <PieceIcon cells={PIECE_PLUS} color={Color.WOOD_EDGE} shade={Color.WOOD_LIGHT} cellSize={12} />
          <span className="deck__word">덱</span>
        </div>
      </button>
      <p className="deck__count">
        남은 카드 <strong>{remaining}</strong>
      </p>
      {recycled > 0 && <p className="deck__sub">미사용 더미 {recycled}</p>}
    </div>
  );
}

export default DeckCard;
