import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./IconButton.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

// 원형 목재 아이콘 버튼. label은 스크린리더용 aria-label로 사용한다
function IconButton({ label, className = "", children, ...rest }: IconButtonProps) {
  return (
    <button type="button" className={`ss-icon-btn ${className}`.trim()} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export default IconButton;
