import type { HTMLAttributes, ReactNode } from "react";
import "./Panel.css";

type Tone = "wood" | "green";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  children: ReactNode;
}

// 목재/녹색 질감의 컨테이너 패널
function Panel({ tone = "wood", className = "", children, ...rest }: PanelProps) {
  return (
    <div className={`ss-panel ss-panel--${tone} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export default Panel;
