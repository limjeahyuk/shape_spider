import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type Variant = "primary" | "wood";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  selected?: boolean;
  children: ReactNode;
}

// 목재/황금 질감의 공통 버튼. selected는 난이도 선택처럼 토글 상태를 표시한다
function Button({ variant = "wood", size = "md", selected = false, className = "", children, ...rest }: ButtonProps) {
  const classes = ["ss-btn", `ss-btn--${variant}`, `ss-btn--${size}`, selected ? "is-selected" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} aria-pressed={selected || undefined} {...rest}>
      <span className="ss-btn__label">{children}</span>
    </button>
  );
}

export default Button;
