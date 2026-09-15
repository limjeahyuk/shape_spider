import type { CSSProperties } from "react";
import type { CollectionTrack } from "../../core/types";
import Panel from "../../components/Panel";
import { pieceColor } from "./palette";
import "./CollectionTray.css";

interface CollectionTrayProps {
  track: CollectionTrack;
  targetSizes: number[];
}

// 색상별 수집함. 목표 크기 슬롯을 나열하고 완료한 크기를 색으로 채운다
function CollectionTray({ track, targetSizes }: CollectionTrayProps) {
  const p = pieceColor(track.color);
  const done = track.collected.length;
  const style = { "--piece-color": p.color, "--piece-shade": p.shade } as CSSProperties;
  return (
    <Panel tone="wood" className="tray" style={style} data-color={track.color}>
      {track.nextSize === null ? (
        <Panel tone="wood" className="tray__well is-done">
          <span className="tray__pill" aria-label="완료" />
        </Panel>
      ) : (
      <Panel tone="green" className="tray__well">
        {targetSizes.map((size) => {
          const filled = track.collected.includes(size);
          const next = track.nextSize === size;
          return (
            <span key={size} className={`tray__slot ${filled ? "is-filled" : ""} ${next ? "is-next" : ""}`} title={`${size}×${size}`}>
              {size}
            </span>
          );
        })}
      </Panel>
      )}
      <div className="tray__foot">
        <span className="tray__swatch" aria-hidden="true" />
        <span className="tray__name">{p.name} 수집함</span>
        <span className="tray__progress">
          {done} / {targetSizes.length}
        </span>
        <span className="tray__bar" aria-hidden="true">
          <span className="tray__bar-fill" style={{ width: `${(done / targetSizes.length) * 100}%` }} />
        </span>
      </div>
    </Panel>
  );
}

export default CollectionTray;
