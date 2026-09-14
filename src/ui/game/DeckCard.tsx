import PieceIcon from "../../components/PieceIcon";
import { Color } from "../../theme";
import "./DeckCard.css";

const PIECE_PLUS = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] as const;

interface DeckCardProps {
  remaining: number;
  recycled: number;
}

// 덱 뒷면 카드와 남은 카드 수. recycled는 넘긴 카드(미사용 더미) 수
function DeckCard({ remaining, recycled }: DeckCardProps) {
  return (
    <div className="deck">
      <div className="deck__stack" aria-hidden="true">
        <div className="deck__back deck__back--under" />
        <div className="deck__back">
          <PieceIcon cells={PIECE_PLUS} color={Color.WOOD_EDGE} shade={Color.WOOD_LIGHT} cellSize={12} />
          <span className="deck__word">덱</span>
        </div>
      </div>
      <p className="deck__count">
        남은 카드 <strong>{remaining}</strong>
      </p>
      {recycled > 0 && <p className="deck__sub">미사용 더미 {recycled}</p>}
    </div>
  );
}

export default DeckCard;
