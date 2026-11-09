import type { ThemeId } from "./types";
export const themes: Record<
  ThemeId,
  { name: string; icon: string; tokens: Record<string, string> }
> = {
  wecom: {
    name: "企业微信",
    icon: "💬",
    tokens: {
      accent: "#3385f5",
      accent2: "#d7e5f8",
      side: "#e3eaf4",
      bubble: "#ebebed",
      panel: "#ffffff",
      border: "#eeeeef",
      text: "#1f2329",
      muted: "#626e78",
    },
  },
  dingtalk: {
    name: "钉钉",
    icon: "🔔",
    tokens: {
      accent: "#1677ff",
      accent2: "#e6f1ff",
      side: "#f0f5ff",
      bubble: "#e8f3ff",
      panel: "#ffffff",
      border: "#dbe5f4",
      text: "#17233d",
      muted: "#5a6b84",
    },
  },
  feishu: {
    name: "飞书",
    icon: "🪶",
    tokens: {
      accent: "#3370ff",
      accent2: "#e9efff",
      side: "#f5f6f8",
      bubble: "#eef3ff",
      panel: "#ffffff",
      border: "#e5e6eb",
      text: "#1f2329",
      muted: "#646a73",
    },
  },
};
export function applyTheme(
  root: HTMLElement,
  id: ThemeId,
  appearance: "light" | "dark" | "system",
) {
  const t = themes[id];
  root.dataset.theme = id;
  root.dataset.appearance = appearance;
  Object.entries(t.tokens).forEach(([k, v]) =>
    root.style.setProperty(`--bo-theme-${k}`, v),
  );
}
