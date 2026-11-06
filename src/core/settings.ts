import type { AppSettings, Appearance, ThemeId } from '../types';
const KEY = 'bilioffice.settings';
const defaults: AppSettings = { enabled: true, theme: 'wecom', appearance: 'system', disguise: false, hideMedia: false };
const read = (): Partial<AppSettings> => { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
export const loadSettings = (): AppSettings => ({ ...defaults, ...read() });
export const saveSettings = (patch: Partial<AppSettings>): AppSettings => { const next = { ...loadSettings(), ...patch }; localStorage.setItem(KEY, JSON.stringify(next)); return next; };
export const themeLabel = (theme: ThemeId) => ({ wecom: '企业微信', dingtalk: '钉钉', feishu: '飞书' }[theme]);
export const appearanceLabel = (value: Appearance) => ({ light: '浅色', dark: '深色', system: '跟随系统' }[value]);
