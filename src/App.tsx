import { useState } from "react";
import type { Difficulty } from "./core/types";
import { getConfig } from "./core/config";
import StartScreen from "./ui/StartScreen";
import GameScreen from "./ui/game/GameScreen";

type Screen = { name: "start" } | { name: "game"; difficulty: Difficulty; run: number };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "start" });

  if (screen.name === "game") {
    // run 키로 새 게임마다 상태를 새로 만든다
    return (
      <GameScreen
        key={screen.run}
        difficulty={screen.difficulty}
        config={getConfig(screen.difficulty)}
        onExit={() => setScreen({ name: "start" })}
      />
    );
  }

  return <StartScreen onStart={(difficulty) => setScreen({ name: "game", difficulty, run: Date.now() })} />;
}

export default App;
