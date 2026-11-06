import type { AppSettings } from "../types";
declare const GM_getValue: undefined | ((key: string, fallback?: any) => any);
declare const GM_setValue: undefined | ((key: string, value: any) => void);
const KEY = "bilioffice.settings";
const defaults: AppSettings = {
  enabled: true,
  theme: "wecom",
  appearance: "system",
  disguise: false,
  hideMedia: false,
};
export function loadSettings(): AppSettings {
  let raw: any = {};
  try {
    raw =
      typeof GM_getValue === "function"
        ? GM_getValue(KEY, {})
        : JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {}
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
    theme: ["wecom", "dingtalk", "feishu"].includes(raw.theme)
      ? raw.theme
      : defaults.theme,
    appearance: ["light", "dark", "system"].includes(raw.appearance)
      ? raw.appearance
      : defaults.appearance,
    disguise: raw.disguise === true,
    hideMedia: raw.hideMedia === true,
  };
}
export function saveSettings(patch: Partial<AppSettings>) {
  const next = { ...loadSettings(), ...patch };
  if (typeof GM_setValue === "function") GM_setValue(KEY, next);
  else localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
