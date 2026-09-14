import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Card.css";

interface CardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  meta?: string;
  label: string;
  selected?: boolean;
  children: ReactNode;
}

// 크림색 종이 질감의 도형 카드. 좌상단 제목, 우상단 메타, 가운데 아이콘, 하단 라벨
function Card({
  title,
  meta,
  label,
  selected = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const classes = ["ss-card", selected ? "is-selected" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected || undefined}
      {...rest}
    >
      <span className="ss-card__head">
        <span className="ss-card__title">{title}</span>
        {meta && <span className="ss-card__meta">{meta}</span>}
      </span>
      <span className="ss-card__body">{children}</span>
      {/* <span className="ss-card__label">{selected ? "선택됨" : label}</span> */}
    </button>
  );
}

export default Card;
