import Panel from "../../components/Panel";
import "./InfoPanel.css";

interface InfoRow {
  label: string;
  value: string;
  strong?: boolean;
}

interface InfoPanelProps {
  rows: InfoRow[];
}

// 황금색 정보 패널. 난이도·남은 목표·점수 같은 요약 수치를 세로로 나열한다
function InfoPanel({ rows }: InfoPanelProps) {
  return (
    <Panel tone="gold" className="info">
      {rows.map((row) => (
        <div key={row.label} className={`info__row ${row.strong ? "is-strong" : ""}`}>
          <span className="info__label">{row.label}</span>
          <span className="info__value">{row.value}</span>
        </div>
      ))}
    </Panel>
  );
}

export default InfoPanel;
