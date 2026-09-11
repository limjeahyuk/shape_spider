import { useState } from "react";
import type { Difficulty } from "./core/types";
import StartScreen from "./ui/StartScreen";

type Screen = { name: "start" } | { name: "game"; difficulty: Difficulty };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "start" });

  if (screen.name === "game") {
    // 게임 화면은 아직 미구현. 시작 화면으로 되돌아갈 수 있는 자리만 잡아둔다
    return (
      <main style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
        <button type="button" onClick={() => setScreen({ name: "start" })}>
          게임 화면 준비 중 ({screen.difficulty}) — 돌아가기
        </button>
      </main>
    );
  }

  return <StartScreen onStart={(difficulty) => setScreen({ name: "game", difficulty })} />;
}

export default App;
