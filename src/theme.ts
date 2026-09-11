// 앱 전체 색상 팔레트. 코드에서 hex를 직접 쓰지 말고 반드시 여기서 참조한다
const Color = {
  WHITE: "#FFFFFF",
  BLACK: "#000000",

  // 배경
  BG_DEEP: "#1A0F08",
  BG_MID: "#2A1A10",

  // 목재 패널
  WOOD_LIGHT: "#7A4A2A",
  WOOD: "#5C3419",
  WOOD_DARK: "#3E2110",
  WOOD_BORDER: "#8A5A38",
  WOOD_EDGE: "#A06B44",

  // 텍스트
  CREAM: "#F3E2B0",
  CREAM_SOFT: "#D9C39A",
  TAN: "#C9AD7E",
  GOLD: "#E0B25C",
  GOLD_TEXT: "#D4A85A",
  TEXT_SHADOW: "#2B1607",

  // 안내 패널 (녹색)
  PANEL_GREEN: "#22332B",
  PANEL_GREEN_DEEP: "#1B2A24",
  PANEL_GREEN_BORDER: "#3A4D42",

  // 버튼
  BTN_WOOD: "#8A5230",
  BTN_WOOD_DEEP: "#6D3D20",
  BTN_WOOD_BORDER: "#A56B3F",
  BTN_WOOD_ACTIVE: "#A35F33",
  BTN_GOLD: "#C9852E",
  BTN_GOLD_DEEP: "#A8651E",
  BTN_GOLD_BORDER: "#E6B04F",
  BTN_GOLD_TEXT: "#F7EAD0",

  // 도형 색상
  PIECE_RED: "#D95F4F",
  PIECE_RED_DEEP: "#B8483A",
  PIECE_GREEN: "#5FB87A",
  PIECE_GREEN_DEEP: "#47935F",
} as const;

// 폰트 스택
const Font = {
  SERIF: "Georgia, 'Times New Roman', 'Noto Serif KR', 'Apple SD Gothic Neo', serif",
} as const;

// Color 키를 --color-{key} 형태의 CSS 변수로 :root에 주입한다
function applyTheme(root: HTMLElement = document.documentElement): void {
  for (const [key, value] of Object.entries(Color)) {
    root.style.setProperty(`--color-${key.toLowerCase().replace(/_/g, "-")}`, value);
  }
  root.style.setProperty("--font-serif", Font.SERIF);
}

export { Color, Font, applyTheme };
