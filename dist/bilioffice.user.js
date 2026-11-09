// ==UserScript==
// @name         bilioffice · B站办公聊天界面
// @namespace    https://github.com/penn0312/bilibiliOffice
// @version      0.1.3
// @description  用企业微信、钉钉或飞书的聊天界面浏览 B 站，支持内联播放与搜索。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://bilibili.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// @connect      api.bilibili.com
// ==/UserScript==
/*! bilioffice: independent implementation; BiliShu / linuxdo-idea-ui reference credit.
The MIT License (MIT)

Copyright (c) 2026 czm15053

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
(() => {
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/core/settings.ts
  var KEY = "bilioffice.settings";
  var defaults = {
    enabled: true,
    theme: "wecom",
    appearance: "system",
    disguise: false,
    hideMedia: false
  };
  function loadSettings() {
    let raw = {};
    try {
      raw = typeof GM_getValue === "function" ? GM_getValue(KEY, {}) : JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
    }
    return {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
      theme: ["wecom", "dingtalk", "feishu"].includes(raw.theme) ? raw.theme : defaults.theme,
      appearance: ["light", "dark", "system"].includes(raw.appearance) ? raw.appearance : defaults.appearance,
      disguise: raw.disguise === true,
      hideMedia: raw.hideMedia === true
    };
  }
  function saveSettings(patch) {
    const next = { ...loadSettings(), ...patch };
    if (typeof GM_setValue === "function") GM_setValue(KEY, next);
    else localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  // src/themes.ts
  var themes = {
    wecom: {
      name: "\u4F01\u4E1A\u5FAE\u4FE1",
      icon: "\u{1F4AC}",
      tokens: {
        accent: "#3385f5",
        accent2: "#d7e5f8",
        side: "#e3eaf4",
        bubble: "#ebebed",
        panel: "#ffffff",
        border: "#eeeeef",
        text: "#1f2329",
        muted: "#626e78"
      }
    },
    dingtalk: {
      name: "\u9489\u9489",
      icon: "\u{1F514}",
      tokens: {
        accent: "#1677ff",
        accent2: "#e6f1ff",
        side: "#f0f5ff",
        bubble: "#e8f3ff",
        panel: "#ffffff",
        border: "#dbe5f4",
        text: "#17233d",
        muted: "#5a6b84"
      }
    },
    feishu: {
      name: "\u98DE\u4E66",
      icon: "\u{1FAB6}",
      tokens: {
        accent: "#3370ff",
        accent2: "#e9efff",
        side: "#f5f6f8",
        bubble: "#eef3ff",
        panel: "#ffffff",
        border: "#e5e6eb",
        text: "#1f2329",
        muted: "#646a73"
      }
    }
  };
  function applyTheme(root, id, appearance) {
    const t = themes[id];
    root.dataset.theme = id;
    root.dataset.appearance = appearance;
    Object.entries(t.tokens).forEach(
      ([k, v]) => root.style.setProperty(`--bo-theme-${k}`, v)
    );
  }

  // src/styles/base.css
  var base_default = '#bilioffice-root {\n  --bo-accent: var(--bo-theme-accent);\n  --bo-accent2: var(--bo-theme-accent2);\n  --bo-side: var(--bo-theme-side);\n  --bo-bubble: var(--bo-theme-bubble);\n  --bo-panel: var(--bo-theme-panel);\n  --bo-border: var(--bo-theme-border);\n  --bo-text: var(--bo-theme-text);\n  --bo-muted: var(--bo-theme-muted);\n  --bo-radius: 12px;\n  --bo-feishu-rail: #dce8f8;\n  color-scheme: light;\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: flex;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n  font:\n    14px/1.5 -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    "PingFang SC",\n    sans-serif;\n}\n#bilioffice-root[data-appearance="dark"] {\n  color-scheme: dark;\n  --bo-feishu-rail: #1b2230;\n  --bo-accent: color-mix(in srgb, var(--bo-theme-accent) 75%, white);\n  --bo-accent2: color-mix(in srgb, var(--bo-theme-accent) 22%, #1f2329);\n  --bo-panel: #1f2329;\n  --bo-side: #17191c;\n  --bo-bubble: #2a3139;\n  --bo-border: #3b424a;\n  --bo-text: #f2f3f5;\n  --bo-muted: #aeb4bc;\n}\n#bilioffice-root[data-appearance="system"] {\n  color-scheme: light dark;\n}\n@media (prefers-color-scheme: dark) {\n  #bilioffice-root[data-appearance="system"] {\n    color-scheme: dark;\n    --bo-feishu-rail: #1b2230;\n    --bo-accent: color-mix(in srgb, var(--bo-theme-accent) 75%, white);\n    --bo-accent2: color-mix(in srgb, var(--bo-theme-accent) 22%, #1f2329);\n    --bo-panel: #1f2329;\n    --bo-side: #17191c;\n    --bo-bubble: #2a3139;\n    --bo-border: #3b424a;\n    --bo-text: #f2f3f5;\n    --bo-muted: #aeb4bc;\n  }\n}\n#bilioffice-root * {\n  box-sizing: border-box;\n}\n#bilioffice-root button,\n#bilioffice-root input,\n#bilioffice-root select {\n  font: inherit;\n}\n#bilioffice-root button {\n  border: 0;\n  background: none;\n  color: inherit;\n  cursor: pointer;\n}\n#bilioffice-root .bo-sidebar {\n  width: 240px;\n  background: var(--bo-side);\n  border-right: 1px solid var(--bo-border);\n  display: flex;\n  flex-direction: column;\n  flex: none;\n}\n#bilioffice-root .bo-brand {\n  padding: 20px 18px 14px;\n  font-size: 18px;\n  font-weight: 700;\n  display: flex;\n  align-items: center;\n  gap: 9px;\n}\n#bilioffice-root .bo-brand small {\n  font-size: 11px;\n  color: var(--bo-muted);\n  font-weight: 500;\n}\n#bilioffice-root .bo-nav {\n  padding: 6px 10px;\n}\n#bilioffice-root .bo-nav button {\n  display: flex;\n  width: 100%;\n  align-items: center;\n  gap: 10px;\n  text-align: left;\n  padding: 10px 12px;\n  border-radius: 8px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-nav button.active,\n#bilioffice-root .bo-nav button:hover {\n  background: var(--bo-accent2);\n  color: var(--bo-accent);\n  font-weight: 600;\n}\n#bilioffice-root .bo-section-title {\n  padding: 18px 18px 7px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-conversation {\n  margin: 0 10px;\n  padding: 10px 8px;\n  display: flex;\n  gap: 9px;\n  align-items: center;\n  border-radius: 8px;\n  background: var(--bo-accent2);\n}\n#bilioffice-root .bo-avatar {\n  width: 34px;\n  height: 34px;\n  border-radius: 10px;\n  object-fit: cover;\n  background: var(--bo-accent2);\n  display: grid;\n  place-items: center;\n  flex: none;\n}\n#bilioffice-root .bo-conversation strong {\n  display: block;\n  font-size: 13px;\n}\n#bilioffice-root .bo-conversation span {\n  font-size: 11px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-sidebar-footer {\n  margin-top: auto;\n  padding: 12px;\n  border-top: 1px solid var(--bo-border);\n  display: flex;\n  gap: 6px;\n}\n#bilioffice-root .bo-sidebar-footer button {\n  flex: 1;\n  padding: 7px 4px;\n  border-radius: 7px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-sidebar-footer button:hover {\n  background: var(--bo-accent2);\n  color: var(--bo-accent);\n}\n#bilioffice-root .bo-main {\n  min-width: 0;\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  background: var(--bo-panel);\n}\n#bilioffice-root .bo-header {\n  height: 62px;\n  border-bottom: 1px solid var(--bo-border);\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  padding: 0 22px;\n  flex: none;\n}\n#bilioffice-root .bo-header h1 {\n  font-size: 16px;\n  margin: 0;\n}\n#bilioffice-root .bo-header .bo-search {\n  margin-left: auto;\n  max-width: 420px;\n  flex: 1;\n  position: relative;\n}\n#bilioffice-root .bo-search input {\n  width: 100%;\n  border: 1px solid var(--bo-border);\n  background: var(--bo-side);\n  border-radius: 8px;\n  padding: 9px 36px 9px 12px;\n  outline: none;\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-search input:focus {\n  border-color: var(--bo-accent);\n}\n#bilioffice-root .bo-search button {\n  position: absolute;\n  right: 5px;\n  top: 4px;\n  padding: 5px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-chat {\n  flex: 1;\n  overflow: auto;\n  padding: 24px max(22px, calc((100% - 900px) / 2));\n  background: color-mix(in srgb, var(--bo-panel) 92%, var(--bo-side));\n}\n#bilioffice-root .bo-day {\n  text-align: center;\n  color: var(--bo-muted);\n  font-size: 11px;\n  margin: 0 0 18px;\n}\n#bilioffice-root .bo-message {\n  display: flex;\n  gap: 10px;\n  margin: 0 0 24px;\n  align-items: flex-start;\n}\n#bilioffice-root .bo-message.self {\n  flex-direction: row-reverse;\n}\n#bilioffice-root .bo-message-content {\n  max-width: min(760px, calc(100% - 48px));\n  min-width: 0;\n}\n#bilioffice-root .bo-message-meta {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  color: var(--bo-muted);\n  font-size: 12px;\n  margin: 0 0 5px;\n}\n#bilioffice-root .bo-message-meta strong {\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-bubble {\n  background: var(--bo-bubble);\n  border: 1px solid color-mix(in srgb, var(--bo-border) 60%, transparent);\n  border-radius: 4px 12px 12px 12px;\n  padding: 12px;\n  box-shadow: 0 1px 2px #00000008;\n}\n#bilioffice-root .bo-bubble h3 {\n  margin: 0 0 7px;\n  font-size: 15px;\n}\n#bilioffice-root .bo-bubble p {\n  margin: 7px 0;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-video-card {\n  width: min(620px, 100%);\n  border-radius: 10px;\n  overflow: hidden;\n  background: var(--bo-panel);\n  border: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-cover {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  background: linear-gradient(135deg, var(--bo-accent2), var(--bo-side));\n  overflow: hidden;\n}\n#bilioffice-root .bo-cover img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}\n#bilioffice-root .bo-cover .bo-cover-placeholder {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-cover img[data-error="true"] {\n  display: none;\n}\n#bilioffice-root .bo-cover .bo-play {\n  position: absolute;\n  inset: auto auto 12px 12px;\n  background: var(--bo-accent);\n  color: #fff;\n  border-radius: 999px;\n  width: 38px;\n  height: 38px;\n  box-shadow: 0 2px 9px #0004;\n}\n#bilioffice-root .bo-card-info {\n  padding: 11px 13px;\n}\n#bilioffice-root .bo-card-info h3 {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#bilioffice-root .bo-stats {\n  display: flex;\n  gap: 12px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-player {\n  position: relative;\n  aspect-ratio: 16/9;\n  background: #111;\n  border-radius: 8px;\n  overflow: hidden;\n}\n#bilioffice-root .bo-player iframe {\n  width: 100%;\n  height: 100%;\n  border: 0;\n  display: block;\n}\n#bilioffice-root .bo-player-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 7px;\n  padding: 7px 0 0;\n}\n#bilioffice-root .bo-player-actions button {\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  padding: 5px 9px;\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-player-actions button:hover {\n  color: var(--bo-accent);\n  border-color: var(--bo-accent);\n}\n#bilioffice-root .bo-status {\n  padding: 20px;\n  text-align: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-status button {\n  margin-top: 9px;\n  background: var(--bo-accent);\n  color: #fff;\n  border-radius: 6px;\n  padding: 7px 12px;\n}\n#bilioffice-root .bo-comments {\n  margin-top: 18px;\n  border-top: 1px solid var(--bo-border);\n  padding-top: 12px;\n}\n#bilioffice-root .bo-comment {\n  padding: 9px 0;\n  border-bottom: 1px solid color-mix(in srgb, var(--bo-border) 65%, transparent);\n}\n#bilioffice-root .bo-comment .bo-comment-body {\n  margin-left: 43px;\n}\n#bilioffice-root .bo-comment p {\n  margin: 3px 0;\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-reply {\n  margin: 6px 0 0 14px;\n  padding-left: 10px;\n  border-left: 2px solid var(--bo-border);\n}\n#bilioffice-root .bo-toolbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 14px;\n  gap: 8px;\n}\n#bilioffice-root .bo-toolbar h2 {\n  font-size: 18px;\n  margin: 0;\n}\n#bilioffice-root .bo-toolbar select {\n  padding: 6px 9px;\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-pagination {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  margin: 18px 0;\n}\n#bilioffice-root .bo-pagination button {\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  padding: 6px 10px;\n}\n#bilioffice-root .bo-pagination button[disabled] {\n  opacity: 0.45;\n  cursor: default;\n}\n#bilioffice-root .bo-empty {\n  padding: 50px 0;\n  text-align: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-settings {\n  position: absolute;\n  right: 20px;\n  top: 58px;\n  background: var(--bo-panel);\n  border: 1px solid var(--bo-border);\n  box-shadow: 0 10px 30px #0002;\n  border-radius: 10px;\n  padding: 14px;\n  width: 270px;\n  z-index: 3;\n}\n#bilioffice-root .bo-settings h3 {\n  margin: 0 0 10px;\n}\n#bilioffice-root .bo-settings label {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 8px 0;\n  border-bottom: 1px solid var(--bo-border);\n  font-size: 13px;\n}\n#bilioffice-root .bo-settings select {\n  background: var(--bo-side);\n  color: var(--bo-text);\n  border: 1px solid var(--bo-border);\n  border-radius: 5px;\n  padding: 4px;\n}\n#bilioffice-root .bo-settings input {\n  accent-color: var(--bo-accent);\n}\n#bilioffice-root .bo-hidden-media .bo-cover,\n#bilioffice-root .bo-hidden-media .bo-player {\n  display: none;\n}\n#bilioffice-root .bo-lightbox {\n  position: fixed;\n  inset: 0;\n  background: #000b;\n  display: grid;\n  place-items: center;\n  z-index: 5;\n}\n#bilioffice-root .bo-lightbox img {\n  max-width: 90vw;\n  max-height: 90vh;\n}\n#bilioffice-root .bo-mobile-menu {\n  display: none;\n}\n@media (max-width: 800px) {\n  #bilioffice-root .bo-sidebar {\n    width: 190px;\n  }\n  #bilioffice-root .bo-chat {\n    padding: 18px 12px;\n  }\n  #bilioffice-root .bo-header {\n    padding: 0 12px;\n  }\n  #bilioffice-root .bo-header .bo-search {\n    max-width: none;\n  }\n  #bilioffice-root .bo-message-content {\n    max-width: calc(100% - 42px);\n  }\n}\n@media (max-width: 600px) {\n  #bilioffice-root .bo-sidebar {\n    position: absolute;\n    inset: 0 auto 0 0;\n    width: 240px;\n    z-index: 4;\n    transform: translateX(-100%);\n    transition: transform 0.2s;\n  }\n  #bilioffice-root .bo-sidebar.open {\n    transform: none;\n  }\n  #bilioffice-root .bo-mobile-menu {\n    display: block;\n    font-size: 19px;\n  }\n  #bilioffice-root .bo-header h1 {\n    font-size: 14px;\n  }\n  #bilioffice-root .bo-bubble {\n    padding: 9px;\n  }\n  #bilioffice-root .bo-chat {\n    padding: 14px 9px;\n  }\n}\n';

  // src/styles/layout.css
  var layout_default = 'html.bilioffice-active {\n  overflow: hidden;\n}\n\n#bilioffice-root [hidden] {\n  display: none;\n}\n#bilioffice-root button:focus-visible,\n#bilioffice-root a:focus-visible {\n  outline: 2px solid var(--bo-accent);\n  outline-offset: 3px;\n}\n#bilioffice-root .bo-search {\n  display: flex;\n  gap: 4px;\n  max-width: 500px;\n}\n#bilioffice-root .bo-search input {\n  padding-right: 8px;\n  min-width: 40px;\n}\n#bilioffice-root .bo-search button {\n  position: static;\n  flex: none;\n  white-space: nowrap;\n}\n#bilioffice-root .bo-video-card {\n  width: 560px;\n  max-width: 100%;\n}\n#bilioffice-root .bo-cover img {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  max-width: none;\n  max-height: none;\n  margin: 0;\n  object-fit: cover;\n}\n#bilioffice-root .bo-cover-placeholder {\n  pointer-events: none;\n}\n#bilioffice-root .bo-cover[data-loaded="true"] .bo-cover-placeholder {\n  display: none;\n}\n#bilioffice-root .bo-cover .bo-play {\n  width: auto;\n  padding: 8px 15px;\n  z-index: 1;\n}\n#bilioffice-root .bo-player-backdrop {\n  position: fixed;\n  inset: 0;\n  background: #000b;\n  z-index: 7;\n}\n#bilioffice-root .bo-player.bo-expanded {\n  position: fixed;\n  inset: 10vh 5vw 15vh;\n  width: 90vw;\n  height: 75vh;\n  aspect-ratio: auto;\n  z-index: 8;\n}\n#bilioffice-root .bo-inline-player:has(.bo-expanded) > .bo-player-actions {\n  position: fixed;\n  bottom: 6vh;\n  right: 5vw;\n  z-index: 9;\n  background: var(--bo-panel);\n  padding: 8px;\n  border-radius: 8px;\n}\n#bilioffice-root .bo-player-status {\n  font-size: 12px;\n  color: var(--bo-muted);\n  padding: 8px 2px;\n}\n#bilioffice-root .bo-settings p {\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-bubble {\n  min-width: 0;\n}\n#bilioffice-root .bo-comments {\n  margin: 20px 0 0 44px;\n  max-width: 720px;\n}\n#bilioffice-root .bo-toolbar {\n  flex-wrap: wrap;\n}\n#bilioffice-root .bo-status {\n  white-space: pre-wrap;\n}\n#bilioffice-root .bo-status button {\n  margin: 8px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-sidebar {\n  width: 210px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-avatar {\n  border-radius: 50%;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-bubble {\n  border-radius: 14px;\n  box-shadow: 0 3px 12px #1677ff10;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-chat {\n  padding-top: 16px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-message {\n  margin-bottom: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar {\n  width: 270px;\n  border-left: 56px solid var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-bubble {\n  background: var(--bo-panel);\n  border-radius: 6px;\n  box-shadow: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-avatar {\n  border-radius: 7px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-nav button {\n  padding: 7px 10px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-header {\n  height: 70px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message {\n  margin-bottom: 28px;\n}\n#bilioffice-root[data-appearance="dark"] .bo-nav button.active,\n#bilioffice-root[data-appearance="dark"] .bo-conversation {\n  background: #283850;\n}\n#bilioffice-root mark {\n  background: #ffe599;\n  color: #242424;\n}\n#bilioffice-root .bo-message-content {\n  width: min(680px, calc(100% - 48px));\n}\n#bilioffice-root .bo-inline-player {\n  width: 560px;\n  max-width: 100%;\n}\n@media (max-width: 600px) {\n  #bilioffice-root[data-theme] .bo-sidebar {\n    width: 240px;\n  }\n  #bilioffice-root .bo-header {\n    gap: 6px;\n  }\n  #bilioffice-root .bo-header h1 {\n    display: none;\n  }\n  #bilioffice-root .bo-player-actions {\n    flex-wrap: wrap;\n  }\n  #bilioffice-root .bo-settings {\n    right: 8px;\n    width: 270px;\n  }\n  #bilioffice-root .bo-comments {\n    margin-left: 0;\n  }\n}\n\n/* Feishu desktop shell: the reference uses one wide navigation rail, one\n   conversation column, and an uncluttered chat canvas. */\n#bilioffice-root[data-theme="feishu"] .bo-app-rail {\n  width: 180px;\n  align-items: stretch;\n  padding: 14px 10px 12px;\n  background: var(--bo-feishu-rail);\n  color: var(--bo-text);\n  border-right: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand {\n  width: auto;\n  height: 42px;\n  margin: 0 8px 10px;\n  padding: 0;\n  justify-content: flex-start;\n  gap: 10px;\n  border-radius: 10px;\n  background: transparent;\n  color: var(--bo-text);\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-brand-icon {\n  width: 30px;\n  height: 30px;\n  display: grid;\n  place-items: center;\n  border-radius: 50%;\n  background: #f4b83f;\n  font-size: 15px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand::after {\n  content: "\u98DE\u4E66\u5DE5\u4F5C\u53F0";\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-search {\n  order: 0;\n  display: flex;\n  width: 100%;\n  max-width: none;\n  margin: 0 0 10px;\n  padding: 0;\n  background: transparent;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-search input {\n  min-width: 0;\n  width: 100%;\n  height: 34px;\n  padding: 7px 10px 7px 30px;\n  border: 1px solid var(--bo-border);\n  border-radius: 8px;\n  background: var(--bo-side);\n  color: var(--bo-text);\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-search::before {\n  content: "\u2315";\n  position: absolute;\n  z-index: 1;\n  margin: 7px 0 0 10px;\n  color: var(--bo-muted);\n  font-size: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-search button {\n  display: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav {\n  align-items: stretch;\n  gap: 2px;\n  padding: 0;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav button {\n  width: 100%;\n  height: 38px;\n  padding: 0 10px;\n  border-radius: 8px;\n  color: var(--bo-muted);\n  font-size: 18px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav button.active {\n  color: var(--bo-accent);\n  background: var(--bo-panel);\n  box-shadow: 0 1px 2px #1f23290d;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-label,\n#bilioffice-root[data-theme="feishu"] .bo-rail-static {\n  display: block;\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static {\n  min-height: 38px;\n  padding: 8px 10px 8px 42px;\n  border-radius: 8px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:hover {\n  background: var(--bo-side);\n  color: var(--bo-text);\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static::before {\n  position: absolute;\n  margin-left: -25px;\n  color: var(--bo-muted);\n  font-size: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(2)::before {\n  content: "\u25A1";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(3)::before {\n  content: "\u2022";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(4)::before {\n  content: "\u25A4";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(5)::before {\n  content: "\u25A3";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(6)::before {\n  content: "\u2713";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(7)::before {\n  content: "\u2659";\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:nth-of-type(8)::before {\n  content: "\u2317";\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar {\n  width: 300px;\n  display: block;\n  background: var(--bo-side);\n  border-right: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-group-nav {\n  display: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-head {\n  height: 44px;\n  padding: 0 14px;\n  gap: 4px;\n  border-bottom: 0;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-head strong,\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-head > span {\n  height: 28px;\n  display: inline-flex;\n  align-items: center;\n  padding: 0 11px;\n  border-radius: 14px;\n  font-size: 13px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-head strong {\n  background: var(--bo-panel);\n  color: var(--bo-text);\n  box-shadow: 0 1px 3px #1f23291a;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-head > span {\n  color: var(--bo-muted);\n  background: var(--bo-side);\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar-search {\n  display: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-conversation {\n  margin: 0;\n  padding: 9px 12px;\n  border-left: 0;\n  border-radius: 0;\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-local-conversations {\n  padding: 8px 0 0;\n  border-top: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-local-label {\n  padding: 5px 14px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-local-row {\n  padding: 8px 12px;\n  border-radius: 0;\n}\n#bilioffice-root[data-theme="feishu"] .bo-local-row:hover {\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-main {\n  background: var(--bo-panel);\n}\n#bilioffice-root[data-theme="feishu"] .bo-header {\n  height: 56px;\n  padding: 0 20px;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-header h1 {\n  font-size: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-chat {\n  padding: 20px 28px 28px;\n  background: var(--bo-panel);\n}\n#bilioffice-root[data-theme="feishu"] .bo-toolbar {\n  margin-bottom: 20px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message {\n  margin-bottom: 22px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message-content {\n  width: min(520px, calc(100% - 48px));\n}\n#bilioffice-root[data-theme="feishu"] .bo-bubble {\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: var(--bo-bubble);\n  box-shadow: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-video-card {\n  width: min(440px, 100%);\n  border-radius: 8px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-info-panel {\n  display: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-composer {\n  padding: 10px 28px 12px;\n  background: var(--bo-panel);\n}\n\n@media (prefers-color-scheme: dark) {\n  #bilioffice-root[data-appearance="system"] .bo-nav button.active,\n  #bilioffice-root[data-appearance="system"] .bo-conversation {\n    background: #283850;\n  }\n}\n\n/* Desktop client shell: app rail, conversation list, chat workspace. */\n#bilioffice-root .bo-app-rail {\n  width: 64px;\n  background: color-mix(in srgb, var(--bo-accent) 86%, #1b2733);\n  color: #fff;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  flex: none;\n  z-index: 5;\n}\n#bilioffice-root .bo-rail-brand {\n  width: 40px;\n  height: 40px;\n  margin: 14px 0 18px;\n  display: grid;\n  place-items: center;\n  border-radius: 12px;\n  background: #ffffff2b;\n  font-size: 20px;\n}\n#bilioffice-root .bo-rail-nav,\n#bilioffice-root .bo-rail-footer {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n}\n#bilioffice-root .bo-rail-nav button,\n#bilioffice-root .bo-rail-button {\n  width: 42px;\n  height: 42px;\n  border-radius: 10px;\n  color: #ffffffb8;\n  font-size: 20px;\n  display: grid;\n  place-items: center;\n}\n#bilioffice-root .bo-rail-nav button {\n  display: flex;\n  align-items: center;\n  justify-content: flex-start;\n  gap: 12px;\n  text-align: left;\n  padding: 0 14px;\n}\n#bilioffice-root .bo-rail-label,\n#bilioffice-root .bo-rail-static {\n  display: none;\n  font-size: 14px;\n  white-space: nowrap;\n}\n#bilioffice-root .bo-rail-static {\n  width: 100%;\n  min-height: 33px;\n  padding: 7px 18px;\n  color: color-mix(in srgb, var(--bo-text) 75%, var(--bo-muted));\n}\n#bilioffice-root .bo-rail-nav button:hover,\n#bilioffice-root .bo-rail-nav button.active,\n#bilioffice-root .bo-rail-button:hover {\n  color: #fff;\n  background: #ffffff2b;\n}\n#bilioffice-root .bo-rail-footer {\n  margin-top: auto;\n  margin-bottom: 14px;\n}\n#bilioffice-root .bo-sidebar {\n  width: 252px;\n  background: var(--bo-side);\n  border-right: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-conversation-pane {\n  min-width: 0;\n  flex: 1;\n}\n#bilioffice-root .bo-group-nav {\n  display: none;\n}\n#bilioffice-root .bo-sidebar-head {\n  height: 62px;\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-sidebar-head strong {\n  font-size: 16px;\n}\n#bilioffice-root .bo-sidebar-head > span {\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-sidebar-head .bo-mobile-menu {\n  display: none;\n  margin-left: auto;\n}\n#bilioffice-root .bo-sidebar-search {\n  margin: 12px 12px 8px;\n  padding: 8px 10px;\n  border-radius: 7px;\n  color: var(--bo-muted);\n  background: color-mix(in srgb, var(--bo-panel) 68%, var(--bo-side));\n  font-size: 12px;\n}\n#bilioffice-root .bo-conversation {\n  position: relative;\n  margin: 0;\n  padding: 12px 14px;\n  border-radius: 0;\n  border-left: 3px solid transparent;\n  background: transparent;\n}\n#bilioffice-root .bo-conversation-active {\n  border-left-color: var(--bo-accent);\n  background: var(--bo-accent2);\n}\n#bilioffice-root .bo-conversation time {\n  margin-left: auto;\n  align-self: flex-start;\n  color: var(--bo-muted);\n  font-size: 10px;\n}\n#bilioffice-root .bo-local-conversations {\n  padding: 18px 14px;\n  border-top: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-local-label {\n  color: var(--bo-muted);\n  font-size: 11px;\n  margin-bottom: 8px;\n}\n#bilioffice-root .bo-local-row {\n  padding: 8px 9px;\n  color: var(--bo-muted);\n  border-radius: 6px;\n  font-size: 12px;\n}\n#bilioffice-root .bo-local-row:hover {\n  color: var(--bo-text);\n  background: var(--bo-accent2);\n}\n#bilioffice-root .bo-header {\n  height: 62px;\n  padding: 0 18px;\n  gap: 12px;\n  background: var(--bo-panel);\n}\n#bilioffice-root .bo-header h1 {\n  font-size: 16px;\n  font-weight: 600;\n  white-space: nowrap;\n}\n#bilioffice-root .bo-header-spacer {\n  flex: 1;\n}\n#bilioffice-root .bo-header-menu {\n  color: var(--bo-muted);\n  font-size: 20px;\n}\n#bilioffice-root .bo-chat {\n  padding: 24px max(28px, calc((100% - 860px) / 2));\n  padding-bottom: 30px;\n}\n#bilioffice-root .bo-composer {\n  margin: 0;\n  padding: 11px max(28px, calc((100% - 860px) / 2)) 14px;\n  display: flex;\n  gap: 8px;\n  border-top: 1px solid var(--bo-border);\n  background: var(--bo-panel);\n}\n#bilioffice-root .bo-composer input {\n  min-width: 0;\n  flex: 1;\n  border: 1px solid var(--bo-border);\n  border-radius: 8px;\n  background: var(--bo-side);\n  color: var(--bo-text);\n  padding: 9px 11px;\n  outline: none;\n}\n#bilioffice-root .bo-composer input:focus {\n  border-color: var(--bo-accent);\n}\n#bilioffice-root .bo-composer-send {\n  padding: 0 15px;\n  border-radius: 8px;\n  color: #fff;\n  background: var(--bo-accent);\n}\n#bilioffice-root .bo-composer-send:hover {\n  filter: brightness(0.94);\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-app-rail {\n  background: #1d4f91;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-sidebar {\n  width: 238px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-bubble {\n  border-radius: 3px 13px 13px 13px;\n  box-shadow: 0 2px 8px #1677ff12;\n}\n#bilioffice-root[data-theme="feishu"] .bo-app-rail {\n  background: #202b3c;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar {\n  width: clamp(420px, 34vw, 680px);\n  border-left: 0;\n  display: flex;\n  flex-direction: row;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-label,\n#bilioffice-root[data-theme="feishu"] .bo-rail-static,\n#bilioffice-root[data-theme="wecom"] .bo-rail-label,\n#bilioffice-root[data-theme="wecom"] .bo-rail-static {\n  display: block;\n}\n#bilioffice-root[data-theme="feishu"] .bo-app-rail,\n#bilioffice-root[data-theme="wecom"] .bo-app-rail {\n  width: clamp(210px, 13.5vw, 276px);\n  align-items: stretch;\n  background: color-mix(in srgb, var(--bo-side) 92%, var(--bo-accent2));\n  color: var(--bo-text);\n  border-right: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand,\n#bilioffice-root[data-theme="wecom"] .bo-rail-brand {\n  width: auto;\n  height: 48px;\n  margin: 12px 16px 10px;\n  padding: 0 8px;\n  display: flex;\n  justify-content: flex-start;\n  gap: 12px;\n  background: transparent;\n  color: var(--bo-text);\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-brand::after {\n  content: "\u6211\u7684\u4F01\u4E1A";\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand::after {\n  content: "\u98DE\u4E66\u5DE5\u4F5C\u53F0";\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav,\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav {\n  align-items: stretch;\n  gap: 2px;\n  padding: 0 12px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav button,\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav button {\n  width: 100%;\n  height: 39px;\n  color: var(--bo-muted);\n  font-size: 19px;\n  border-radius: 7px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-nav button.active,\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav button.active {\n  color: var(--bo-accent);\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static,\n#bilioffice-root[data-theme="wecom"] .bo-rail-static {\n  border-radius: 7px;\n  margin: 1px 0;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-static:hover,\n#bilioffice-root[data-theme="wecom"] .bo-rail-static:hover {\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-group-nav {\n  display: block;\n  width: 240px;\n  flex: none;\n  padding: 16px 10px;\n  background: color-mix(in srgb, var(--bo-side) 88%, var(--bo-panel));\n  border-right: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="feishu"] .bo-group-row {\n  padding: 11px 13px;\n  margin: 2px 0;\n  border-radius: 7px;\n  color: var(--bo-muted);\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-group-row.active {\n  color: var(--bo-accent);\n  background: var(--bo-accent2);\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="feishu"] .bo-conversation-pane {\n  overflow: hidden;\n}\n#bilioffice-root[data-theme="wecom"] .bo-sidebar {\n  width: clamp(320px, 24vw, 480px);\n}\n#bilioffice-root[data-theme="wecom"] .bo-sidebar-search {\n  margin-top: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-group-nav {\n  display: none;\n}\n#bilioffice-root[data-theme="wecom"] .bo-local-row,\n#bilioffice-root[data-theme="feishu"] .bo-local-row {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  padding: 11px 12px;\n  font-size: 13px;\n}\n#bilioffice-root .bo-local-row time {\n  margin-left: auto;\n  color: var(--bo-muted);\n  font-size: 10px;\n}\n#bilioffice-root .bo-local-avatar {\n  width: 28px;\n  height: 28px;\n  border-radius: 7px;\n  display: grid;\n  place-items: center;\n  flex: none;\n  color: var(--bo-accent);\n  background: var(--bo-accent2);\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-header {\n  height: 68px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-bubble {\n  border-radius: 8px;\n  background: var(--bo-panel);\n  box-shadow: 0 1px 4px #1f23290d;\n}\n#bilioffice-root[data-theme="feishu"] .bo-composer input {\n  border-radius: 6px;\n}\n#bilioffice-root .bo-info-panel {\n  width: clamp(210px, 13vw, 270px);\n  flex: none;\n  background: var(--bo-panel);\n  border-left: 1px solid var(--bo-border);\n  overflow: auto;\n}\n#bilioffice-root .bo-info-head {\n  height: 62px;\n  display: flex;\n  align-items: center;\n  padding: 0 18px;\n  border-bottom: 1px solid var(--bo-border);\n  font-weight: 600;\n}\n#bilioffice-root .bo-info-section {\n  padding: 15px 18px;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-info-title {\n  color: var(--bo-muted);\n  font-size: 12px;\n  margin-bottom: 9px;\n}\n#bilioffice-root .bo-info-value {\n  color: var(--bo-text);\n  font-size: 13px;\n  line-height: 1.7;\n}\n@media (max-width: 800px) {\n  #bilioffice-root .bo-app-rail {\n    width: 56px;\n  }\n  #bilioffice-root .bo-sidebar {\n    width: 220px;\n  }\n  #bilioffice-root .bo-info-panel {\n    display: none;\n  }\n}\n@media (max-width: 600px) {\n  #bilioffice-root .bo-app-rail {\n    width: 52px;\n  }\n  #bilioffice-root .bo-sidebar {\n    position: absolute;\n    left: 52px;\n    top: 0;\n    bottom: 0;\n    width: 238px;\n    transform: translateX(-110%);\n    box-shadow: 8px 0 24px #0002;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-sidebar {\n    width: 300px;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-group-nav {\n    display: none;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-app-rail,\n  #bilioffice-root[data-theme="feishu"] .bo-app-rail {\n    width: 52px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-label,\n  #bilioffice-root[data-theme="wecom"] .bo-rail-static,\n  #bilioffice-root[data-theme="feishu"] .bo-rail-label,\n  #bilioffice-root[data-theme="feishu"] .bo-rail-static {\n    display: none;\n  }\n  #bilioffice-root .bo-sidebar.open {\n    transform: none;\n  }\n  #bilioffice-root .bo-sidebar-head .bo-mobile-menu {\n    display: grid;\n  }\n  #bilioffice-root .bo-mobile-menu {\n    display: block;\n  }\n  #bilioffice-root .bo-header {\n    padding: 0 10px;\n  }\n  #bilioffice-root .bo-composer {\n    padding: 8px 10px 10px;\n  }\n  #bilioffice-root .bo-sidebar {\n    left: 0;\n  }\n}\n\n@media (min-width: 601px) {\n  #bilioffice-root[data-theme="feishu"] .bo-app-rail {\n    width: 180px;\n    align-items: stretch;\n    background: var(--bo-feishu-rail);\n    color: var(--bo-text);\n    border-right: 1px solid var(--bo-border);\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-rail-brand,\n  #bilioffice-root[data-theme="feishu"] .bo-rail-brand::after {\n    white-space: nowrap;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-sidebar {\n    width: 300px;\n    display: block;\n    flex-direction: column;\n    background: var(--bo-side);\n    border-right: 1px solid var(--bo-border);\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-group-nav {\n    display: none !important;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-info-panel {\n    display: none;\n  }\n}\n\n#bilioffice-root[data-theme="feishu"] .bo-conversation-copy,\n#bilioffice-root[data-theme="feishu"] .bo-local-copy {\n  min-width: 0;\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  overflow: hidden;\n}\n#bilioffice-root[data-theme="feishu"] .bo-conversation-copy strong,\n#bilioffice-root[data-theme="feishu"] .bo-local-copy strong,\n#bilioffice-root[data-theme="feishu"] .bo-local-copy span {\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n#bilioffice-root[data-theme="feishu"] .bo-conversation-copy strong,\n#bilioffice-root[data-theme="feishu"] .bo-local-copy strong {\n  color: var(--bo-text);\n  font-size: 13px;\n  font-weight: 500;\n}\n#bilioffice-root[data-theme="feishu"] .bo-conversation-copy span,\n#bilioffice-root[data-theme="feishu"] .bo-local-copy span {\n  color: var(--bo-muted);\n  font-size: 11px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-header-meta {\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-icon-action {\n  width: 30px;\n  height: 30px;\n  padding: 0;\n  color: var(--bo-muted);\n  border-radius: 6px;\n  font-size: 18px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-icon-action:hover {\n  color: var(--bo-accent);\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-message-meta {\n  margin-bottom: 4px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message-meta strong {\n  font-weight: 500;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message-content {\n  width: min(410px, calc(100% - 48px));\n}\n#bilioffice-root[data-theme="feishu"] .bo-video-card {\n  width: 320px;\n  max-width: 100%;\n}\n#bilioffice-root[data-theme="feishu"] .bo-card-info {\n  padding: 9px 11px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-card-info h3 {\n  font-size: 14px;\n}\n#bilioffice-root .bo-auto-loading {\n  padding: 12px;\n  color: var(--bo-muted);\n  font-size: 12px;\n  text-align: center;\n}\n\n/* Keep settings above every shell column, even in short browser windows. */\n#bilioffice-root .bo-settings {\n  position: fixed;\n  top: 64px;\n  right: 16px;\n  width: min(300px, calc(100vw - 24px));\n  max-height: calc(100dvh - 80px);\n  overflow-y: auto;\n  z-index: 20;\n  pointer-events: auto;\n}\n#bilioffice-root .bo-setting-group {\n  padding: 12px 0;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-setting-title {\n  margin-bottom: 8px;\n  font-size: 13px;\n}\n#bilioffice-root .bo-setting-options {\n  display: flex;\n  gap: 6px;\n}\n#bilioffice-root .bo-setting-option {\n  flex: 1;\n  min-height: 36px;\n  padding: 6px;\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  font-size: 12px;\n}\n#bilioffice-root .bo-setting-option[aria-pressed="true"] {\n  border-color: var(--bo-accent);\n  background: color-mix(in srgb, var(--bo-accent) 12%, var(--bo-panel));\n  color: var(--bo-accent);\n}\n#bilioffice-root .bo-rail-nav {\n  min-height: 0;\n  overflow-y: auto;\n}\n#bilioffice-root .bo-rail-nav > * {\n  flex-shrink: 0;\n}\n#bilioffice-root .bo-rail-brand,\n#bilioffice-root .bo-rail-search,\n#bilioffice-root .bo-rail-footer {\n  flex-shrink: 0;\n}\n\n#bilioffice-root .bo-local-message .bo-bubble {\n  width: fit-content;\n  max-width: 100%;\n  font-size: 13px;\n  line-height: 1.7;\n}\n';

  // src/styles/modal.css
  var modal_default = "#bilioffice-root .bo-image-dialog {\n  border: 1px solid var(--bo-border);\n  border-radius: 12px;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n  max-width: 95vw;\n  max-height: 95vh;\n  padding: 12px;\n}\n#bilioffice-root .bo-image-dialog::backdrop {\n  background: #000b;\n}\n#bilioffice-root .bo-image-dialog img {\n  display: block;\n  max-width: 85vw;\n  max-height: 80vh;\n  object-fit: contain;\n}\n#bilioffice-root .bo-image-dialog button {\n  display: block;\n  padding: 8px;\n  margin: auto;\n}\n";

  // src/adapters/bilibili.ts
  var initialPath = location.pathname;
  var initialURL = new URL(location.href);
  var nativeHome = false;
  var orders = ["totalrank", "click", "pubdate", "dm", "stow"];
  function routeFromLocation() {
    const u = new URL(location.href), m = u.pathname.match(/^\/video\/(BV[a-zA-Z0-9]+)\/?$/);
    if (m)
      return {
        kind: "video",
        videoId: m[1],
        part: Math.max(1, Number(u.searchParams.get("p")) || 1)
      };
    if (u.hostname === "search.bilibili.com" || u.pathname === "/search")
      return {
        kind: "search",
        query: u.searchParams.get("keyword") || "",
        page: Math.max(1, Number(u.searchParams.get("page")) || 1),
        order: orders.includes(u.searchParams.get("order") || "") ? u.searchParams.get("order") : "totalrank"
      };
    if (u.pathname.includes("/popular"))
      return {
        kind: "popular",
        page: Math.max(1, Number(u.searchParams.get("pn")) || 1)
      };
    if (u.pathname.startsWith("/c/") || u.pathname.startsWith("/v/") || u.pathname.startsWith("/channel/"))
      return { kind: "section", path: u.pathname };
    return { kind: "home" };
  }
  var safeURL = (value, base = location.href) => {
    if (!value.trim()) return "";
    try {
      const u = new URL(value, base);
      return u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  };
  function imageURL(value) {
    if (!value.trim()) return "";
    try {
      const url = new URL(value, location.href);
      if (url.protocol === "http:" && (url.hostname === "hdslb.com" || url.hostname.endsWith(".hdslb.com")))
        url.protocol = "https:";
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }
  function nativeCover(card) {
    const img = card.querySelector("picture img, img");
    const candidates = [
      img?.currentSrc,
      img?.getAttribute("data-src"),
      img?.getAttribute("src")
    ];
    for (const source of card.querySelectorAll(
      "picture source, picture img, img[srcset], img[data-srcset]"
    )) {
      for (const attribute of ["srcset", "data-srcset"]) {
        const set = source.getAttribute(attribute) || "";
        candidates.push(
          ...set.split(",").map((entry) => entry.trim().split(/\s+/)[0])
        );
      }
    }
    return candidates.map((value) => imageURL(value || "")).find(Boolean) || "";
  }
  function originalVideo(id, part = 1) {
    return `https://www.bilibili.com/video/${encodeURIComponent(id)}/?p=${part}`;
  }
  function openOriginal(url) {
    const u = safeURL(url);
    if (u) window.open(u, "_blank", "noopener,noreferrer");
  }
  function plain(value) {
    const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
    return doc.body.textContent || "";
  }
  function nativeVideos() {
    const seen = /* @__PURE__ */ new Set(), out = [];
    document.querySelectorAll('a[href*="/video/"]').forEach((a) => {
      if (a.closest("#bilioffice-root")) return;
      const id = a.href.match(/\/video\/(BV[\w]+)/)?.[1];
      if (!id || seen.has(id)) return;
      const card = a.closest(".bili-video-card,.feed-card,.video-item,.video-list-item") || a;
      const img = card.querySelector("img");
      const title = (card.querySelector("[title]")?.getAttribute("title") || a.title || img?.alt || a.textContent || "").trim();
      if (!title) return;
      seen.add(id);
      out.push({
        id,
        title,
        url: originalVideo(id),
        cover: nativeCover(card),
        author: {
          name: card.querySelector(
            ".bili-video-card__info--author,.up-name,.bili-video-card__info--owner"
          )?.textContent?.trim() || "B\u7AD9\u89C6\u9891",
          avatar: ""
        },
        duration: card.querySelector(".bili-video-card__stats__duration,.length")?.textContent?.trim(),
        views: card.querySelector(".bili-video-card__stats--item")?.textContent?.trim()
      });
    });
    return out;
  }
  function api(path, signal) {
    const url = `https://api.bilibili.com${path}`;
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      let done = false;
      let cancel = () => {
      };
      const finish = (err, data) => {
        if (done) return;
        done = true;
        signal.removeEventListener("abort", abort);
        err ? reject(err) : resolve(data);
      };
      const abort = () => {
        cancel();
        finish(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", abort, { once: true });
      const parse = (text) => {
        try {
          const j = JSON.parse(text);
          if (j.code !== 0)
            throw Error(`B\u7AD9\u63A5\u53E3 ${j.code}\uFF1A${j.message || "\u8BF7\u6C42\u88AB\u9650\u5236"}`);
          finish(void 0, j.data);
        } catch (e) {
          finish(e);
        }
      };
      if (typeof GM_xmlhttpRequest === "function") {
        const req = GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: 18e3,
          onload: (r) => r.status === 200 ? parse(r.responseText) : finish(Error(`HTTP ${r.status}`)),
          onerror: () => finish(Error("\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25")),
          ontimeout: () => finish(Error("\u8BF7\u6C42\u8D85\u65F6"))
        });
        cancel = () => req.abort();
      } else {
        const c = new AbortController();
        cancel = () => c.abort();
        fetch(url, { credentials: "include", signal: c.signal }).then((r) => {
          if (!r.ok) throw Error(`HTTP ${r.status}`);
          return r.text();
        }).then(parse, (e) => finish(e));
      }
    });
  }
  function item(v) {
    return {
      id: v.bvid,
      title: plain(v.title),
      url: originalVideo(v.bvid),
      cover: imageURL(v.pic || ""),
      author: {
        name: plain(v.owner?.name || v.author || "B\u7AD9\u7528\u6237"),
        avatar: imageURL(v.owner?.face || "")
      },
      duration: typeof v.duration === "string" ? v.duration : `${Math.floor((v.duration || 0) / 60)}:${String((v.duration || 0) % 60).padStart(2, "0")}`,
      views: String(v.stat?.view ?? v.play ?? ""),
      published: v.pubdate ? new Date(v.pubdate * 1e3).toLocaleDateString("zh-CN") : ""
    };
  }
  async function fetchVideos(route, signal) {
    if (route.kind === "search") {
      if (!route.query) return { items: [], pages: 0, total: 0 };
      const p = new URLSearchParams({
        search_type: "video",
        keyword: route.query,
        page: String(route.page || 1),
        order: route.order || "totalrank"
      });
      if (initialURL.hostname === "search.bilibili.com" && initialURL.searchParams.get("keyword") === route.query && Number(initialURL.searchParams.get("page") || 1) === (route.page || 1) && (initialURL.searchParams.get("order") || "totalrank") === (route.order || "totalrank")) {
        const cards = await waitNative(signal);
        if (cards.length) {
          const buttons = [
            ...document.querySelectorAll(
              "[class*=pagination] button,[class*=pagenation] button,[class*=pagination] .page-item"
            )
          ];
          const pages = Math.max(
            route.page || 1,
            ...buttons.map((b) => Number(b.textContent?.trim())).filter(Number.isFinite)
          );
          return { items: cards, total: cards.length, pages };
        }
      }
      const data2 = await api(`/x/web-interface/search/type?${p}`, signal);
      return {
        items: (data2.result || []).filter((v) => v.bvid).map(item),
        pages: data2.numPages || 1,
        total: data2.numResults || 0
      };
    }
    const native = route.kind === "home" && initialPath === "/" && (route.page || 1) === 1 || route.kind === "section" && initialPath === route.path ? await waitNative(signal) : [];
    if (route.kind === "home" && (route.page || 1) === 1)
      nativeHome = native.length > 0;
    if ((route.kind === "home" || route.kind === "section") && native.length)
      return {
        items: native,
        total: native.length,
        pages: route.kind === "home" ? 2 : 1
      };
    if (route.kind === "section")
      throw Error("\u5F53\u524D\u5206\u533A\u672A\u91C7\u96C6\u5230\u539F\u7AD9\u5217\u8868\uFF0C\u8BF7\u4F7F\u7528\u539F\u7248\u52A0\u8F7D\u540E\u91CD\u8BD5\u3002");
    const popularPage = route.kind === "home" && nativeHome ? Math.max(1, (route.page || 1) - 1) : route.page || 1;
    const data = await api(
      `/x/web-interface/popular?ps=20&pn=${popularPage}`,
      signal
    );
    return {
      items: (data.list || []).map(item),
      total: 0,
      pages: data.no_more ? route.page || 1 : (route.page || 1) + 1
    };
  }
  async function getVideo(id, part, signal) {
    const data = await api(
      `/x/web-interface/view?bvid=${encodeURIComponent(id)}`,
      signal
    );
    return { ...item(data), part, url: originalVideo(id, part) };
  }
  async function waitNative(signal) {
    const existing = nativeVideos();
    if (existing.length) return existing;
    const root = document.querySelector("#app,#i_cecream,main");
    if (!root) return [];
    return new Promise((resolve, reject) => {
      let debounce;
      const cleanup = () => {
        observer.disconnect();
        clearTimeout(timer);
        clearTimeout(debounce);
        signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };
      const read = () => {
        const items = nativeVideos();
        if (items.length) {
          cleanup();
          resolve(items);
        }
      };
      const observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(read, 200);
      });
      const timer = setTimeout(() => {
        cleanup();
        resolve(nativeVideos());
      }, 4e3);
      observer.observe(root, { childList: true, subtree: true });
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  }

  // src/adapters/bilibili/comments.ts
  function deepAll(selector, root) {
    const out = [...root.querySelectorAll(selector)];
    for (const el2 of root.querySelectorAll("*"))
      if (el2.shadowRoot) out.push(...deepAll(selector, el2.shadowRoot));
    return out;
  }
  function commentHost() {
    return document.querySelector("bili-comments,.reply-list");
  }
  function readComments() {
    const host = commentHost();
    if (!host) return [];
    const read = (el2) => {
      const root = el2.shadowRoot || el2;
      const find = (s) => deepAll(s, root)[0];
      const body = find("#contents,.reply-content,.sub-reply-content");
      const name = find("#user-name,.user-name,.sub-user-name");
      const text = body?.textContent?.trim() || "";
      const images = [
        ...deepAll(".reply-content img,.sub-reply-content img", root),
        ...deepAll("bili-comment-pictures-renderer", root).flatMap(
          (p) => deepAll("img", p.shadowRoot || p)
        )
      ].map((i) => safeURL(i.src)).filter(Boolean);
      if (!name || !text && !images.length) return null;
      return {
        id: el2.getAttribute("rpid") || el2.getAttribute("data-id") || `${name.textContent}:${text}`,
        author: { name: name.textContent?.trim() || "", avatar: "" },
        text,
        time: find("#pubdate,.reply-time,.sub-reply-time")?.textContent || "",
        likes: Number(find("#like .count,.like-count")?.textContent) || 0,
        images,
        replies: []
      };
    };
    const roots = deepAll(
      "bili-comment-renderer,.reply-item",
      host.shadowRoot || host
    );
    return roots.map((el2) => {
      const c = read(el2);
      if (!c) return null;
      const thread = el2.closest("bili-comment-thread-renderer,.reply-item") || el2.getRootNode().host || el2;
      const root = thread.shadowRoot || thread;
      c.replies = deepAll("bili-comment-reply-renderer,.sub-reply-item", root).map(read).filter(Boolean);
      return c;
    }).filter(Boolean);
  }
  async function loadMore(signal) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const host = commentHost();
    if (!host) throw Error("\u539F\u7AD9\u8BC4\u8BBA\u5C1A\u672A\u52A0\u8F7D\uFF0C\u8BF7\u6253\u5F00\u539F\u7248\u89C6\u9891\u9875\u3002");
    const before = JSON.stringify(readComments());
    const button = deepAll(
      "button,.view-more,.reply-more",
      host.shadowRoot || host
    ).find((b) => /更多|下一页|展开/.test(b.textContent || ""));
    if (!button) throw Error("\u672A\u627E\u5230\u539F\u7AD9\u52A0\u8F7D\u66F4\u591A\u63A7\u4EF6\uFF0C\u53EF\u5728\u539F\u7248\u52A0\u8F7D\u8BC4\u8BBA\u540E\u91CD\u8BD5\u3002");
    button.click();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearInterval(timer);
        signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };
      let n = 0;
      const timer = setInterval(() => {
        if (signal.aborted) {
          abort();
          return;
        }
        const list = readComments();
        if (JSON.stringify(list) !== before) {
          cleanup();
          resolve(list);
        } else if (++n >= 40) {
          cleanup();
          reject(Error("\u7B49\u5F85\u8BC4\u8BBA\u53D8\u5316\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002"));
        }
      }, 250);
      signal.addEventListener("abort", abort, { once: true });
    });
  }
  function exportComments(comments) {
    const lines = [
      "bilioffice \u8BC4\u8BBA\u5BFC\u51FA\uFF1A\u4EC5\u5F53\u524D\u5DF2\u52A0\u8F7D\u5185\u5BB9\uFF0C\u975E\u5168\u91CF\u8BC4\u8BBA",
      location.href,
      ""
    ];
    const emit = (c, indent = "") => {
      lines.push(
        `${indent}${c.author.name} ${c.time}\uFF1A${c.text}`,
        ...c.images.map((i) => `${indent}[\u56FE\u7247] ${i}`)
      );
      c.replies.forEach((r) => emit(r, indent + "  "));
    };
    comments.forEach((c) => emit(c));
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bilioffice-loaded-comments.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }

  // src/components/lightbox.ts
  var Lightbox = class {
    constructor() {
      __publicField(this, "dialog", null);
      __publicField(this, "abort", null);
    }
    open(src) {
      this.close();
      const d = document.createElement("dialog");
      d.className = "bo-image-dialog";
      d.setAttribute("aria-label", "\u8BC4\u8BBA\u56FE\u7247\u9884\u89C8");
      const img = document.createElement("img");
      img.src = src;
      img.alt = "\u8BC4\u8BBA\u56FE\u7247";
      const close = document.createElement("button");
      close.textContent = "\u5173\u95ED\u56FE\u7247";
      close.type = "button";
      close.onclick = () => this.close();
      d.append(img, close);
      document.getElementById("bilioffice-root")?.append(d);
      this.dialog = d;
      this.abort = new AbortController();
      d.addEventListener(
        "cancel",
        (e) => {
          e.preventDefault();
          this.close();
        },
        { signal: this.abort.signal }
      );
      d.addEventListener(
        "click",
        (e) => {
          if (e.target === d) this.close();
        },
        { signal: this.abort.signal }
      );
      d.showModal();
      close.focus();
    }
    close() {
      this.abort?.abort();
      this.abort = null;
      this.dialog?.close();
      this.dialog?.remove();
      this.dialog = null;
    }
  };

  // src/components/wecom.ts
  var paths = {
    chat: "M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z",
    bot: "M8 5h8l4 4v10H4V9l4-4Zm4 0V2M8 12h.01M16 12h.01M8 16h8",
    hash: "M9 3 7 21M17 3l-2 18M3 8h18M2 16h18",
    mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
    doc: "M5 2h10l4 4v16H5V2Zm10 0v5h4M8 12h8M8 16h8",
    calendar: "M4 5h16v16H4V5Zm3-3v6M17 2v6M4 10h16M8 14h2M14 14h2M8 18h2",
    check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM7 12l3 3 7-7",
    meeting: "M3 4h18v16H3V4Zm3 12 4-4 3 3 5-6M8 8h.01",
    grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
    users: "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 1a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-4",
    drive: "m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10",
    upgrade: "m3 5 9 16 9-16h-6l-3 5-3-5H3Z",
    unread: "M18 3h3v3M21 10v11H3V3h11",
    at: "M16 8v7c0 3 6 2 6-4a10 10 0 1 0-4 9M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    user: "M20 21H4v-2c0-4 5-3 5-7a5 5 0 1 1 6 0c0 4 5 3 5 7v2Z",
    search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
    plus: "M12 3v18M3 12h18",
    smile: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM8 9h.01M16 9h.01M7 14c2 5 8 5 10 0",
    image: "M3 3h18v18H3V3Zm0 14 6-6 5 5 3-3 4 4M15 7h.01",
    folder: "M2 6h8l2 3h10v12H2V6Zm0 0V3h8l2 3h8v3",
    phone: "M5 2 2 5c0 9 8 17 17 17l3-3-5-5-3 3-7-7 3-3-5-5Z",
    list: "M3 4h5v5H3V4Zm10 0h8M13 8h8M3 15h5v5H3v-5Zm10 0h8M13 19h8",
    quote: "M3 4h18v14H9l-6 4V4Zm4 5h10M7 13h7",
    more: "M4 12h.01M12 12h.01M20 12h.01",
    settings: "M9 3h6l1 4 4 1 1 6-4 2-1 5h-6l-2-4-5-1V9l4-2 2-4Zm7 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    back: "M9 5 2 12l7 7M2 12h20",
    bolt: "m14 1-11 13h8l-1 9L22 9h-9l1-8Z",
    pin: "m8 3 12 5-4 3-2 6-4-4-5-1 4-3-1-6Zm2 10-7 8",
    mute: "M5 9a7 7 0 0 1 11-6M19 9v5l2 3H9M9 21h6M2 2l20 20"
  };
  function wecomIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "wc-icon");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", paths[name] || paths.doc);
    svg.append(path);
    return svg;
  }
  function wecomAvatar(name) {
    let hash = 0;
    for (const c of name) hash = hash * 31 + c.charCodeAt(0) >>> 0;
    const colors = [
      ["#b9d9e3", "#60947b", "#385e58"],
      ["#e8d3b8", "#bc9172", "#6d665c"],
      ["#bacbe0", "#8695b9", "#4e6588"],
      ["#d6debc", "#9dad78", "#637658"],
      ["#d8c8d6", "#ad92ad", "#765c79"]
    ][hash % 5];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("aria-hidden", "true");
    const parts = [
      ["rect", { width: "40", height: "40", fill: colors[0] }],
      [
        "circle",
        { cx: String(7 + (hash >>> 8) % 25), cy: "10", r: "5", fill: "#fff9" }
      ],
      [
        "path",
        {
          d: `M0 30 12 ${9 + (hash >>> 12) % 14} 28 32 40 18V40H0Z`,
          fill: colors[1]
        }
      ],
      ["path", { d: "M0 35 24 22 40 32V40H0Z", fill: colors[2] }]
    ];
    for (const [tag, attributes] of parts) {
      const part = document.createElementNS(svg.namespaceURI, tag);
      for (const [key, value] of Object.entries(attributes))
        part.setAttribute(key, value);
      svg.append(part);
    }
    return svg;
  }

  // src/components/workspace.ts
  var node = (tag, cls, text = "") => {
    const element = document.createElement(tag);
    element.className = cls;
    element.textContent = text;
    return element;
  };
  var conversation = (id, name, color, unread, messages, extra = {}) => ({ id, name, color, unread, messages, ...extra });
  var seed = () => [
    conversation(
      "review",
      "\u5BA2\u6237\u5DE5\u4F5C\u53F0 \xB7 \u9879\u76EE\u7EC4",
      "#6479c8",
      4,
      [
        {
          author: "\u674E\u60F3",
          text: "\u5BA2\u6237\u5DE5\u4F5C\u53F0\u7684\u9A8C\u6536\u6E05\u5355\u66F4\u65B0\u597D\u4E86\uFF0C\u5927\u5BB6\u770B\u770B\u8FD8\u6709\u6CA1\u6709\u9057\u6F0F\u3002",
          time: "09:18"
        },
        {
          author: "\u738B\u6668",
          text: "\u8865\u4E86\u7A7A\u72B6\u6001\u548C\u6743\u9650\u4E0D\u8DB3\u4E24\u4E2A\u573A\u666F\uFF0C\u63A5\u53E3\u8054\u8C03\u4E0B\u5348\u53EF\u4EE5\u5F00\u59CB\u3002",
          time: "09:21"
        },
        {
          author: "\u674E\u60F3",
          text: "@\u6797\u6C90 \u7B5B\u9009\u9879\u7684\u4EA4\u4E92\u9EBB\u70E6\u518D\u786E\u8BA4\u4E00\u4E0B\uFF0C\u4ECA\u5929 15:00 \u524D\u7ED9\u4E2A\u7ED3\u8BBA\u5C31\u884C\u3002",
          time: "09:26",
          mention: true
        },
        {
          author: "\u5B59\u60A6",
          text: "\u8BBE\u8BA1\u7A3F\u91CC\u7684\u8BF4\u660E\u4E5F\u8865\u4E0A\u4E86\uFF0C\u6309\u6700\u65B0\u4E00\u7248\u8D70\u3002",
          time: "09:32"
        }
      ],
      { members: 18, starred: true }
    ),
    conversation(
      "design",
      "\u8BBE\u8BA1\u4E0E\u7814\u53D1\u5BF9\u9F50",
      "#cb9860",
      2,
      [
        {
          author: "\u5B59\u60A6",
          text: "\u5217\u8868\u5BC6\u5EA6\u8C03\u5230\u4E86 64px\uFF0C\u957F\u6807\u9898\u7EDF\u4E00\u7701\u7565\uFF0C\u5B8C\u6574\u5185\u5BB9 hover \u5C55\u793A\u3002",
          time: "09:10"
        },
        { author: "\u738B\u6668", text: "\u6536\u5230\uFF0C\u8FD9\u7248\u6211\u5148\u5408\u5230\u6D4B\u8BD5\u73AF\u5883\u3002", time: "09:15" },
        {
          author: "\u5B59\u60A6",
          text: "@\u6797\u6C90 \u6709\u7A7A\u5E2E\u770B\u4E00\u4E0B\u8BE6\u60C5\u9875\u7684\u95F4\u8DDD\uFF0C\u53F3\u4FA7\u9762\u677F\u6211\u6807\u4E86\u4E24\u5904\u3002",
          time: "09:28",
          mention: true
        }
      ],
      { members: 9, starred: true }
    ),
    conversation(
      "share",
      "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41",
      "#528ac7",
      0,
      [
        {
          author: "\u6797\u6653\u96E8",
          text: "\u4E0A\u5348\u7684\u8BC4\u5BA1\u7EAA\u8981\u5DF2\u7ECF\u6574\u7406\u597D\u4E86\uFF0C\u7ED3\u8BBA\u653E\u5728\u6587\u6863\u6700\u540E\u4E00\u9875\u3002",
          time: "09:40"
        },
        {
          author: "\u9648\u601D\u8FDC",
          text: "\u6536\u5230\u3002\u6211\u627E\u4E86\u51E0\u4E2A\u76F8\u5173\u7684\u4F8B\u5B50\uFF0C\u653E\u7FA4\u91CC\u5927\u5BB6\u6709\u7A7A\u770B\u4E00\u4E0B\u3002",
          time: "09:42"
        }
      ],
      { members: 12, starred: true }
    ),
    conversation("lin", "\u6797\u6653\u96E8", "#b388b8", 1, [
      {
        author: "\u6797\u6653\u96E8",
        text: "\u5468\u62A5\u6A21\u677F\u6211\u53D1\u4F60\u4E86\uFF0C\u8FD9\u5468\u65B0\u589E\u7684\u4E24\u4E2A\u6307\u6807\u5728\u7B2C\u4E8C\u5F20\u8868\u3002",
        time: "09:07"
      },
      {
        author: "\u6797\u6653\u96E8",
        text: "\u4F60\u65B9\u4FBF\u7684\u65F6\u5019\u8865\u4E00\u4E0B\u7814\u53D1\u8FDB\u5EA6\u5C31\u597D\uFF0C\u4E0D\u7740\u6025\u3002",
        time: "09:12"
      }
    ]),
    conversation(
      "release",
      "\u672C\u5468\u53D1\u5E03\u534F\u8C03",
      "#57a999",
      3,
      [
        {
          author: "\u5468\u5B81",
          text: "\u4ECA\u665A\u53D1\u5E03\u7A97\u53E3 20:00\u201420:30\uFF0C\u56DE\u6EDA\u65B9\u6848\u8BF7\u5728\u4E0B\u73ED\u524D\u786E\u8BA4\u3002",
          time: "08:58"
        },
        {
          author: "\u9648\u601D\u8FDC",
          text: "\u7070\u5EA6\u540D\u5355\u5DF2\u66F4\u65B0\uFF0C\u6D4B\u8BD5\u73AF\u5883\u9A8C\u8BC1\u901A\u8FC7\u3002",
          time: "09:05"
        },
        { author: "\u5468\u5B81", text: "\u6536\u5230\uFF0C\u4E0B\u5348\u518D\u8FC7\u4E00\u6B21 checklist\u3002", time: "09:16" }
      ],
      { members: 26, muted: true }
    ),
    conversation("chen", "\u9648\u601D\u8FDC", "#629da5", 0, [
      {
        author: "\u6211",
        text: "\u65E5\u5FD7\u770B\u5230\u4E86\uFF0C\u662F\u65E7\u7F13\u5B58\uFF0C\u6E05\u7406\u540E\u518D\u8BD5\u4E00\u4E0B\u3002",
        time: "\u6628\u5929",
        self: true
      },
      { author: "\u9648\u601D\u8FDC", text: "\u53EF\u4EE5\u4E86\uFF0C\u611F\u8C22\uFF01", time: "\u6628\u5929" }
    ]),
    conversation(
      "lunch",
      "\u5348\u996D\u642D\u5B50",
      "#d89954",
      2,
      [
        { author: "\u738B\u6668", text: "\u4E2D\u5348\u53BB\u697C\u4E0B\u90A3\u5BB6\u9762\u9986\uFF1F", time: "\u6628\u5929" },
        { author: "\u6797\u6653\u96E8", text: "\u53EF\u4EE5\uFF0C\u5341\u4E8C\u70B9\u7535\u68AF\u53E3\u89C1\u3002", time: "\u6628\u5929" }
      ],
      { members: 7, muted: true }
    ),
    conversation(
      "weekly",
      "\u6BCF\u5468\u6280\u672F\u5206\u4EAB",
      "#7882ae",
      0,
      [
        {
          author: "\u5468\u5B81",
          text: "\u672C\u5468\u56DB\u7684\u5206\u4EAB\u6539\u5230 16:00\uFF0C\u8FD8\u662F 302 \u4F1A\u8BAE\u5BA4\u3002",
          time: "\u5468\u4E94"
        },
        {
          author: "\u738B\u6668",
          text: "\u65E5\u5386\u9080\u8BF7\u5DF2\u66F4\u65B0\uFF0C\u5927\u5BB6\u8BB0\u5F97\u63A5\u53D7\u4E00\u4E0B\u3002",
          time: "\u5468\u4E94"
        }
      ],
      { members: 31 }
    )
  ];
  var wecomSeed = () => {
    const items = seed();
    items.find((c) => c.id === "share").name = "\u4EA7\u54C1\u7814\u53D1\u4EA4\u6D41\u7FA4";
    items.find((c) => c.id === "share").messages = [
      {
        author: "\u6797\u6653\u96E8",
        text: "\u4E0A\u5348\u8BC4\u5BA1\u7684\u7ED3\u8BBA\u653E\u5230\u7FA4\u516C\u544A\u4E86\uFF0C\u6392\u671F\u6709\u53D8\u52A8\u7684\u8BDD\u5728\u7FA4\u91CC\u8BF4\u4E00\u58F0\u3002",
        time: "09:40"
      },
      {
        author: "\u6211",
        text: "\u6536\u5230\uFF0C\u4E0B\u5348\u628A\u5269\u4E0B\u4E24\u4E2A\u9875\u9762\u8D70\u4E00\u904D\u3002",
        time: "09:41",
        self: true,
        quote: { author: "\u6797\u6653\u96E8", text: "\u6392\u671F\u6709\u53D8\u52A8\u7684\u8BDD\u5728\u7FA4\u91CC\u8BF4\u4E00\u58F0\u3002" }
      },
      {
        author: "\u9648\u601D\u8FDC",
        text: "\u521A\u770B\u5230\u51E0\u4E2A\u4E0D\u9519\u7684\u6848\u4F8B\uFF0C\u5206\u4EAB\u8FC7\u6765\uFF0C\u5927\u5BB6\u6709\u7A7A\u770B\u770B\u3002",
        time: "09:42"
      }
    ];
    items.find((c) => c.id === "review").messages.unshift({
      author: "\u6211",
      text: "\u6628\u5929\u63D0\u7684\u7B5B\u9009\u95EE\u9898\u4FEE\u597D\u4E86\uFF0C\u6211\u518D\u6838\u4E00\u4E0B\u9A8C\u6536\u6E05\u5355\u3002",
      time: "09:16",
      self: true
    });
    return items;
  };
  var Workspace = class {
    constructor() {
      __publicField(this, "conversations", seed());
      __publicField(this, "theme", "feishu");
      __publicField(this, "wecomConversations", wecomSeed());
      __publicField(this, "feishuConversations", this.conversations);
      __publicField(this, "query", "");
      __publicField(this, "videoSearch", null);
      __publicField(this, "controls", null);
      __publicField(this, "videoSearchOpen", false);
      __publicField(this, "drafts", /* @__PURE__ */ new Map());
      __publicField(this, "quotes", /* @__PURE__ */ new Map());
      __publicField(this, "composerInput", null);
      __publicField(this, "sendButton", null);
      __publicField(this, "onOpen", null);
      __publicField(this, "selected", "share");
      __publicField(this, "filter", "all");
      __publicField(this, "sidebar");
      __publicField(this, "root");
      __publicField(this, "chat");
      __publicField(this, "heading");
      __publicField(this, "panel", null);
      __publicField(this, "badge", null);
    }
    attach(sidebar, root, chat, heading, theme = "feishu", videoSearch = null, controls = null) {
      this.theme = theme;
      this.videoSearch = videoSearch;
      this.controls = controls;
      this.conversations = theme === "wecom" ? this.wecomConversations : this.feishuConversations;
      this.query = "";
      this.filter = "all";
      this.composerInput = null;
      this.sendButton = null;
      this.panel?.remove();
      this.panel = null;
      this.sidebar = sidebar;
      this.root = root;
      this.chat = chat;
      this.heading = heading;
      this.selected = "share";
      chat.hidden = false;
      const rail = root.querySelector(".bo-rail-nav button");
      this.badge = node("span", "fs-rail-badge");
      rail?.append(this.badge);
      this.render();
    }
    leave() {
      this.root?.querySelector(".wc-details")?.remove();
      this.badge?.remove();
      this.composerInput = null;
      this.sendButton = null;
      this.onOpen = null;
      this.panel?.remove();
      this.panel = null;
      if (this.chat) this.chat.hidden = false;
    }
    showFeed() {
      this.root.querySelector(".wc-details")?.remove();
      this.root.querySelector(".wc-details-toggle")?.setAttribute("aria-expanded", "false");
      this.selected = "share";
      if (this.composerInput)
        this.composerInput.value = this.drafts.get("share") || "";
      this.updateSend();
      this.renderQuote();
      this.panel?.remove();
      this.panel = null;
      this.chat.hidden = false;
      this.heading.textContent = this.conversations.find(
        (c) => c.id === "share"
      ).name;
      const meta = this.root.querySelector(".bo-header-meta");
      if (meta) meta.textContent = "12 \u4EBA";
      this.render();
    }
    totals() {
      return {
        unread: this.conversations.reduce((sum, c) => sum + c.unread, 0),
        mention: this.conversations.filter(
          (c) => c.unread && c.messages.some((m) => m.mention)
        ).length,
        starred: this.conversations.filter((c) => c.starred).length
      };
    }
    button(text, action, cls = "") {
      const b = node("button", cls, text);
      b.type = "button";
      b.onclick = action;
      return b;
    }
    avatar(c) {
      const avatar = node("span", "fs-avatar", c.name.slice(0, 1));
      avatar.style.setProperty("--fs-avatar-color", c.color);
      if (c.members) {
        avatar.textContent = "";
        avatar.classList.add("fs-group-avatar");
        const letters = this.theme === "wecom" ? [
          .../* @__PURE__ */ new Set([
            ...c.messages.map(
              (m) => m.self ? "\u6797" : m.author.slice(0, 1)
            ),
            "\u6797",
            "\u738B",
            "\u9648"
          ])
        ].slice(0, 4) : ["\u674E", "\u6797", "\u9648", "\u738B"];
        for (const letter of letters) avatar.append(node("i", "", letter));
      }
      if (this.theme === "wecom") {
        if (c.members) {
          avatar.replaceChildren();
          for (const name of [
            .../* @__PURE__ */ new Set([
              ...c.messages.map((m) => m.author),
              "\u674E\u60F3",
              "\u738B\u6668",
              "\u5468\u5B81",
              "\u5B59\u60A6",
              "\u6797\u6653\u96E8",
              "\u9648\u601D\u8FDC",
              "\u8BB8\u5609\u5B81",
              "\u8D75\u4E00\u5E06",
              "\u9646\u8FDC"
            ])
          ].slice(0, 9)) {
            const tile = node("i", "");
            tile.append(wecomAvatar(name));
            avatar.append(tile);
          }
        } else avatar.replaceChildren(wecomAvatar(c.name));
      }
      return avatar;
    }
    toggleVideoSearch() {
      this.videoSearchOpen = !this.videoSearchOpen;
      this.render();
      if (this.videoSearchOpen) this.videoSearch?.querySelector("input")?.focus();
    }
    renderInfo() {
      if (this.theme !== "wecom") return;
      const info = this.root.querySelector(".bo-info-panel");
      if (!info) return;
      info.setAttribute("aria-label", "\u7FA4\u4FE1\u606F");
      const c = this.conversations.find((c2) => c2.id === this.selected);
      info.replaceChildren();
      if (!c.members) {
        info.append(
          node("h3", "wc-contact-title", "\u8054\u7CFB\u4EBA\u8D44\u6599"),
          this.avatar(c),
          node("strong", "wc-contact-title", c.name),
          node("p", "wc-info-muted", "\u4F01\u4E1A\u8054\u7CFB\u4EBA")
        );
        return;
      }
      const announcements = document.createElement("details");
      announcements.className = "wc-info-announcements";
      announcements.open = true;
      announcements.append(node("summary", "", "\u7FA4\u516C\u544A"));
      for (const title of [
        "\u672C\u5468\u9879\u76EE\u6392\u671F\u4E0E\u4EA4\u4ED8\u8BA1\u5212",
        "\u8054\u8C03\u73AF\u5883\u4F7F\u7528\u8BF4\u660E",
        "\u53D1\u5E03\u68C0\u67E5\u6E05\u5355"
      ]) {
        const item2 = node("p", "wc-info-document");
        item2.append(wecomIcon("doc"), node("span", "", title));
        announcements.append(item2);
      }
      const board = document.createElement("details");
      board.className = "wc-info-board";
      board.append(
        node("summary", "", "\u7FA4\u770B\u677F"),
        node("p", "wc-info-muted", "\u9A8C\u6536\u6E05\u5355\u5DF2\u66F4\u65B0\uFF0C\u4E0B\u5348\u540C\u6B65\u8054\u8C03\u8FDB\u5EA6\u3002")
      );
      const members = node("section", "wc-info-members");
      members.append(node("h3", "", `\u7FA4\u6210\u5458 \xB7 ${c.members}`));
      const names = [
        .../* @__PURE__ */ new Set([
          ...c.messages.map((m) => m.self ? "\u6797\u6C90" : m.author),
          "\u6797\u6C90",
          "\u674E\u60F3",
          "\u738B\u6668",
          "\u5B59\u60A6",
          "\u5468\u5B81",
          "\u9648\u601D\u8FDC",
          "\u6797\u6653\u96E8",
          "\u8BB8\u5609\u5B81",
          "\u8D75\u4E00\u5E06",
          "\u6C88\u77E5\u884C",
          "\u5510\u53EF",
          "\u9646\u8FDC"
        ])
      ].slice(0, Math.min(c.members, 12));
      names.forEach((name, index) => {
        const row = node("div", "wc-info-member");
        row.append(wecomIcon("user"), node("span", "", name));
        if (index === 0) row.append(node("small", "", "\u7FA4\u4E3B"));
        members.append(row);
      });
      if (c.members > names.length)
        members.append(node("p", "wc-info-muted", `\u7B49 ${c.members} \u4F4D\u6210\u5458`));
      info.append(announcements, board, members);
    }
    render() {
      this.renderInfo();
      const totals = this.totals();
      if (this.badge) {
        this.badge.textContent = String(totals.unread);
        this.badge.hidden = !totals.unread;
      }
      const filters = node("nav", "fs-filters");
      filters.setAttribute("aria-label", "\u6D88\u606F\u7B5B\u9009");
      const choices = this.theme === "wecom" ? [
        ["all", "\u5168\u90E8\u6D88\u606F", null],
        ["unread", "\u672A\u8BFB", totals.unread],
        ["mention", "@\u6211", totals.mention],
        [
          "single",
          "\u5355\u804A",
          this.conversations.filter((c) => !c.members).length
        ],
        [
          "group",
          "\u7FA4\u804A",
          this.conversations.filter((c) => !!c.members).length
        ],
        ["starred", "\u7F6E\u9876", totals.starred]
      ] : [
        ["all", "\u6D88\u606F", null],
        ["unread", "\u672A\u8BFB", totals.unread],
        ["mention", "@\u6211", totals.mention],
        ["starred", "\u6807\u8BB0", totals.starred]
      ];
      for (const [key, label, count] of choices) {
        const b = this.button(
          label,
          () => {
            this.filter = key;
            this.render();
          },
          "fs-filter"
        );
        if (this.theme === "wecom")
          b.prepend(
            wecomIcon(
              {
                all: "chat",
                unread: "unread",
                mention: "at",
                starred: "pin",
                single: "user",
                group: "users"
              }[key]
            )
          );
        b.dataset.filter = key;
        b.setAttribute("aria-pressed", String(this.filter === key));
        if (count) b.append(node("span", "fs-filter-count", String(count)));
        filters.append(b);
      }
      const pins = node("div", "fs-pins");
      for (const c of this.conversations.filter((c2) => c2.starred)) {
        const pin = this.button("", () => this.open(c), "fs-pin");
        pin.title = c.name;
        pin.append(this.avatar(c), node("span", "", c.name.split(" \xB7 ")[0]));
        pins.append(pin);
      }
      const rows = node("div", "fs-conversations");
      rows.setAttribute("aria-label", "\u4F1A\u8BDD\u5217\u8868");
      const visible = this.conversations.filter(
        (c) => this.filter === "all" || this.filter === "unread" && c.unread > 0 || this.filter === "mention" && c.unread > 0 && c.messages.some((m) => m.mention) || this.filter === "starred" && c.starred || this.filter === "single" && !c.members || this.filter === "group" && !!c.members
      );
      const matched = visible.filter(
        (c) => !this.query || `${c.name} ${c.messages.map((m) => m.text).join(" ")}`.includes(
          this.query
        )
      );
      if (this.theme === "wecom")
        matched.sort((a, b) => Number(!!b.starred) - Number(!!a.starred));
      for (const c of matched) {
        const row = this.button("", () => this.open(c), "fs-conversation");
        row.dataset.conversation = c.id;
        row.classList.toggle("active", this.selected === c.id);
        row.setAttribute("aria-label", c.name);
        row.setAttribute("aria-current", String(this.selected === c.id));
        const picture = this.avatar(c);
        if (c.unread)
          picture.append(
            node(
              "b",
              c.muted ? "fs-muted-badge" : "fs-unread-badge",
              c.muted ? "" : String(c.unread)
            )
          );
        const copy = node("span", "fs-conversation-copy");
        copy.append(node("strong", "", c.name));
        const last = c.messages[c.messages.length - 1];
        const preview = node("span", "fs-preview");
        if (c.unread && c.messages.some((m) => m.mention))
          preview.append(node("em", "", "[\u6709\u4EBA@\u6211] "));
        preview.append(
          document.createTextNode(
            `${c.members ? last.author + "\uFF1A" : ""}${last.text}`
          )
        );
        copy.append(preview);
        const meta = node("span", "fs-conversation-meta");
        meta.append(
          node("time", "", last.time),
          node("span", "", c.muted ? "\u514D\u6253\u6270" : c.starred ? "\u7F6E\u9876" : "")
        );
        if (this.theme === "wecom") {
          row.title = `${c.name}
${last.author}\uFF1A${last.text}`;
          const status = meta.querySelector("span");
          status.replaceChildren();
          if (c.muted) {
            status.append(wecomIcon("mute"));
            status.setAttribute("aria-label", "\u514D\u6253\u6270");
          } else if (c.starred) {
            status.append(wecomIcon("pin"));
            status.setAttribute("aria-label", "\u7F6E\u9876");
          }
        }
        row.append(picture, copy, meta);
        rows.append(row);
      }
      if (!matched.length)
        rows.append(
          node(
            "p",
            "fs-empty",
            this.query ? "\u6CA1\u6709\u627E\u5230\u76F8\u5173\u4F1A\u8BDD" : "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u6D88\u606F"
          )
        );
      const close = this.button(
        "\u2039",
        () => this.sidebar.classList.remove("open"),
        "bo-mobile-menu"
      );
      close.setAttribute("aria-label", "\u6536\u8D77\u5BFC\u822A");
      const head = node("div", "fs-list-head");
      head.append(node("strong", "", "\u6D88\u606F"), close);
      if (this.theme === "wecom") {
        head.querySelector("strong").textContent = "\u6D88\u606F";
        const search = document.createElement("input");
        search.type = "search";
        search.className = "wc-conversation-search";
        search.placeholder = "\u641C\u7D22";
        search.setAttribute("aria-label", "\u641C\u7D22\u4F1A\u8BDD");
        search.value = this.query;
        let composing = false;
        const updateSearch = () => {
          if (composing) return;
          this.query = search.value;
          this.render();
          const next = this.sidebar.querySelector(
            ".wc-conversation-search"
          );
          next.focus();
        };
        search.addEventListener("compositionstart", () => {
          composing = true;
        });
        search.addEventListener("compositionend", () => {
          composing = false;
          updateSearch();
        });
        search.oninput = updateSearch;
        const searchHead = node("div", "wc-search-head");
        const searchBox = node("div", "wc-search-box");
        searchBox.append(wecomIcon("search"), search);
        const add = this.button(
          "",
          () => this.toggleVideoSearch(),
          "wc-search-add"
        );
        add.append(wecomIcon("plus"));
        add.setAttribute("aria-label", "\u641C\u7D22\u89C6\u9891");
        add.setAttribute("aria-expanded", String(this.videoSearchOpen));
        searchHead.append(searchBox, add, close);
        const searchTools = node("div", "wc-search-tools");
        searchTools.hidden = !this.videoSearchOpen;
        if (this.videoSearch) searchTools.append(this.videoSearch);
        const railGroups = this.root.querySelector(".wc-rail-groups");
        const mobileFilters = filters.cloneNode(true);
        mobileFilters.classList.add("wc-mobile-filters");
        mobileFilters.querySelectorAll("button").forEach(
          (b, i) => b.onclick = () => filters.querySelectorAll("button")[i].click()
        );
        railGroups?.replaceChildren(
          node("div", "wc-group-label", "\u5206\u7EC4"),
          filters
        );
        this.sidebar.replaceChildren(
          searchHead,
          searchTools,
          mobileFilters,
          rows
        );
        if (this.controls) this.sidebar.append(this.controls);
      } else this.sidebar.replaceChildren(head, filters, pins, rows);
    }
    bindComposer(input, button) {
      this.composerInput = input;
      this.sendButton = button;
      input.value = this.drafts.get(this.selected) || "";
      input.oninput = () => {
        this.drafts.set(this.selected, input.value);
        this.updateSend();
      };
      this.updateSend();
      this.renderQuote();
    }
    quoteLatest() {
      const c = this.conversations.find((c2) => c2.id === this.selected);
      const last = c.messages[c.messages.length - 1];
      this.quotes.set(c.id, { author: last.author, text: last.text });
      this.renderQuote();
      this.composerInput?.focus();
    }
    renderQuote() {
      const composer = this.composerInput?.closest("form");
      if (!composer) return;
      composer.querySelector(".wc-compose-quote")?.remove();
      const quote = this.quotes.get(this.selected);
      if (!quote) return;
      const preview = node("div", "wc-compose-quote");
      const cancel = this.button("\xD7", () => {
        this.quotes.delete(this.selected);
        this.renderQuote();
      });
      cancel.setAttribute("aria-label", "\u53D6\u6D88\u5F15\u7528");
      preview.append(node("span", "", `${quote.author}\uFF1A${quote.text}`), cancel);
      composer.append(preview);
    }
    updateSend() {
      if (this.sendButton)
        this.sendButton.disabled = !this.composerInput?.value.trim();
    }
    send(text) {
      if (!text.trim()) return;
      const c = this.conversations.find((c2) => c2.id === this.selected);
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const quote = this.quotes.get(c.id);
      c.messages.push({
        author: "\u6211",
        text: text.trim(),
        time,
        self: true,
        ...quote ? { quote } : {}
      });
      this.quotes.delete(c.id);
      this.renderQuote();
      this.drafts.delete(c.id);
      if (this.composerInput) this.composerInput.value = "";
      this.updateSend();
      if (c.id === "share") {
        const row = node("article", "fs-message fs-self wc-local-sent");
        const avatar = node("span", "fs-avatar", "");
        avatar.append(wecomAvatar("\u6797\u6C90"));
        const body = node("div", "fs-message-body");
        body.append(
          node("div", "fs-message-meta", `\u6211\u3000${time}`),
          node("div", "fs-text-bubble", text.trim())
        );
        if (quote) {
          const block = node("blockquote", "wc-quoted-message");
          block.append(
            node("strong", "", `${quote.author}\uFF1A`),
            node("div", "", quote.text)
          );
          body.querySelector(".fs-text-bubble").prepend(block);
        }
        row.append(avatar, body);
        this.chat.append(row);
        this.chat.scrollTop = this.chat.scrollHeight;
        this.render();
      } else {
        this.open(c);
        if (this.panel) this.panel.scrollTop = this.panel.scrollHeight;
      }
    }
    toggleDetails() {
      const existing = this.root.querySelector(".wc-details");
      const trigger = this.root.querySelector(".wc-details-toggle");
      if (existing) {
        existing.remove();
        trigger?.setAttribute("aria-expanded", "false");
        return;
      }
      trigger?.setAttribute("aria-expanded", "true");
      const c = this.conversations.find((c2) => c2.id === this.selected);
      const panel = node("section", "wc-details");
      panel.setAttribute("aria-label", "\u4F1A\u8BDD\u8BE6\u60C5");
      const close = this.button("\u5173\u95ED", () => this.toggleDetails());
      const title = node("strong", "", c.name);
      const pin = this.button(c.starred ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u4F1A\u8BDD", () => {
        c.starred = !c.starred;
        panel.remove();
        this.render();
        this.toggleDetails();
      });
      const mute = this.button(c.muted ? "\u5173\u95ED\u514D\u6253\u6270" : "\u6D88\u606F\u514D\u6253\u6270", () => {
        c.muted = !c.muted;
        panel.remove();
        this.render();
        this.toggleDetails();
      });
      pin.setAttribute("aria-pressed", String(!!c.starred));
      mute.setAttribute("aria-pressed", String(!!c.muted));
      panel.append(
        close,
        this.avatar(c),
        title,
        node("p", "", c.members ? `\u7FA4\u6210\u5458 \xB7 ${c.members} \u4EBA` : "\u4F01\u4E1A\u8054\u7CFB\u4EBA"),
        pin,
        mute,
        node("h4", "", "\u7FA4\u516C\u544A"),
        node(
          "p",
          "",
          c.members ? "\u9879\u76EE\u8FDB\u5C55\u8BF7\u53CA\u65F6\u540C\u6B65\uFF1B\u8BC4\u5BA1\u7ED3\u8BBA\u548C\u6392\u671F\u4EE5\u6587\u6863\u6700\u65B0\u7248\u4E3A\u51C6\u3002" : "\u6682\u65E0\u516C\u544A"
        )
      );
      this.root.append(panel);
    }
    open(c) {
      this.root.querySelector(".wc-details")?.remove();
      this.root.querySelector(".wc-details-toggle")?.setAttribute("aria-expanded", "false");
      this.onOpen?.();
      this.selected = c.id;
      if (this.composerInput)
        this.composerInput.value = this.drafts.get(c.id) || "";
      this.updateSend();
      this.renderQuote();
      const unread = c.unread;
      c.unread = 0;
      this.render();
      this.sidebar.classList.remove("open");
      this.panel?.remove();
      this.panel = null;
      this.heading.textContent = c.name;
      const meta = this.root.querySelector(".bo-header-meta");
      if (meta) meta.textContent = c.members ? `${c.members} \u4EBA` : "\u4F01\u4E1A\u8054\u7CFB\u4EBA";
      this.chat.hidden = c.id !== "share";
      if (c.id === "share") return;
      const panel = node("div", "fs-history");
      panel.append(
        node(
          "div",
          "fs-history-day",
          ["\u6628\u5929", "\u5468\u4E94"].includes(c.messages[0].time) ? c.messages[0].time : "\u4ECA\u5929"
        )
      );
      c.messages.forEach((m, index) => {
        if (unread && index === Math.max(0, c.messages.length - unread))
          panel.append(node("div", "fs-unread-divider", "\u4EE5\u4E0B\u662F\u65B0\u6D88\u606F"));
        const row = node("article", `fs-message${m.self ? " fs-self" : ""}`);
        const avatar = node(
          "span",
          "fs-avatar",
          m.self && this.theme === "wecom" ? "\u6797" : m.author.slice(0, 1)
        );
        avatar.style.setProperty("--fs-avatar-color", c.color);
        if (this.theme === "wecom")
          avatar.replaceChildren(wecomAvatar(m.self ? "\u6797\u6C90" : m.author));
        const body = node("div", "fs-message-body");
        body.append(node("div", "fs-message-meta", `${m.author}\u3000${m.time}`));
        const bubble = node("div", "fs-text-bubble");
        if (m.quote && this.theme === "wecom") {
          const quote = node("blockquote", "wc-quoted-message");
          quote.append(
            node("strong", "", `${m.quote.author}\uFF1A`),
            node("div", "", m.quote.text)
          );
          bubble.append(quote);
        }
        if (m.mention) {
          const parts = m.text.split("@\u6797\u6C90");
          bubble.append(
            document.createTextNode(parts[0]),
            node("mark", "fs-mention", "@\u6797\u6C90"),
            document.createTextNode(parts.slice(1).join("@\u6797\u6C90"))
          );
        } else bubble.append(document.createTextNode(m.text));
        body.append(bubble);
        row.append(avatar, body);
        panel.append(row);
      });
      this.chat.after(panel);
      this.panel = panel;
    }
  };

  // src/components/interludes.ts
  var exchanges = [
    ["\u5B59\u60A6", "\u8BC4\u5BA1\u7EAA\u8981\u8865\u597D\u4E86\uFF0C\u5F85\u786E\u8BA4\u7684\u4E24\u9879\u6211\u5728\u6587\u6863\u91CC\u6807\u9EC4\u4E86\u3002"],
    ["\u738B\u6668", "\u6536\u5230\uFF0C\u6211\u4E0B\u5348\u8054\u8C03\u7684\u65F6\u5019\u4E00\u8D77\u770B\uFF0C\u7ED3\u675F\u540E\u5728\u7FA4\u91CC\u540C\u6B65\u3002"],
    ["\u6797\u6653\u96E8", "\u660E\u5929\u7684\u4F1A\u5F80\u540E\u632A\u534A\u5C0F\u65F6\uFF0C\u65E5\u5386\u9080\u8BF7\u5DF2\u7ECF\u66F4\u65B0\u4E86\u3002"],
    ["\u9648\u601D\u8FDC", "\u53EF\u4EE5\uFF0C\u6211\u8FD9\u8FB9\u6CA1\u6709\u51B2\u7A81\u3002\u6F14\u793A\u73AF\u5883\u4E5F\u51C6\u5907\u597D\u4E86\u3002"],
    ["\u5468\u5B81", "\u8FD9\u5468\u5148\u628A\u4E3B\u6D41\u7A0B\u8DD1\u901A\uFF0C\u8FB9\u754C\u60C5\u51B5\u6211\u5355\u72EC\u6574\u7406\u4E86\u4E00\u9875\u6E05\u5355\u3002"],
    ["\u5B59\u60A6", "\u6211\u8865\u4E86\u7A7A\u72B6\u6001\u7684\u8BF4\u660E\uFF0C\u9875\u9762\u95F4\u8DDD\u6309\u6700\u65B0\u7684\u6807\u6CE8\u8D70\u5C31\u597D\u3002"],
    ["\u738B\u6668", "\u6D4B\u8BD5\u73AF\u5883\u5DF2\u7ECF\u66F4\u65B0\uFF0C\u5927\u5BB6\u6709\u7A7A\u5E2E\u5FD9\u8FC7\u4E00\u4E0B\u7B5B\u9009\u548C\u7FFB\u9875\u3002"],
    ["\u6797\u6653\u96E8", "\u521A\u770B\u4E86\u4E00\u904D\uFF0C\u7B5B\u9009\u6CA1\u6709\u95EE\u9898\uFF0C\u957F\u6807\u9898\u90A3\u5904\u6211\u7559\u4E86\u4E2A\u8BC4\u8BBA\u3002"],
    ["\u9648\u601D\u8FDC", "\u90A3\u5904\u6536\u5230\uFF0C\u4ECA\u5929\u4E0B\u73ED\u524D\u4E00\u8D77\u5904\u7406\u3002"],
    ["\u5468\u5B81", "\u5468\u4E94\u5206\u4EAB\u7684\u6750\u6599\u653E\u5230\u77E5\u8BC6\u5E93\u4E86\uFF0C\u5148\u770B\u76EE\u5F55\uFF0C\u6709\u95EE\u9898\u76F4\u63A5\u5728\u6587\u6863\u91CC\u7559\u8A00\u3002"],
    ["\u5B59\u60A6", "\u597D\u7684\uFF0C\u6211\u628A\u8BBE\u8BA1\u4FA7\u7684\u4F8B\u5B50\u4E5F\u653E\u8FDB\u53BB\u3002"],
    ["\u738B\u6668", "\u53D1\u5E03\u524D\u518D\u8FC7\u4E00\u6B21\u6E05\u5355\uFF0C\u786E\u8BA4\u5B8C\u6211\u6765\u66F4\u65B0\u4EFB\u52A1\u72B6\u6001\u3002"]
  ];
  function messageTime(index) {
    const minute = 9 * 60 + 44 + index;
    return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  }
  function interludeAfter(videoCount) {
    if (videoCount < 2 || ![0, 2].includes(videoCount % 5)) return null;
    const index = Math.floor(videoCount / 5) * 2 - (videoCount % 5 === 0 ? 1 : 0);
    const [author, text] = exchanges[index % exchanges.length];
    return { author, text, time: messageTime(videoCount - 1) };
  }

  // src/styles/workspace.css
  var workspace_default = '/* These tokens follow the existing appearance setting. */\n#bilioffice-root[data-theme="feishu"] {\n  --fs-hover: color-mix(in srgb, var(--bo-accent) 6%, var(--bo-panel));\n  --fs-active: color-mix(in srgb, var(--bo-accent) 12%, var(--bo-panel));\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar {\n  display: flex;\n  flex-direction: column;\n  background: var(--bo-panel);\n  overflow: hidden;\n}\n#bilioffice-root .fs-list-head {\n  height: 48px;\n  padding: 0 18px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  flex: none;\n}\n#bilioffice-root .fs-list-head strong {\n  font-size: 16px;\n  font-weight: 600;\n}\n#bilioffice-root .fs-filters {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  padding: 2px 12px 12px;\n  flex: none;\n}\n#bilioffice-root .fs-filter {\n  display: flex;\n  gap: 5px;\n  align-items: center;\n  border-radius: 6px;\n  padding: 5px 7px;\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .fs-filter[aria-pressed="true"] {\n  color: var(--bo-accent);\n  background: var(--fs-active);\n}\n#bilioffice-root .fs-filter-count {\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n}\n#bilioffice-root .fs-pins {\n  display: flex;\n  gap: 15px;\n  padding: 6px 16px 14px;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root .fs-pin {\n  min-width: 0;\n  width: 70px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 6px;\n}\n#bilioffice-root .fs-pin > span:last-child {\n  max-width: 100%;\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  font-size: 11px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .fs-avatar {\n  width: 36px;\n  height: 36px;\n  flex: none;\n  display: inline-grid;\n  place-items: center;\n  border-radius: 50%;\n  position: relative;\n  background: var(--fs-avatar-color, #648ac6);\n  color: white;\n  font-size: 14px;\n  font-style: normal;\n}\n#bilioffice-root .fs-group-avatar {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 2px;\n  padding: 4px;\n  border-radius: 9px;\n  background: color-mix(in srgb, var(--fs-avatar-color) 20%, var(--bo-panel));\n}\n#bilioffice-root .fs-group-avatar i {\n  display: grid;\n  place-items: center;\n  border-radius: 3px;\n  background: var(--fs-avatar-color);\n  color: #fff;\n  font-size: 8px;\n  line-height: 1;\n  font-style: normal;\n}\n#bilioffice-root .fs-group-avatar i:nth-child(2) {\n  opacity: 0.65;\n}\n#bilioffice-root .fs-group-avatar i:nth-child(3) {\n  opacity: 0.8;\n}\n#bilioffice-root .fs-conversations {\n  overflow-y: auto;\n  flex: 1;\n  min-height: 0;\n  padding-top: 6px;\n}\n#bilioffice-root .fs-conversation {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 13px 14px;\n  text-align: left;\n}\n#bilioffice-root .fs-conversation:hover {\n  background: var(--fs-hover);\n}\n#bilioffice-root .fs-conversation.active {\n  background: var(--fs-active);\n}\n#bilioffice-root .fs-conversation-copy {\n  display: flex;\n  flex: 1;\n  min-width: 0;\n  flex-direction: column;\n  gap: 5px;\n}\n#bilioffice-root .fs-conversation-copy strong {\n  font-size: 13px;\n  font-weight: 500;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#bilioffice-root .fs-preview {\n  display: block;\n  font-size: 12px;\n  color: var(--bo-muted);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#bilioffice-root .fs-preview em {\n  color: #d96843;\n  font-style: normal;\n}\n#bilioffice-root .fs-conversation-meta {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  gap: 6px;\n  color: var(--bo-muted);\n  font-size: 10px;\n}\n#bilioffice-root .fs-conversation-meta > span {\n  font-size: 9px;\n  opacity: 0.7;\n}\n#bilioffice-root .fs-unread-badge,\n#bilioffice-root .fs-rail-badge {\n  display: inline-grid;\n  place-items: center;\n  background: #e85f59;\n  color: #fff;\n  min-width: 17px;\n  height: 17px;\n  padding: 0 4px;\n  border-radius: 10px;\n  font-size: 10px;\n  font-weight: 500;\n}\n#bilioffice-root .fs-unread-badge {\n  position: absolute;\n  top: -5px;\n  right: -5px;\n  box-shadow: 0 0 0 2px var(--bo-panel);\n}\n#bilioffice-root .fs-rail-badge {\n  margin-left: auto;\n}\n#bilioffice-root .fs-muted-badge {\n  position: absolute;\n  top: -2px;\n  right: -2px;\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: #a3a8b0;\n}\n#bilioffice-root .fs-empty {\n  padding: 30px 10px;\n  text-align: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .fs-history {\n  flex: 1;\n  overflow: auto;\n  min-height: 0;\n  padding: 20px 28px;\n  background: var(--bo-panel);\n}\n#bilioffice-root .fs-history-day {\n  text-align: center;\n  font-size: 12px;\n  color: var(--bo-muted);\n  margin-bottom: 26px;\n}\n#bilioffice-root .fs-message {\n  display: flex;\n  gap: 10px;\n  align-items: flex-start;\n  margin: 0 0 22px;\n}\n#bilioffice-root .fs-message-body {\n  max-width: min(510px, 85%);\n  min-width: 0;\n}\n#bilioffice-root .fs-message-meta {\n  font-size: 11px;\n  color: var(--bo-muted);\n  margin-bottom: 5px;\n}\n#bilioffice-root .fs-text-bubble {\n  display: inline-block;\n  padding: 9px 12px;\n  background: color-mix(in srgb, var(--bo-text) 6%, var(--bo-panel));\n  color: var(--bo-text);\n  font-size: 13px;\n  line-height: 1.7;\n  border-radius: 2px 8px 8px;\n}\n#bilioffice-root .fs-mention {\n  color: var(--bo-accent);\n  background: var(--fs-active);\n  border-radius: 3px;\n  padding: 0 3px;\n}\n#bilioffice-root .fs-unread-divider {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  color: #ca7d52;\n  font-size: 11px;\n  margin: 22px 0;\n}\n#bilioffice-root .fs-unread-divider::before,\n#bilioffice-root .fs-unread-divider::after {\n  content: "";\n  height: 1px;\n  background: var(--bo-border);\n  flex: 1;\n}\n#bilioffice-root .fs-self {\n  flex-direction: row-reverse;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand::after {\n  content: "\u6797\u6C90 \xB7 \u4EA7\u54C1\u7814\u53D1";\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-brand {\n  margin: 0 0 15px;\n  gap: 8px;\n  padding: 0 4px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-toolbar h2 {\n  font-size: 11px;\n  font-weight: 400;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="feishu"] .bo-chat {\n  background: var(--bo-panel);\n  padding-top: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-bubble {\n  width: fit-content;\n  max-width: 100%;\n  background: color-mix(in srgb, var(--bo-text) 5%, var(--bo-panel));\n  box-shadow: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-composer {\n  background: var(--bo-panel);\n  min-height: 110px;\n  align-items: flex-end;\n}\n#bilioffice-root[data-theme="feishu"] .bo-composer input {\n  background: var(--bo-panel);\n  align-self: stretch;\n  border: 0;\n  padding-top: 15px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-composer-send {\n  height: 30px;\n  font-size: 12px;\n  border-radius: 5px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-rail-button {\n  color: var(--bo-muted);\n}\n@media (max-width: 600px) {\n  #bilioffice-root .fs-history {\n    padding: 14px;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-rail-brand::after {\n    content: none;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-rail-search {\n    display: none;\n  }\n  #bilioffice-root[data-theme="feishu"] .bo-composer {\n    min-height: 65px;\n  }\n}\n';

  // src/styles/wecom.css
  var wecom_default = '/* Desktop proportions and surfaces follow the supplied WeCom reference. */\n#bilioffice-root[data-theme="wecom"] {\n  --wc-canvas: var(--bo-panel);\n  --wc-info-width: clamp(190px, 12vw, 250px);\n  --wc-selected: var(--bo-accent);\n  --fs-hover: color-mix(in srgb, var(--bo-text) 4%, var(--bo-panel));\n  --fs-active: var(--wc-selected);\n  --wc-bubble: color-mix(in srgb, var(--bo-text) 9%, var(--bo-panel));\n}\n#bilioffice-root[data-theme="wecom"] .wc-icon {\n  display: block;\n  width: 20px;\n  height: 20px;\n  flex: none;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 1.65;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n#bilioffice-root[data-theme="wecom"] .bo-app-rail {\n  width: clamp(176px, 12vw, 248px);\n  align-items: stretch;\n  background: var(--bo-side);\n  border: 0;\n  padding-top: 9px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-brand {\n  height: 52px;\n  margin: 12px 20px 14px;\n  padding: 0;\n  gap: 12px;\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .bo-brand-icon {\n  width: 30px;\n  height: 30px;\n  display: grid;\n  place-items: center;\n  overflow: hidden;\n  border-radius: 4px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-brand-icon svg {\n  width: 100%;\n  height: 100%;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-brand::after {\n  content: "\u6797\u6C90";\n  font-size: 14px;\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav {\n  padding: 0 12px;\n  gap: 1px;\n  flex: 1;\n  min-height: 0;\n  max-height: none;\n  overflow-y: auto;\n  align-items: stretch;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav > button,\n#bilioffice-root[data-theme="wecom"] .bo-rail-static {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n  min-height: 35px;\n  height: 35px;\n  padding: 0 10px;\n  margin: 0;\n  border-radius: 6px;\n  color: var(--bo-text);\n  font-size: 14px;\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-static {\n  color: color-mix(in srgb, var(--bo-text) 85%, var(--bo-muted));\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-static .wc-icon {\n  color: #8394a8;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-static:hover {\n  background: transparent;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-label {\n  display: block;\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav > button.active {\n  color: var(--bo-accent);\n  background: var(--bo-accent2);\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-nav > button.active > .wc-icon {\n  fill: currentColor;\n  stroke-width: 1;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-footer {\n  flex-direction: row;\n  justify-content: flex-start;\n  padding: 8px 20px;\n  margin: 0;\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .bo-rail-footer button {\n  color: var(--bo-muted);\n  width: 30px;\n  height: 30px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-rail-badge {\n  margin-left: auto;\n}\n#bilioffice-root[data-theme="wecom"] .wc-group-label {\n  color: #8593a5;\n  font-size: 12px;\n  padding: 18px 10px 8px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-rail-groups .fs-filters {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  padding: 0;\n}\n#bilioffice-root[data-theme="wecom"] .wc-rail-groups .fs-filter {\n  min-height: 33px;\n  width: 100%;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 0 10px;\n  font-size: 13px;\n  border-radius: 5px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-filter[aria-pressed="true"] {\n  background: var(--bo-accent2);\n  color: var(--bo-accent);\n}\n#bilioffice-root[data-theme="wecom"] .fs-filter-count {\n  margin-left: auto;\n  color: var(--bo-muted);\n  background: color-mix(in srgb, var(--bo-text) 5%, transparent);\n  padding: 0 5px;\n  border-radius: 12px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-sidebar {\n  width: clamp(300px, 24vw, 480px);\n  min-height: 0;\n  background: var(--bo-panel);\n  overflow: hidden;\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-head {\n  height: 70px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 0 18px;\n  border-bottom: 1px solid var(--bo-border);\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-box {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  background: color-mix(in srgb, var(--bo-text) 4%, var(--bo-panel));\n  padding: 0 10px;\n  height: 36px;\n  min-width: 0;\n  flex: 1;\n  border-radius: 7px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .wc-conversation-search {\n  width: 100%;\n  min-width: 0;\n  padding: 0;\n  border: 0;\n  outline: 0;\n  background: transparent;\n  color: var(--bo-text);\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-box:focus-within {\n  box-shadow: 0 0 0 1px var(--bo-accent);\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-add {\n  width: 36px;\n  height: 36px;\n  display: grid;\n  place-items: center;\n  background: color-mix(in srgb, var(--bo-text) 4%, var(--bo-panel));\n  border-radius: 7px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-add[aria-expanded="true"] {\n  color: var(--bo-accent);\n}\n#bilioffice-root[data-theme="wecom"] .wc-search-tools {\n  padding: 12px 18px;\n  border-bottom: 1px solid var(--bo-border);\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .wc-video-search {\n  width: 100%;\n  max-width: none;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-video-search input {\n  flex: 1;\n  width: 0;\n  min-width: 0;\n  font-size: 12px;\n  border-radius: 4px;\n  padding: 7px;\n  background: var(--bo-panel);\n}\n#bilioffice-root[data-theme="wecom"] .wc-video-search button {\n  font-size: 11px;\n  padding: 4px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-browse-links {\n  flex: 1 1 100%;\n  display: flex;\n  gap: 14px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversations {\n  padding: 0 5px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation {\n  position: relative;\n  min-height: 79px;\n  gap: 14px;\n  padding: 14px;\n  border-radius: 6px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation::after {\n  content: "";\n  position: absolute;\n  bottom: 0;\n  left: 14px;\n  right: 14px;\n  height: 1px;\n  background: var(--bo-border);\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation.active {\n  color: white;\n  background: linear-gradient(\n    100deg,\n    var(--bo-accent),\n    color-mix(in srgb, var(--bo-accent) 80%, #85adff)\n  );\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation.active::after {\n  display: none;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation.active .fs-preview,\n#bilioffice-root[data-theme="wecom"]\n  .fs-conversation.active\n  .fs-conversation-meta {\n  color: #dceaff;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation-copy {\n  gap: 5px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation-copy strong {\n  font-size: 15px;\n  font-weight: 500;\n}\n#bilioffice-root[data-theme="wecom"] .fs-preview {\n  color: color-mix(in srgb, var(--bo-muted) 72%, var(--bo-panel));\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation-meta {\n  font-size: 11px;\n  color: var(--bo-muted);\n  align-self: stretch;\n  justify-content: space-between;\n  flex-direction: column-reverse;\n  padding: 4px 0;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation-meta .wc-icon {\n  width: 14px;\n  height: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-avatar,\n#bilioffice-root[data-theme="wecom"] .bo-avatar {\n  width: 34px;\n  height: 34px;\n  border-radius: 4px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-conversation > .fs-avatar {\n  width: 44px;\n  height: 44px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-avatar > svg,\n#bilioffice-root[data-theme="wecom"] .bo-avatar > svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n  border-radius: inherit;\n}\n#bilioffice-root[data-theme="wecom"] .fs-group-avatar {\n  padding: 2px;\n  gap: 1px;\n  border-radius: 5px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-group-avatar i {\n  padding: 0;\n  overflow: hidden;\n  opacity: 1;\n  border-radius: 1px;\n}\n#bilioffice-root[data-theme="wecom"] .fs-group-avatar svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n#bilioffice-root[data-theme="wecom"] .bo-header {\n  height: 70px;\n  padding: 0 22px;\n  background: var(--bo-panel);\n  width: calc(100% + var(--wc-info-width));\n  z-index: 2;\n}\n#bilioffice-root[data-theme="wecom"] .bo-header h1 {\n  font-size: 18px;\n  font-weight: 600;\n}\n#bilioffice-root[data-theme="wecom"] .bo-header-meta {\n  display: none;\n}\n#bilioffice-root[data-theme="wecom"] .bo-header-spacer {\n  flex: 1;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details-toggle {\n  padding: 8px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-chat,\n#bilioffice-root[data-theme="wecom"] .fs-history {\n  background: var(--bo-panel);\n  padding: 20px 20px 28px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-toolbar {\n  justify-content: flex-end;\n  gap: 12px;\n  min-height: 22px;\n  margin-bottom: 18px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-toolbar h2 {\n  margin-right: auto;\n  font-size: 11px;\n  font-weight: 400;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .bo-toolbar button {\n  font-size: 11px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .bo-message-content {\n  width: auto;\n  max-width: calc(100% - 46px);\n}\n#bilioffice-root[data-theme="wecom"] .bo-message,\n#bilioffice-root[data-theme="wecom"] .fs-message {\n  gap: 12px;\n  margin-bottom: 22px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-message-meta,\n#bilioffice-root[data-theme="wecom"] .fs-message-meta {\n  font-size: 12px;\n  color: var(--bo-muted);\n  margin-bottom: 5px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-message-meta strong {\n  font-weight: 400;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .bo-bubble,\n#bilioffice-root[data-theme="wecom"] .fs-text-bubble {\n  background: var(--wc-bubble);\n  border: 0;\n  border-radius: 6px;\n  box-shadow: none;\n  padding: 9px 12px;\n  font-size: 14px;\n  line-height: 1.65;\n  overflow-wrap: anywhere;\n}\n#bilioffice-root[data-theme="wecom"] .fs-self .fs-text-bubble {\n  background: var(--wc-bubble);\n  white-space: pre-wrap;\n}\n#bilioffice-root[data-theme="wecom"] .fs-self .fs-message-meta {\n  text-align: right;\n}\n#bilioffice-root[data-theme="wecom"] .wc-quoted-message {\n  margin: 2px 0 10px;\n  border-left: 3px solid color-mix(in srgb, var(--bo-muted) 25%, transparent);\n  padding: 0 9px;\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .wc-quoted-message strong {\n  display: block;\n  font-weight: 500;\n  margin-bottom: 3px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-video-card {\n  width: 460px;\n  max-width: 100%;\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-bubble:has(.bo-video-card) {\n  padding: 0;\n  background: transparent;\n}\n#bilioffice-root[data-theme="wecom"] .bo-card-info {\n  padding: 10px 12px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-card-info h3 {\n  font-size: 14px;\n  white-space: normal;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n}\n#bilioffice-root[data-theme="wecom"] .bo-stats {\n  font-size: 11px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-player-actions button {\n  font-size: 11px;\n  border: 0;\n}\n#bilioffice-root[data-theme="wecom"] .bo-cover .bo-play {\n  width: 38px;\n  height: 38px;\n  padding: 0;\n  font-size: 0;\n  border-radius: 50%;\n  background: #0009;\n  inset: 50% auto auto 50%;\n  transform: translate(-50%, -50%);\n}\n#bilioffice-root[data-theme="wecom"] .bo-cover .bo-play::after {\n  content: "\u25B6";\n  font-size: 16px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-info-panel {\n  display: block;\n  margin-top: 70px;\n  width: var(--wc-info-width);\n  padding: 0;\n  background: var(--bo-panel);\n  font-size: 13px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-info-panel details {\n  padding: 14px;\n  border-bottom: 1px solid var(--bo-border);\n}\n#bilioffice-root[data-theme="wecom"] .bo-info-panel summary {\n  cursor: pointer;\n  color: var(--bo-muted);\n  list-style: none;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n#bilioffice-root[data-theme="wecom"] .bo-info-panel summary::after {\n  content: "\u203A";\n  font-size: 20px;\n  line-height: 1;\n}\n#bilioffice-root[data-theme="wecom"]\n  .bo-info-panel\n  details[open]\n  summary::after {\n  transform: rotate(90deg);\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-document {\n  display: flex;\n  align-items: flex-start;\n  gap: 5px;\n  line-height: 1.8;\n  margin: 9px 0 0;\n  overflow-wrap: anywhere;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-document .wc-icon {\n  width: 16px;\n  height: 16px;\n  margin-top: 4px;\n  color: var(--bo-accent);\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-muted {\n  color: var(--bo-muted);\n  font-size: 12px;\n  line-height: 1.8;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-members {\n  padding: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-members h3 {\n  font-size: 12px;\n  font-weight: 400;\n  color: var(--bo-muted);\n  margin: 0 0 10px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-member {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  padding: 7px 0;\n  font-size: 13px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-member .wc-icon {\n  width: 16px;\n  height: 16px;\n  color: var(--bo-accent);\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-member small {\n  margin-left: auto;\n  font-size: 10px;\n  color: var(--bo-muted);\n  padding: 0 3px;\n  background: var(--fs-hover);\n}\n#bilioffice-root[data-theme="wecom"] .wc-contact-title {\n  display: block;\n  margin: 16px;\n  font-size: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-info-panel > .fs-avatar,\n#bilioffice-root[data-theme="wecom"] .bo-info-panel > p {\n  margin: 16px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-composer {\n  position: relative;\n  min-height: 180px;\n  padding: 52px 20px 42px;\n  flex: none;\n}\n#bilioffice-root[data-theme="wecom"] .wc-composer-tools {\n  position: absolute;\n  inset: 11px 20px auto;\n  display: flex;\n  align-items: center;\n  gap: 18px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .wc-composer-tools button {\n  display: grid;\n  place-items: center;\n  padding: 2px;\n  border-radius: 4px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-composer-tools button:hover {\n  color: var(--bo-accent);\n  background: var(--fs-hover);\n}\n#bilioffice-root[data-theme="wecom"] .wc-composer-shortcut {\n  margin-left: auto;\n  font-size: 10px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .bo-composer textarea {\n  resize: none;\n  min-width: 0;\n  flex: 1;\n  height: 78px;\n  border: 0;\n  outline: 0;\n  background: transparent;\n  color: var(--bo-text);\n  font: inherit;\n  line-height: 1.6;\n}\n#bilioffice-root[data-theme="wecom"] .bo-composer-send {\n  position: absolute;\n  right: 20px;\n  bottom: 12px;\n  height: 28px;\n  border-radius: 4px;\n  padding: 0 18px;\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="wecom"] .bo-composer-send:disabled {\n  opacity: 0.3;\n  cursor: default;\n}\n#bilioffice-root[data-theme="wecom"] .wc-emoji-picker {\n  position: absolute;\n  bottom: calc(100% + 6px);\n  left: 16px;\n  display: flex;\n  padding: 12px;\n  gap: 8px;\n  background: var(--bo-panel);\n  border: 1px solid var(--bo-border);\n  border-radius: 8px;\n  box-shadow: 0 4px 20px #0002;\n  z-index: 2;\n}\n#bilioffice-root[data-theme="wecom"] .wc-emoji-picker button {\n  padding: 3px;\n  font-size: 22px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details {\n  position: absolute;\n  z-index: 3;\n  right: 0;\n  top: 70px;\n  bottom: 0;\n  width: min(290px, 85vw);\n  padding: 24px;\n  background: var(--bo-panel);\n  border-left: 1px solid var(--bo-border);\n  box-shadow: -8px 0 24px #0001;\n  overflow: auto;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 14px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details > button {\n  padding: 7px 10px;\n  border-radius: 4px;\n  background: var(--bo-side);\n  font-size: 12px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details > button:first-child {\n  align-self: flex-end;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details p {\n  color: var(--bo-muted);\n  font-size: 12px;\n  margin: 0;\n  line-height: 1.8;\n}\n#bilioffice-root[data-theme="wecom"] .wc-details h4 {\n  margin: 10px 0 0;\n}\n#bilioffice-root[data-theme="wecom"] .wc-mobile-controls,\n#bilioffice-root[data-theme="wecom"] .wc-mobile-filters {\n  display: none;\n}\n@media (max-width: 1200px) {\n  #bilioffice-root[data-theme="wecom"] {\n    --wc-info-width: 0px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-info-panel {\n    display: none;\n  }\n}\n@media (max-width: 1000px) {\n  #bilioffice-root[data-theme="wecom"] .bo-app-rail {\n    width: 64px;\n    align-items: center;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-brand::after,\n  #bilioffice-root[data-theme="wecom"] .bo-rail-label,\n  #bilioffice-root[data-theme="wecom"] .bo-rail-static,\n  #bilioffice-root[data-theme="wecom"] .wc-rail-groups {\n    display: none;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-brand {\n    margin: 12px 0;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-nav {\n    width: 100%;\n    padding: 0 10px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-nav > button {\n    position: relative;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-rail-badge {\n    position: absolute;\n    right: 0;\n    top: -4px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-footer {\n    flex-direction: column;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-sidebar {\n    width: 270px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-mobile-filters {\n    display: flex;\n    padding: 8px 12px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-mobile-filters .wc-icon {\n    display: none;\n  }\n}\n@media (max-width: 600px) {\n  #bilioffice-root[data-theme="wecom"] .bo-app-rail {\n    display: none;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-sidebar {\n    width: min(320px, 88vw);\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-header {\n    padding: 0 12px;\n    height: 60px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-header h1 {\n    display: block;\n    font-size: 14px;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-chat,\n  #bilioffice-root[data-theme="wecom"] .fs-history {\n    padding: 16px 12px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-search-head {\n    padding: 0 12px;\n    gap: 6px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-search-head .bo-mobile-menu {\n    padding: 0 2px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-composer {\n    min-height: 140px;\n    padding: 45px 12px 40px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-composer textarea {\n    height: 52px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-composer-tools {\n    left: 12px;\n    right: 12px;\n    gap: 16px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-composer-shortcut {\n    display: none;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-mobile-controls {\n    display: flex;\n    flex: none;\n    gap: 16px;\n    padding: 12px 16px;\n    border-top: 1px solid var(--bo-border);\n    font-size: 12px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-details {\n    top: 60px;\n  }\n}\n\n#bilioffice-root[data-theme="wecom"].wc-hide-info {\n  --wc-info-width: 0px;\n}\n#bilioffice-root[data-theme="wecom"].wc-hide-info .bo-info-panel {\n  display: none;\n}\n#bilioffice-root[data-theme="wecom"] .wc-info-toggle {\n  padding: 8px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-mobile-filters {\n  flex-wrap: wrap;\n  gap: 2px;\n}\n#bilioffice-root[data-theme="wecom"] .wc-mobile-filters .fs-filter {\n  font-size: 11px;\n  padding: 4px;\n}\n@media (min-width: 1600px) {\n  #bilioffice-root[data-theme="wecom"] .bo-rail-nav > button,\n  #bilioffice-root[data-theme="wecom"] .bo-rail-static {\n    height: clamp(35px, 2.4vw, 48px);\n    min-height: clamp(35px, 2.4vw, 48px);\n    font-size: 17px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-label {\n    font-size: 17px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-brand {\n    margin: 22px 24px;\n    gap: 14px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-rail-brand::after {\n    font-size: 17px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-brand-icon {\n    width: 38px;\n    height: 38px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-rail-groups .fs-filter {\n    min-height: 39px;\n    font-size: 15px;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-conversation {\n    min-height: clamp(79px, 5.1vw, 104px);\n    gap: 18px;\n    padding: 18px;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-conversation-copy strong {\n    font-size: 18px;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-preview {\n    font-size: 15px;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-conversation-meta {\n    font-size: 13px;\n  }\n  #bilioffice-root[data-theme="wecom"] .fs-conversation > .fs-avatar {\n    width: 56px;\n    height: 56px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-search-head,\n  #bilioffice-root[data-theme="wecom"] .bo-header {\n    height: 88px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-info-panel {\n    margin-top: 88px;\n    font-size: 15px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-details {\n    top: 88px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-header h1 {\n    font-size: 22px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-search-box,\n  #bilioffice-root[data-theme="wecom"] .wc-search-add {\n    height: 44px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-search-add {\n    width: 44px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-conversation-search {\n    font-size: 18px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-chat,\n  #bilioffice-root[data-theme="wecom"] .fs-history {\n    padding: 24px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-bubble,\n  #bilioffice-root[data-theme="wecom"] .fs-text-bubble {\n    font-size: 16px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-avatar,\n  #bilioffice-root[data-theme="wecom"] .fs-message > .fs-avatar {\n    width: 42px;\n    height: 42px;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-message-meta,\n  #bilioffice-root[data-theme="wecom"] .fs-message-meta {\n    font-size: 14px;\n  }\n  #bilioffice-root[data-theme="wecom"] .wc-info-member {\n    font-size: 15px;\n    padding: 9px 0;\n  }\n  #bilioffice-root[data-theme="wecom"] .bo-composer {\n    min-height: 205px;\n  }\n}\n\n#bilioffice-root[data-theme="wecom"] .fs-group-avatar {\n  grid-template-columns: repeat(3, 1fr);\n}\n#bilioffice-root[data-theme="wecom"] .wc-compose-quote {\n  position: absolute;\n  top: 43px;\n  left: 20px;\n  right: 20px;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  background: var(--wc-bubble);\n  border-left: 3px solid var(--bo-accent);\n  border-radius: 3px;\n  padding: 7px 10px;\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root[data-theme="wecom"] .wc-compose-quote span {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  flex: 1;\n}\n#bilioffice-root[data-theme="wecom"] .bo-composer:has(.wc-compose-quote) {\n  padding-top: 90px;\n  min-height: 215px;\n}\n';

  // src/player/bridge.ts
  var CHANNEL = "bilioffice:v1";
  var parents = /* @__PURE__ */ new Set([
    "https://www.bilibili.com",
    "https://search.bilibili.com",
    "https://bilibili.com"
  ]);
  function bridgeParams() {
    const u = new URL(location.href);
    return {
      token: u.searchParams.get("boToken"),
      origin: u.searchParams.get("boParent")
    };
  }
  function validState(data) {
    return Number.isFinite(data.time) && data.time >= 0 && Number.isFinite(data.duration) && data.duration >= 0 && Number.isFinite(data.seekStart) && data.seekStart >= 0 && Number.isFinite(data.seekEnd) && data.seekEnd >= data.seekStart && typeof data.paused === "boolean";
  }
  function startBridge() {
    const { token, origin } = bridgeParams();
    if (!token || !origin || !parents.has(origin) || location.origin !== "https://www.bilibili.com" || !/^\/video\/BV\w+\/?$/.test(location.pathname))
      return () => {
      };
    const abort = new AbortController();
    let video = null, stopped = false, lastComments = "", attempted = false;
    const send = (type, data = {}) => parent.postMessage({ channel: CHANNEL, token, type, ...data }, origin);
    const style = document.createElement("style");
    style.textContent = `
    html,body{margin:0;background:#111;overflow:hidden}
    body>*{visibility:hidden}
    html body .bo-native-player{
      visibility:visible!important;position:fixed!important;inset:0!important;
      width:100vw!important;height:100vh!important;max-width:none!important;
      max-height:none!important;box-sizing:border-box!important;z-index:2147483646
    }
    .bo-native-player .bpx-player-sending-bar{display:none!important}
    .bo-native-player .bpx-player-video-area{height:100%!important}
    .bo-native-player:hover .bpx-player-control-entity,
    .bo-native-player:focus-within .bpx-player-control-entity,
    .bo-native-player:hover .bpx-player-control-mask,
    .bo-native-player:focus-within .bpx-player-control-mask{display:block!important}
    .bo-native-player:hover .bpx-player-control-bottom,
    .bo-native-player:focus-within .bpx-player-control-bottom,
    .bo-native-player:hover .bpx-player-control-mask,
    .bo-native-player:focus-within .bpx-player-control-mask{opacity:1!important}
  `;
    document.head.append(style);
    let detachVideo = () => {
    };
    const state = () => ({
      time: video && Number.isFinite(video.currentTime) ? Math.max(0, video.currentTime) : 0,
      duration: video && Number.isFinite(video.duration) ? Math.max(0, video.duration) : 0,
      paused: video?.paused ?? true,
      seekStart: video?.seekable.length ? video.seekable.start(0) : 0,
      seekEnd: video?.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0
    });
    const sendState = () => {
      if (video && !stopped) send("state", state());
    };
    const inspect = () => {
      if (stopped) return;
      const next = document.querySelector(
        ".bpx-player-container video,#bilibili-player video,video"
      );
      if (next && next !== video) {
        detachVideo();
        video = next;
        const nativeRoot = next.closest(
          ".bpx-player-container, #bilibili-player"
        );
        const root = nativeRoot || next;
        const hadControls = next.controls;
        if (!nativeRoot) next.controls = true;
        root.classList.add("bo-native-player");
        const events = [
          "loadedmetadata",
          "durationchange",
          "progress",
          "timeupdate",
          "seeking",
          "seeked",
          "play",
          "pause",
          "emptied"
        ];
        for (const event of events) next.addEventListener(event, sendState);
        detachVideo = () => {
          for (const event of events) next.removeEventListener(event, sendState);
          root.classList.remove("bo-native-player");
          if (!nativeRoot) next.controls = hadControls;
        };
        send("ready");
        if (!attempted) {
          attempted = true;
          video.play().catch((e) => send("blocked", { message: e.message }));
        }
      }
      sendState();
      const comments = readComments();
      const serialized = JSON.stringify(comments);
      if (serialized !== lastComments) {
        lastComments = serialized;
        send("comments", { comments });
      }
    };
    const onMessage = (e) => {
      if (e.origin !== origin || e.source !== parent || e.data?.channel !== CHANNEL || e.data?.token !== token)
        return;
      if (e.data.type === "comments:sync")
        send("comments", { comments: readComments() });
      if (e.data.type === "pause") video?.pause();
      if (e.data.type === "comments:more")
        loadMore(abort.signal).then(
          (comments) => send("comments", { comments }),
          (err) => send("comments:error", { message: err.message })
        );
    };
    const onKey = (e) => {
      if (e.key === "Escape") send("escape");
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey, true);
    const timer = setInterval(inspect, 650);
    inspect();
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      abort.abort();
      detachVideo();
      video?.pause();
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pagehide", cleanup);
      style.remove();
    };
    window.addEventListener("pagehide", cleanup, { once: true });
    return cleanup;
  }
  function validMessage(e, frame, token) {
    return e.origin === "https://www.bilibili.com" && e.source === frame.contentWindow && e.data?.channel === CHANNEL && e.data?.token === token && [
      "ready",
      "state",
      "blocked",
      "comments",
      "comments:error",
      "escape"
    ].includes(e.data?.type) && (e.data.type !== "state" || validState(e.data));
  }

  // src/player.ts
  var PlayerSession = class {
    constructor() {
      __publicField(this, "iframe", null);
      __publicField(this, "currentId", "");
      __publicField(this, "cleanup");
      __publicField(this, "more");
      __publicField(this, "sync");
    }
    mount(host, video, onStop, onComments, onCommentError, feishu = false) {
      this.stop();
      const token = crypto.randomUUID();
      this.currentId = video.id;
      const player = document.createElement("div");
      player.className = "bo-player";
      const frame = document.createElement("iframe");
      frame.title = `\u64AD\u653E\uFF1A${video.title}`;
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
      );
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      const url = new URL(originalVideo(video.id, video.part));
      url.searchParams.set("boToken", token);
      url.searchParams.set("boParent", location.origin);
      frame.src = url.href;
      player.append(frame);
      const status = document.createElement("div");
      status.className = "bo-player-status";
      status.setAttribute("role", "status");
      status.textContent = feishu ? "\u6B63\u5728\u52A0\u8F7D\u89C6\u9891\u2026" : "\u6B63\u5728\u52A0\u8F7D\u539F\u751F\u64AD\u653E\u5668\u2026";
      const actions = document.createElement("div");
      actions.className = "bo-player-actions";
      const button = (text, fn) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.onclick = fn;
        actions.append(b);
        return b;
      };
      let large = false;
      const backdrop = document.createElement("div");
      backdrop.className = "bo-player-backdrop";
      const zoom = button("\u653E\u5927", () => setLarge(!large));
      zoom.setAttribute("aria-label", "\u653E\u5927\u6216\u8FD8\u539F\u64AD\u653E\u5668");
      const setLarge = (value) => {
        large = value;
        player.classList.toggle("bo-expanded", value);
        backdrop.hidden = !value;
        zoom.textContent = value ? "\u8FD8\u539F" : "\u653E\u5927";
      };
      backdrop.hidden = true;
      backdrop.onclick = () => setLarge(false);
      button("\u5173\u95ED", () => this.stop());
      button(
        feishu ? "\u6253\u5F00\u89C6\u9891" : "\u539F\u7248\u89C6\u9891 / \u6536\u85CF / \u5173\u6CE8",
        () => openOriginal(video.url)
      );
      button("\u91CD\u8BD5", () => {
        ready = false;
        host.dataset.time = "0";
        host.dataset.paused = "true";
        host.dataset.duration = "0";
        status.textContent = feishu ? "\u6B63\u5728\u91CD\u65B0\u52A0\u8F7D\u89C6\u9891\u2026" : "\u6B63\u5728\u91CD\u65B0\u52A0\u8F7D\u539F\u751F\u64AD\u653E\u5668\u2026";
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!ready)
            status.textContent = feishu ? "\u89C6\u9891\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002" : "\u52A0\u8F7D\u8D85\u65F6\uFF0C\u53EF\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u7248\u89C6\u9891\u3002";
        }, 18e3);
        frame.src = url.href;
      });
      host.replaceChildren(player, status, actions, backdrop);
      this.iframe = frame;
      let ready = false;
      let timeout = setTimeout(() => {
        if (!ready)
          status.textContent = feishu ? "\u89C6\u9891\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002" : "\u52A0\u8F7D\u8D85\u65F6\u6216\u88AB\u539F\u7AD9\u9650\u5236\uFF0C\u53EF\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u7248\u89C6\u9891\u3002";
      }, 18e3);
      const handler = (e) => {
        if (!validMessage(e, frame, token)) return;
        switch (e.data.type) {
          case "ready":
            ready = true;
            clearTimeout(timeout);
            status.textContent = feishu ? "\u89C6\u9891\u5DF2\u51C6\u5907\u597D\uFF0C\u70B9\u51FB\u64AD\u653E\u5668\u64AD\u653E" : "\u539F\u751F\u64AD\u653E\u5668\u5DF2\u5C31\u7EEA\uFF1B\u4F7F\u7528\u64AD\u653E\u5668\u63A7\u5236\u64AD\u653E";
            break;
          case "state":
            if (!ready) break;
            host.dataset.time = String(e.data.time);
            host.dataset.paused = String(e.data.paused);
            host.dataset.duration = String(e.data.duration);
            break;
          case "blocked":
            status.textContent = "\u81EA\u52A8\u64AD\u653E\u88AB\u6D4F\u89C8\u5668\u963B\u6B62\uFF0C\u8BF7\u5728\u64AD\u653E\u5668\u4E2D\u70B9\u51FB\u64AD\u653E\u3002";
            break;
          case "comments":
            if (Array.isArray(e.data.comments)) onComments(e.data.comments);
            break;
          case "comments:error":
            onCommentError(String(e.data.message));
            break;
          case "escape":
            setLarge(false);
            break;
        }
      };
      const onKey = (e) => {
        if (e.key === "Escape") setLarge(false);
      };
      window.addEventListener("message", handler);
      window.addEventListener("keydown", onKey);
      this.sync = () => frame.contentWindow?.postMessage(
        { channel: CHANNEL, token, type: "comments:sync" },
        "https://www.bilibili.com"
      );
      this.more = () => frame.contentWindow?.postMessage(
        { channel: CHANNEL, token, type: "comments:more" },
        "https://www.bilibili.com"
      );
      this.cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        window.removeEventListener("keydown", onKey);
        frame.remove();
        backdrop.remove();
        host.replaceChildren();
        onStop();
      };
    }
    syncComments() {
      this.sync?.();
    }
    loadMore() {
      this.more?.();
    }
    stop() {
      const cleanup = this.cleanup;
      this.cleanup = void 0;
      this.more = void 0;
      this.sync = void 0;
      this.iframe = null;
      this.currentId = "";
      cleanup?.();
    }
    hide() {
      this.stop();
    }
  };

  // src/main.ts
  var el = (tag, cls = "", text = "") => {
    const node2 = document.createElement(tag);
    node2.className = cls;
    node2.textContent = text;
    return node2;
  };
  var App = class {
    constructor() {
      __publicField(this, "root", el("section"));
      __publicField(this, "chat", el("div", "bo-chat"));
      __publicField(this, "list", el("div"));
      __publicField(this, "header", el("header", "bo-header"));
      __publicField(this, "rail", el("aside", "bo-app-rail"));
      __publicField(this, "sidebar", el("aside", "bo-sidebar"));
      __publicField(this, "info", el("aside", "bo-info-panel"));
      __publicField(this, "heading", el("h1"));
      __publicField(this, "input", el("input"));
      __publicField(this, "settings", loadSettings());
      __publicField(this, "route", routeFromLocation());
      __publicField(this, "player", new PlayerSession());
      __publicField(this, "controller", new AbortController());
      __publicField(this, "life", new AbortController());
      __publicField(this, "panel", null);
      __publicField(this, "comments", []);
      __publicField(this, "commentList", null);
      __publicField(this, "commentStatus", null);
      __publicField(this, "cards", /* @__PURE__ */ new Map());
      __publicField(this, "disposed", false);
      __publicField(this, "request", 0);
      __publicField(this, "restoreHistory", () => {
      });
      __publicField(this, "lightbox", new Lightbox());
      __publicField(this, "workspace", new Workspace());
      __publicField(this, "nativeURL", location.href);
      __publicField(this, "autoPage", 1);
      __publicField(this, "autoPages", 1);
      __publicField(this, "autoLoading", false);
      __publicField(this, "autoStalledPages", 0);
      __publicField(this, "autoFailed", false);
    }
    init() {
      this.root.id = "bilioffice-root";
      this.root.dataset.version = "0.1.3";
      this.root.setAttribute("aria-label", "bilioffice \u529E\u516C\u804A\u5929\u754C\u9762");
      document.documentElement.classList.add("bilioffice-active");
      const style = el("style");
      style.id = "bilioffice-style";
      style.textContent = base_default + layout_default + modal_default + workspace_default + wecom_default;
      document.head.append(style);
      this.root.append(this.rail, this.sidebar);
      const main = el("main", "bo-main");
      main.append(this.header, this.chat);
      this.root.append(main, this.info);
      document.documentElement.append(this.root);
      const pauseNative = (event) => {
        if (event.target instanceof HTMLVideoElement && !this.root.contains(event.target))
          event.target.pause();
      };
      document.addEventListener("play", pauseNative, {
        capture: true,
        signal: this.life.signal
      });
      document.querySelectorAll("video").forEach((v) => v.pause());
      this.shell();
      this.apply();
      this.watchRoute();
      window.addEventListener("resize", () => this.maybeLoadNextPage(), {
        signal: this.life.signal
      });
      this.render();
    }
    button(text, fn, cls = "") {
      const b = el("button", cls, text);
      b.type = "button";
      b.onclick = fn;
      return b;
    }
    shell() {
      this.workspace.leave();
      const openSettings = this.panel;
      this.panel = null;
      this.header.replaceChildren();
      this.header.parentElement?.querySelector(".bo-composer")?.remove();
      this.input = el("input");
      this.rail.replaceChildren();
      const brand = el("div", "bo-rail-brand");
      brand.append(el("span", "bo-brand-icon", themes[this.settings.theme].icon));
      brand.title = "bilioffice";
      this.rail.append(brand);
      const nav = el("nav", "bo-rail-nav");
      const railLinks = this.settings.theme !== "dingtalk" ? [["\u2302", "home", "/"]] : [
        ["\u2302", "home", "/"],
        ["\u25A3", "popular", "/v/popular/all"],
        ["\u25C8", "section", "/c/tech/"]
      ];
      for (const [label, kind, url] of railLinks) {
        const b = this.button(
          label,
          () => kind === "section" ? location.assign(new URL(url, "https://www.bilibili.com").href) : this.navigate(url)
        );
        b.dataset.nav = kind;
        b.title = kind === "home" ? "\u63A8\u8350" : kind === "popular" ? "\u70ED\u95E8" : "\u79D1\u6280\u5206\u533A";
        b.append(
          el(
            "span",
            "bo-rail-label",
            kind === "home" ? "\u6D88\u606F" : kind === "popular" ? "\u70ED\u95E8" : "\u5206\u533A"
          )
        );
        if (this.settings.theme === "wecom")
          b.replaceChildren(
            wecomIcon("chat"),
            el("span", "bo-rail-label", "\u6D88\u606F")
          );
        nav.append(b);
      }
      const staticRail = this.settings.theme === "wecom" ? [] : this.settings.theme === "feishu" ? ["\u65E5\u5386", "\u5DE5\u4F5C\u53F0", "\u4E91\u6587\u6863", "\u77E5\u8BC6\u5E93", "\u4EFB\u52A1", "\u8054\u7CFB\u4EBA", "\u9879\u76EE"] : ["\u5DE5\u4F5C\u53F0", "\u65E5\u5386", "\u6587\u6863", "\u4F1A\u8BAE"];
      staticRail.forEach(
        (label) => nav.append(el("div", "bo-rail-static", label))
      );
      if (this.settings.theme === "wecom") {
        const nativeApps = [
          ["bot", "\u667A\u80FD\u52A9\u7406"],
          ["hash", "\u9891\u9053"],
          ["mail", "\u90AE\u4EF6"],
          ["doc", "\u6587\u6863"],
          ["calendar", "\u65E5\u7A0B"],
          ["check", "\u5F85\u529E"],
          ["meeting", "\u4F1A\u8BAE"],
          ["bot", "\u667A\u80FD\u673A\u5668\u4EBA"],
          ["grid", "\u5DE5\u4F5C\u53F0"],
          ["users", "\u901A\u8BAF\u5F55"],
          ["drive", "\u5FAE\u76D8"],
          ["upgrade", "\u9AD8\u7EA7\u529F\u80FD"]
        ];
        nativeApps.forEach(([icon, label], index) => {
          const item2 = el("div", "bo-rail-static");
          item2.append(wecomIcon(icon), el("span", "", label));
          if (index === 0) nav.prepend(item2);
          else nav.append(item2);
        });
        nav.append(el("div", "wc-rail-groups"));
      }
      this.rail.append(nav);
      const railFooter = el("div", "bo-rail-footer");
      railFooter.append(
        this.button("\u2699", () => this.toggleSettings(), "bo-rail-button"),
        this.button("\u21A9", () => this.original(), "bo-rail-button")
      );
      railFooter.querySelectorAll("button")[0].setAttribute("aria-label", "\u2699 \u8BBE\u7F6E");
      railFooter.querySelectorAll("button")[1].setAttribute("aria-label", "\u6062\u590D\u539F\u7248");
      if (this.settings.theme === "wecom") {
        const buttons = railFooter.querySelectorAll("button");
        buttons[0].replaceChildren(wecomIcon("settings"));
        buttons[1].replaceChildren(wecomIcon("back"));
      }
      this.rail.append(railFooter);
      this.sidebar.replaceChildren();
      const sidebarHead = el("div", "bo-sidebar-head");
      sidebarHead.append(
        el("strong", "", this.settings.theme === "feishu" ? "\u6D88\u606F" : "B\u7AD9\u6D88\u606F"),
        el("span", "", this.settings.theme === "feishu" ? "\u672A\u8BFB" : "\u2304")
      );
      const sidebarSearch = el("div", "bo-sidebar-search", "\u2315 \u641C\u7D22\u4F1A\u8BDD");
      const closeNav = this.button(
        "\u2039",
        () => this.sidebar.classList.remove("open"),
        "bo-mobile-menu"
      );
      closeNav.setAttribute("aria-label", "\u6536\u8D77\u5BFC\u822A");
      sidebarHead.append(closeNav);
      const conversation2 = el("div", "bo-conversation bo-conversation-active");
      conversation2.append(
        el("span", "bo-avatar", "B"),
        (() => {
          const copy = el("div", "bo-conversation-copy");
          copy.append(
            el(
              "strong",
              "",
              this.settings.theme === "feishu" ? "\u5185\u5BB9\u5206\u4EAB\u7FA4" : "\u89C6\u9891\u52A9\u624B"
            ),
            el(
              "span",
              "",
              this.settings.theme === "feishu" ? "\u6797\u6653\u96E8\uFF1A\u8FD9\u4E2A\u89C6\u9891\u633A\u6709\u610F\u601D" : "\u4EC5\u672C\u5730\u6D4F\u89C8"
            )
          );
          return copy;
        })(),
        el("time", "", "\u73B0\u5728")
      );
      const local = el("div", "bo-local-conversations");
      local.append(
        el("div", "bo-local-label", "\u6700\u8FD1\u4F1A\u8BDD"),
        ...[
          ["\u9996\u9875\u63A8\u8350", "\u89C6\u9891\u6D88\u606F", "\u73B0\u5728", ""],
          ["\u641C\u7D22\u7ED3\u679C", "\u641C\u7D22\u89C6\u9891", "\u6628\u5929", ""],
          ["\u89C6\u9891\u8BE6\u60C5", "\u89C6\u9891\u8BC4\u8BBA", "\u6628\u5929", ""],
          ["\u70ED\u95E8\u89C6\u9891", "\u70ED\u95E8\u5185\u5BB9", "\u6628\u5929", ""],
          ["\u79D1\u6280\u5206\u533A", "\u5206\u533A\u89C6\u9891", "\u6628\u5929", ""],
          ["\u7A0D\u540E\u89C2\u770B", "\u5F85\u89C2\u770B\u5185\u5BB9", "\u6628\u5929", ""],
          ["\u89C6\u9891\u52A9\u624B", "\u672C\u5730\u6D4F\u89C8", "\u6628\u5929", ""],
          ["\u8BC4\u8BBA\u540C\u6B65", "\u5DF2\u52A0\u8F7D\u8BC4\u8BBA", "\u6628\u5929", ""]
        ].map(([label, preview, time, unread]) => {
          const row = el("div", "bo-local-row");
          row.append(
            el("span", "bo-local-avatar", label.slice(0, 1)),
            (() => {
              const copy = el("div", "bo-local-copy");
              copy.append(el("strong", "", label), el("span", "", preview));
              return copy;
            })(),
            el("time", "", time)
          );
          if (unread) row.append(el("span", "bo-local-unread", unread));
          return row;
        })
      );
      const groupNav = el("nav", "bo-group-nav");
      const groupItems = [
        "\u6D88\u606F",
        "\u672A\u8BFB",
        "\u6807\u8BB0",
        "@\u6211",
        "\u7FA4\u804A",
        "\u5355\u804A",
        "\u6211\u7684\u4F01\u4E1A"
      ];
      groupItems.forEach((item2, index) => {
        const row = el(
          "div",
          `bo-group-row${index === 0 ? " active" : ""}`,
          item2
        );
        groupNav.append(row);
      });
      const conversationPane = el("div", "bo-conversation-pane");
      conversationPane.append(
        sidebarHead,
        groupNav,
        sidebarSearch,
        conversation2,
        local
      );
      this.sidebar.append(conversationPane);
      const menu = this.button(
        "\u2630",
        () => this.sidebar.classList.toggle("open"),
        "bo-mobile-menu"
      );
      menu.setAttribute("aria-label", "\u5C55\u5F00\u6216\u6536\u8D77\u5BFC\u822A");
      this.header.append(menu, this.heading);
      if (this.settings.theme !== "dingtalk")
        this.header.append(el("span", "bo-header-meta", "12 \u4EBA"));
      this.header.append(el("div", "bo-header-spacer"));
      const form = el("form", "bo-search");
      this.input.placeholder = "\u641C\u7D22\u89C6\u9891\uFF0CEnter \u63D0\u4EA4";
      this.input.setAttribute("aria-label", "\u641C\u7D22 B \u7AD9\u89C6\u9891");
      const submit = this.button("\u641C\u7D22", () => {
      });
      submit.type = "submit";
      const clear = this.button("\u6E05\u7A7A", () => {
        this.input.value = "";
        this.input.focus();
      });
      clear.className = "bo-clear";
      form.append(this.input, clear, submit);
      let composing = false;
      this.input.addEventListener("compositionstart", () => composing = true);
      this.input.addEventListener("compositionend", () => composing = false);
      this.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.isComposing || composing)) e.preventDefault();
      });
      form.onsubmit = (e) => {
        e.preventDefault();
        if (composing) return;
        const q = this.input.value.trim();
        if (q)
          this.navigate(
            `/search?keyword=${encodeURIComponent(q)}&page=1&order=totalrank`
          );
      };
      this.header.append(
        this.button("\u22EF", () => this.toggleSettings(), "bo-header-menu")
      );
      sidebarSearch.replaceChildren(form);
      if (this.settings.theme === "feishu") {
        form.classList.add("bo-rail-search");
        this.rail.insertBefore(form, nav);
      }
      const composer = el("form", "bo-composer");
      const composerInput = this.settings.theme === "wecom" ? el("textarea") : el("input");
      composerInput.placeholder = "\u8F93\u5165\u6D88\u606F\u2026";
      composerInput.setAttribute("aria-label", "\u6D88\u606F\u8F93\u5165");
      const composerButton = this.button("\u53D1\u9001", () => {
      }, "bo-composer-send");
      composerButton.type = "submit";
      if (this.settings.theme === "wecom") {
        composerInput.placeholder = "\u8F93\u5165\u6D88\u606F\u2026";
        const tools = el("div", "wc-composer-tools");
        for (const [icon, label, action] of [
          [
            "smile",
            "\u8868\u60C5",
            () => {
              const old = composer.querySelector(".wc-emoji-picker");
              if (old) {
                old.remove();
                return;
              }
              const picker = el("div", "wc-emoji-picker");
              picker.setAttribute("aria-label", "\u8868\u60C5\u9009\u62E9");
              for (const emoji of ["\u{1F642}", "\u{1F44D}", "\u{1F44C}", "\u{1F64F}", "\u{1F389}", "\u2615"])
                picker.append(
                  this.button(emoji, () => {
                    composerInput.value += emoji;
                    composerInput.dispatchEvent(new Event("input"));
                    composerInput.focus();
                    picker.remove();
                  })
                );
              composer.append(picker);
            }
          ],
          [
            "at",
            "\u63D0\u53CA\u6210\u5458",
            () => {
              composerInput.value += "@";
              composerInput.dispatchEvent(new Event("input"));
              composerInput.focus();
            }
          ],
          ["quote", "\u5F15\u7528\u6700\u65B0\u6D88\u606F", () => this.workspace.quoteLatest()],
          ["search", "\u67E5\u627E\u89C6\u9891", () => this.workspace.toggleVideoSearch()],
          ["folder", "\u7FA4\u8D44\u6599", () => this.workspace.toggleDetails()]
        ]) {
          const button = this.button("", action);
          button.title = label;
          button.setAttribute("aria-label", label);
          button.append(wecomIcon(icon));
          tools.append(button);
        }
        tools.append(
          el("span", "wc-composer-shortcut", "Enter \u53D1\u9001 \xB7 Shift + Enter \u6362\u884C")
        );
        composer.append(tools);
        composerInput.addEventListener("keydown", (event) => {
          if (!(event instanceof KeyboardEvent)) return;
          if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            composer.requestSubmit();
          }
        });
      }
      composer.append(composerInput, composerButton);
      composer.onsubmit = (event) => {
        event.preventDefault();
        if (this.settings.theme === "wecom") {
          this.workspace.send(composerInput.value);
          return;
        }
        composerInput.value = "";
        composerInput.placeholder = "\u8F93\u5165\u6D88\u606F\u2026";
      };
      this.header.parentElement?.append(composer);
      this.info.replaceChildren();
      const infoHead = el(
        "div",
        "bo-info-head",
        this.settings.theme === "feishu" ? "\u7FA4\u8BE6\u60C5" : "\u7FA4\u516C\u544A"
      );
      this.info.append(infoHead);
      const infoSections = this.settings.theme === "feishu" ? [
        ["\u7FA4\u516C\u544A", "OpenCode \u4EA4\u6D41\u4E0E\u89C6\u9891\u5206\u4EAB"],
        ["\u7FA4\u6587\u4EF6", "\u6682\u65E0\u6587\u4EF6"],
        ["\u7FA4\u6210\u5458", "11 \u4F4D\u6210\u5458"]
      ] : [
        ["\u7FA4\u516C\u544A", "B \u7AD9\u89C6\u9891\u5206\u4EAB\u4E0E\u8BC4\u8BBA"],
        ["\u7FA4\u770B\u677F", "\u6700\u8FD1\u89C6\u9891\u4E0E\u5206\u533A"],
        ["\u7FA4\u6210\u5458", "\u89C6\u9891\u52A9\u624B \xB7 \u672C\u5730\u4F1A\u8BDD"]
      ];
      for (const [title, value] of infoSections) {
        const section = el("section", "bo-info-section");
        section.append(
          el("div", "bo-info-title", title),
          el("div", "bo-info-value", value)
        );
        this.info.append(section);
      }
      if (openSettings) {
        this.root.append(openSettings);
        this.panel = openSettings;
      }
      if (this.settings.theme === "wecom") {
        form.classList.add("wc-video-search");
        this.rail.insertBefore(form, nav);
        const controls = el("div", "wc-mobile-controls");
        controls.append(
          this.button("\u754C\u9762\u8BBE\u7F6E", () => this.toggleSettings()),
          this.button("\u6062\u590D\u539F\u7248", () => this.original())
        );
        this.workspace.attach(
          this.sidebar,
          this.root,
          this.chat,
          this.heading,
          "wecom",
          form,
          controls
        );
        this.workspace.bindComposer(
          composerInput,
          composerButton
        );
        this.input.placeholder = "\u641C\u7D22\u89C6\u9891";
        const browse = el("div", "wc-browse-links");
        browse.append(
          this.button("\u9996\u9875\u63A8\u8350", () => this.navigate("/")),
          this.button("\u70ED\u95E8\u89C6\u9891", () => this.navigate("/v/popular/all"))
        );
        form.append(browse);
        this.workspace.onOpen = () => this.player.stop();
        const details = this.button(
          "\u2637",
          () => this.workspace.toggleDetails(),
          "wc-details-toggle"
        );
        details.setAttribute("aria-label", "\u4F1A\u8BDD\u8BE6\u60C5");
        details.setAttribute("aria-expanded", "false");
        const infoToggle = this.button(
          "",
          () => {
            if (window.innerWidth <= 1200) {
              this.workspace.toggleDetails();
              return;
            }
            const hidden = this.root.classList.toggle("wc-hide-info");
            infoToggle.setAttribute("aria-expanded", String(!hidden));
          },
          "wc-info-toggle"
        );
        infoToggle.setAttribute("aria-label", "\u5C55\u5F00\u6216\u6536\u8D77\u7FA4\u4FE1\u606F");
        infoToggle.setAttribute(
          "aria-expanded",
          String(!this.root.classList.contains("wc-hide-info"))
        );
        infoToggle.append(wecomIcon("list"));
        this.header.append(infoToggle);
        details.replaceChildren(wecomIcon("users"));
        this.header.append(details);
      }
      if (this.settings.theme === "feishu") {
        this.workspace.attach(this.sidebar, this.root, this.chat, this.heading);
        this.heading.textContent = "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41";
        this.input.placeholder = "\u641C\u7D22";
        this.input.value = this.route.query || "";
        this.root.querySelector(".bo-brand-icon").textContent = "\u6797";
      }
    }
    apply() {
      applyTheme(this.root, this.settings.theme, this.settings.appearance);
      this.root.classList.toggle("bo-hidden-media", this.settings.hideMedia);
      this.root.querySelector(".bo-brand-icon").textContent = this.settings.theme !== "dingtalk" ? "\u6797" : themes[this.settings.theme].icon;
      if (this.settings.theme === "wecom")
        this.root.querySelector(".bo-brand-icon").replaceChildren(wecomAvatar("\u6797\u6C90"));
      for (const avatar of this.root.querySelectorAll(
        "[data-avatar]"
      ))
        if (this.settings.theme === "wecom" && !this.settings.disguise)
          avatar.replaceChildren(
            wecomAvatar(
              avatar.closest(".bo-message")?.querySelector("[data-author]")?.dataset.author || avatar.dataset.avatar
            )
          );
        else
          avatar.textContent = this.settings.disguise ? "\u540C" : avatar.dataset.avatar;
      for (const node2 of this.root.querySelectorAll("[data-author]"))
        node2.textContent = this.settings.disguise ? "\u9879\u76EE\u540C\u4E8B" : node2.dataset.author;
    }
    toggleSettings() {
      if (this.panel) {
        this.panel.remove();
        this.panel = null;
        return;
      }
      const p = el("section", "bo-settings");
      p.setAttribute("aria-label", "\u754C\u9762\u8BBE\u7F6E");
      p.append(
        el("h3", "", "\u754C\u9762\u8BBE\u7F6E"),
        this.button("\u5173\u95ED", () => this.toggleSettings())
      );
      const choices = (title, key, options) => {
        const group = el("div", "bo-setting-group");
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", title);
        group.dataset.setting = key;
        group.append(el("div", "bo-setting-title", title));
        const optionsRow = el("div", "bo-setting-options");
        for (const [value, text] of options) {
          const option = this.button(
            text,
            () => {
              const previousTheme = this.settings.theme;
              this.settings = saveSettings({ [key]: value });
              if (key === "theme" && previousTheme !== this.settings.theme)
                this.shell();
              this.apply();
              if (key === "theme" && previousTheme !== this.settings.theme)
                void this.render();
              optionsRow.querySelectorAll("button").forEach(
                (b) => b.setAttribute(
                  "aria-pressed",
                  String(b.dataset.value === value)
                )
              );
            },
            "bo-setting-option"
          );
          option.dataset.value = value;
          option.setAttribute(
            "aria-pressed",
            String(value === this.settings[key])
          );
          optionsRow.append(option);
        }
        group.append(optionsRow);
        p.append(group);
      };
      choices("\u4E3B\u9898", "theme", [
        ["wecom", "\u4F01\u4E1A\u5FAE\u4FE1"],
        ["dingtalk", "\u9489\u9489"],
        ["feishu", "\u98DE\u4E66"]
      ]);
      choices("\u5916\u89C2", "appearance", [
        ["system", "\u8DDF\u968F\u7CFB\u7EDF"],
        ["light", "\u6D45\u8272"],
        ["dark", "\u6DF1\u8272"]
      ]);
      for (const [key, title] of [
        ["disguise", "\u5934\u50CF / \u4F1A\u8BDD\u540D\u4F2A\u88C5"],
        ["hideMedia", "\u9690\u85CF\u5A92\u4F53\u5E76\u505C\u6B62\u64AD\u653E"]
      ]) {
        const l = el("label", "", title), check = el("input");
        check.type = "checkbox";
        check.dataset.setting = key;
        check.checked = this.settings[key];
        check.onchange = () => {
          this.settings = saveSettings({ [key]: check.checked });
          if (key === "hideMedia" && check.checked) this.player.hide();
          this.apply();
        };
        l.append(check);
        p.append(l);
      }
      p.append(
        el(
          "p",
          "",
          "\u8BBE\u7F6E\u53EA\u6539\u53D8\u672C\u5730\u663E\u793A\uFF1B\u4E0D\u80FD\u9690\u85CF\u7F51\u7EDC\u8BBF\u95EE\u8BB0\u5F55\u3002\u8BC4\u8BBA\u3001\u6536\u85CF\u548C\u5173\u6CE8\u8BF7\u6253\u5F00\u539F\u7248\u64CD\u4F5C\u3002"
        ),
        el("p", "bo-version", `bilioffice v${"0.1.3"}`)
      );
      this.root.append(p);
      this.panel = p;
    }
    navigate(path) {
      const base = path === "/" || path.startsWith("/v/") || path.startsWith("/c/") ? "https://www.bilibili.com" : location.href;
      const u = new URL(path, base);
      if (u.origin !== location.origin) {
        location.href = u.href;
        return;
      }
      history.pushState({}, "", u.pathname + u.search);
      this.sidebar.classList.remove("open");
    }
    watchRoute() {
      const push = history.pushState, replace = history.replaceState;
      const change = () => {
        const next = routeFromLocation();
        if (JSON.stringify(next) !== JSON.stringify(this.route)) {
          this.route = next;
          this.render();
        }
      };
      history.pushState = function(...args) {
        push.apply(history, args);
        change();
      };
      history.replaceState = function(...args) {
        replace.apply(history, args);
        change();
      };
      const wrappedPush = history.pushState, wrappedReplace = history.replaceState;
      this.restoreHistory = () => {
        if (history.pushState === wrappedPush) history.pushState = push;
        if (history.replaceState === wrappedReplace)
          history.replaceState = replace;
      };
      window.addEventListener("popstate", change, { signal: this.life.signal });
      window.addEventListener("pagehide", () => this.destroy(), {
        signal: this.life.signal
      });
    }
    async render() {
      if (this.settings.theme !== "dingtalk") this.workspace.showFeed();
      this.player.stop();
      this.lightbox.close();
      this.controller.abort();
      this.controller = new AbortController();
      const signal = this.controller.signal;
      const serial = ++this.request;
      this.autoPage = this.route.page || 1;
      this.autoPages = 1;
      this.autoLoading = false;
      this.autoStalledPages = 0;
      this.autoFailed = false;
      this.cards.clear();
      this.comments = [];
      this.commentList = null;
      this.commentStatus = null;
      this.input.value = this.route.query || "";
      this.heading.textContent = {
        home: this.settings.theme === "feishu" ? "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41" : "\u63A8\u8350\u4F1A\u8BDD",
        popular: this.settings.theme === "feishu" ? "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41" : "\u70ED\u95E8\u89C6\u9891",
        section: this.settings.theme === "feishu" ? "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41" : "\u5206\u533A\u89C6\u9891",
        search: this.settings.theme === "feishu" ? "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41" : "\u641C\u7D22\u7ED3\u679C",
        video: this.settings.theme === "feishu" ? "\u4EA7\u54C1\u4F53\u9A8C\u4EA4\u6D41" : "\u89C6\u9891\u4F1A\u8BDD"
      }[this.route.kind];
      if (this.settings.theme === "wecom")
        this.heading.textContent = "\u4EA7\u54C1\u7814\u53D1\u4EA4\u6D41\u7FA4";
      this.root.querySelectorAll("[data-nav]").forEach(
        (b) => b.classList.toggle(
          "active",
          this.settings.theme === "wecom" ? b.dataset.nav === "home" : b.dataset.nav === this.route.kind
        )
      );
      this.chat.replaceChildren();
      const toolbar = el("div", "bo-toolbar");
      toolbar.append(
        el(
          "h2",
          "",
          this.route.kind === "search" ? `\u201C${this.route.query || ""}\u201D` : this.settings.theme === "feishu" ? "\u4ECA\u5929" : "\u4ECA\u5929 \xB7 \u89C6\u9891\u6D88\u606F"
        )
      );
      toolbar.append(
        this.settings.theme === "feishu" ? this.button("\u21BB", () => this.render(), "bo-icon-action") : this.button("\u8FD4\u56DE\u63A8\u8350", () => this.navigate("/")),
        this.settings.theme === "feishu" ? this.button("\u22EF", () => {
        }, "bo-icon-action") : this.button("\u5237\u65B0", () => this.render())
      );
      if (this.route.kind === "search") {
        const sort = el("select");
        sort.setAttribute("aria-label", "\u641C\u7D22\u6392\u5E8F");
        for (const [value, label] of [
          ["totalrank", "\u7EFC\u5408\u6392\u5E8F"],
          ["click", "\u6700\u591A\u64AD\u653E"],
          ["pubdate", "\u6700\u65B0\u53D1\u5E03"],
          ["dm", "\u6700\u591A\u5F39\u5E55"],
          ["stow", "\u6700\u591A\u6536\u85CF"]
        ]) {
          const opt = el("option", "", label);
          opt.value = value;
          sort.append(opt);
        }
        sort.value = this.route.order || "totalrank";
        sort.onchange = () => this.navigate(
          `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=1&order=${sort.value}`
        );
        toolbar.append(sort);
      }
      this.chat.append(toolbar);
      const status = el("div", "bo-status", "\u6B63\u5728\u7B49\u5F85\u65B0\u7ED3\u679C\u2026");
      status.setAttribute("role", "status");
      this.list = el("div");
      if (this.settings.theme !== "dingtalk") {
        const intro = el("div", "fs-feed-intro");
        for (const message of this.workspace.conversations.find(
          (c) => c.id === "share"
        ).messages) {
          const row = el("div", `fs-message${message.self ? " fs-self" : ""}`);
          const avatar = el(
            "span",
            "fs-avatar",
            message.self && this.settings.theme === "wecom" ? "\u6797" : message.author.slice(0, 1)
          );
          avatar.style.setProperty("--fs-avatar-color", "#528ac7");
          if (this.settings.theme === "wecom")
            avatar.replaceChildren(
              wecomAvatar(message.self ? "\u6797\u6C90" : message.author)
            );
          const body = el("div", "fs-message-body");
          body.append(
            el("div", "fs-message-meta", `${message.author}\u3000${message.time}`),
            el("div", "fs-text-bubble", message.text)
          );
          if (message.quote && this.settings.theme === "wecom") {
            const quote = el("blockquote", "wc-quoted-message");
            quote.append(
              el("strong", "", `${message.quote.author}\uFF1A`),
              el("div", "", message.quote.text)
            );
            body.querySelector(".fs-text-bubble").prepend(quote);
          }
          row.append(avatar, body);
          intro.append(row);
        }
        this.chat.append(intro);
      }
      this.chat.append(status, this.list);
      try {
        if (this.route.kind === "video") {
          const v = await getVideo(
            this.route.videoId,
            this.route.part || 1,
            signal
          );
          if (signal.aborted || serial !== this.request) return;
          this.sync([v]);
          this.renderComments(readComments());
          status.remove();
          return;
        }
        const result = await fetchVideos(this.route, signal);
        if (signal.aborted || serial !== this.request) return;
        status.remove();
        if (!result.items.length)
          this.list.append(
            el("div", "bo-empty", "\u6682\u65E0\u7ED3\u679C\u3002\u53EF\u4EE5\u66F4\u6362\u5173\u952E\u8BCD\u6216\u8FD4\u56DE\u63A8\u8350\u3002")
          );
        else this.sync(result.items);
        this.autoPages = result.items.length ? result.pages : this.autoPage;
        this.chat.addEventListener("scroll", () => this.maybeLoadNextPage(), {
          signal
        });
        this.updatePagination();
        this.queueAutoLoad(signal);
      } catch (e) {
        if (signal.aborted) return;
        status.textContent = `\u52A0\u8F7D\u5931\u8D25\uFF1A${e.message}`;
        status.append(
          this.button("\u91CD\u8BD5", () => this.render()),
          this.button("\u6253\u5F00\u539F\u7248", () => this.original()),
          this.button(
            "\u5728\u539F\u7AD9\u52A0\u8F7D\u540E\u7EE7\u7EED",
            () => location.assign(this.originalURL())
          )
        );
      }
    }
    updatePagination() {
      let pager = this.chat.querySelector(".bo-pagination");
      if (!pager && this.autoPages <= 1) return;
      if (!pager) {
        pager = el("div", "bo-pagination");
        this.chat.append(pager);
      }
      const prev = this.button("\u4E0A\u4E00\u9875", () => this.page(this.autoPage - 1));
      const next = this.button("\u4E0B\u4E00\u9875", () => this.page(this.autoPage + 1));
      prev.disabled = this.autoPage <= 1;
      next.disabled = this.autoPage >= this.autoPages;
      pager.replaceChildren(
        prev,
        el(
          "span",
          "",
          this.route.kind === "search" ? `\u7B2C ${this.autoPage} / ${this.autoPages} \u9875` : `\u5DF2\u52A0\u8F7D\u81F3\u7B2C ${this.autoPage} \u9875`
        ),
        next
      );
    }
    queueAutoLoad(signal) {
      requestAnimationFrame(() => {
        if (!signal.aborted) this.maybeLoadNextPage();
      });
    }
    maybeLoadNextPage() {
      if (this.autoLoading || this.autoFailed || !this.chat.clientHeight || this.route.kind === "video" || this.autoPage >= this.autoPages || this.chat.scrollTop + this.chat.clientHeight < this.chat.scrollHeight - 280)
        return;
      void this.loadNextPage();
    }
    async loadNextPage() {
      if (this.autoLoading || this.autoPage >= this.autoPages) return;
      const signal = this.controller.signal;
      this.autoLoading = true;
      this.autoFailed = false;
      const nextPage = this.autoPage + 1;
      const loading = el("div", "bo-auto-loading", "\u6B63\u5728\u52A0\u8F7D\u66F4\u591A\u6D88\u606F\u2026");
      this.list.querySelector(".bo-auto-loading")?.remove();
      this.list.append(loading);
      let loaded = false;
      try {
        const result = await fetchVideos(
          { ...this.route, page: nextPage },
          signal
        );
        if (signal.aborted) return;
        const before = this.cards.size;
        if (this.route.kind === "home" && !this.list.querySelector(".bo-feed-source")) {
          this.list.append(
            el("div", "bo-day bo-feed-source", "\u7EE7\u7EED\u6D4F\u89C8 \xB7 \u70ED\u95E8\u89C6\u9891")
          );
        }
        this.sync(result.items);
        this.autoStalledPages = this.cards.size === before ? this.autoStalledPages + 1 : 0;
        this.autoPage = nextPage;
        this.autoPages = !result.items.length || this.autoStalledPages >= 2 ? nextPage : result.pages;
        this.updatePagination();
        loaded = true;
      } catch {
        if (!signal.aborted) {
          this.autoFailed = true;
          loading.textContent = "\u52A0\u8F7D\u66F4\u591A\u5931\u8D25";
          loading.append(
            this.button("\u91CD\u8BD5\u52A0\u8F7D\u66F4\u591A", () => {
              void this.loadNextPage();
            })
          );
          return;
        }
      } finally {
        if (!signal.aborted) {
          this.autoLoading = false;
          if (loaded) {
            loading.remove();
            this.queueAutoLoad(signal);
          }
        }
      }
    }
    page(page) {
      if (this.route.kind === "home" && page === 1) {
        void this.render();
        return;
      }
      this.navigate(
        this.route.kind === "search" ? `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=${page}&order=${this.route.order || "totalrank"}` : `/v/popular/all?pn=${this.route.kind === "home" ? Math.max(1, page - 1) : page}`
      );
    }
    sync(items) {
      for (const v of items) {
        const found = this.cards.get(v.id);
        if (found) {
          found.title.textContent = v.title;
          continue;
        }
        const node2 = this.card(v);
        this.cards.set(v.id, { node: node2, title: node2.querySelector("h3") });
        this.list.append(node2);
        if (this.route.kind !== "video") {
          const message = interludeAfter(this.cards.size);
          if (message) {
            const row = el("article", "bo-message bo-local-message");
            const avatar = el("span", "bo-avatar");
            avatar.dataset.avatar = message.author.slice(0, 1);
            avatar.textContent = this.settings.disguise ? "\u540C" : avatar.dataset.avatar;
            if (this.settings.theme === "wecom" && !this.settings.disguise)
              avatar.replaceChildren(wecomAvatar(message.author));
            const content = el("div", "bo-message-content");
            const meta = el("div", "bo-message-meta");
            const author = el(
              "strong",
              "",
              this.settings.disguise ? "\u9879\u76EE\u540C\u4E8B" : message.author
            );
            author.dataset.author = message.author;
            meta.append(author, el("time", "", message.time));
            content.append(meta, el("div", "bo-bubble", message.text));
            row.append(avatar, content);
            this.list.append(row);
          }
        }
      }
    }
    title(node2, title) {
      const query = this.route.query || "";
      if (!query) {
        node2.textContent = title;
        return;
      }
      const index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
      if (index < 0) {
        node2.textContent = title;
        return;
      }
      node2.replaceChildren(
        document.createTextNode(title.slice(0, index)),
        el("mark", "", title.slice(index, index + query.length)),
        document.createTextNode(title.slice(index + query.length))
      );
    }
    card(v) {
      const row = el("article", "bo-message");
      row.dataset.videoId = v.id;
      const feishuSpeakers = ["\u6797\u6653\u96E8", "\u738B\u6668", "\u9648\u601D\u8FDC", "\u5468\u5B81"];
      const speaker = this.settings.theme !== "dingtalk" ? feishuSpeakers[this.cards.size % feishuSpeakers.length] : v.author.name;
      const avatar = el(
        "span",
        "bo-avatar",
        this.settings.disguise ? "\u540C" : this.settings.theme !== "dingtalk" ? speaker.slice(0, 1) : v.author.name.slice(0, 1)
      );
      avatar.dataset.avatar = this.settings.theme !== "dingtalk" ? speaker.slice(0, 1) : v.author.name.slice(0, 1);
      if (this.settings.theme === "wecom" && !this.settings.disguise)
        avatar.replaceChildren(wecomAvatar(speaker));
      const content = el("div", "bo-message-content"), meta = el("div", "bo-message-meta");
      const author = el(
        "strong",
        "",
        this.settings.disguise ? "\u9879\u76EE\u540C\u4E8B" : speaker
      );
      author.dataset.author = speaker;
      meta.append(
        author,
        el(
          "span",
          "",
          this.settings.theme !== "dingtalk" ? messageTime(this.cards.size) : v.published || "\u89C6\u9891\u5206\u4EAB"
        )
      );
      const bubble = el("div", "bo-bubble"), card = el("div", "bo-video-card"), cover = el("div", "bo-cover");
      const img = el("img");
      img.alt = `${v.title} \u5C01\u9762`;
      img.referrerPolicy = "no-referrer";
      img.onload = () => cover.dataset.loaded = "true";
      img.onerror = () => {
        img.dataset.error = "true";
        img.hidden = true;
        placeholder.textContent = "\u5C01\u9762\u52A0\u8F7D\u5931\u8D25";
      };
      const placeholder = el(
        "span",
        "bo-cover-placeholder",
        v.cover ? "\u5C01\u9762\u52A0\u8F7D\u4E2D" : "\u6682\u65E0\u5C01\u9762"
      );
      img.hidden = !v.cover;
      if (v.cover) img.src = v.cover;
      const play = this.button("\u25B6 \u64AD\u653E", () => start(), "bo-play");
      play.setAttribute("aria-label", `\u64AD\u653E ${v.title}`);
      cover.append(img, placeholder, play);
      const info = el("div", "bo-card-info"), heading = el("h3");
      this.title(heading, v.title);
      info.append(
        heading,
        el(
          "div",
          "bo-stats",
          this.settings.theme !== "dingtalk" ? `${v.duration || "03:12"} \xB7 \u89C6\u9891\u6D88\u606F` : `\u64AD\u653E ${v.views || "\u2014"}\u3000\u65F6\u957F ${v.duration || "\u2014"}`
        )
      );
      card.append(cover, info);
      const controls = el("div", "bo-player-actions");
      controls.append(
        this.button(
          this.settings.theme !== "dingtalk" ? "\u6253\u5F00\u89C6\u9891" : "\u539F\u7248\u89C6\u9891 / \u8BC4\u8BBA",
          () => openOriginal(v.url)
        )
      );
      bubble.append(card, controls);
      content.append(meta, bubble);
      row.append(avatar, content);
      const start = () => {
        if (this.settings.hideMedia) return;
        const host = el("div", "bo-inline-player");
        this.player.mount(
          host,
          v,
          () => {
            host.remove();
            card.hidden = false;
          },
          (comments) => this.renderComments(comments),
          (message) => {
            if (this.commentStatus) this.commentStatus.textContent = message;
          },
          this.settings.theme !== "dingtalk"
        );
        card.hidden = true;
        bubble.prepend(host);
        this.renderComments([]);
      };
      cover.addEventListener("click", (e) => {
        if (e.target !== play) start();
      });
      return row;
    }
    renderComments(comments) {
      this.comments = comments;
      if (!this.commentList) {
        const area = el("section", "bo-comments");
        area.append(el("h3", "", "\u5F53\u524D\u5DF2\u52A0\u8F7D\u8BC4\u8BBA"));
        const actions = el("div", "bo-player-actions");
        actions.append(
          this.button(
            "\u540C\u6B65\u5DF2\u52A0\u8F7D",
            () => this.player.iframe ? this.player.syncComments() : this.renderComments(readComments())
          ),
          this.button("\u52A0\u8F7D\u66F4\u591A", () => {
            if (this.commentStatus)
              this.commentStatus.textContent = "\u6B63\u5728\u7B49\u5F85\u539F\u7AD9\u8BC4\u8BBA\u53D8\u5316\u2026";
            if (this.player.iframe) this.player.loadMore();
            else {
              const signal = this.controller.signal;
              loadMore(signal).then(
                (c) => {
                  if (!signal.aborted) this.renderComments(c);
                },
                (e) => {
                  if (!signal.aborted && this.commentStatus)
                    this.commentStatus.textContent = e.message;
                }
              );
            }
          }),
          this.button("\u5BFC\u51FA\u5DF2\u52A0\u8F7D", () => exportComments(this.comments))
        );
        this.commentStatus = el("div", "bo-status");
        this.commentStatus.setAttribute("role", "status");
        this.commentList = el("div");
        area.append(actions, this.commentStatus, this.commentList);
        this.chat.append(area);
      }
      this.commentStatus.textContent = comments.length ? `${comments.length} \u6761\u4E3B\u8BC4\u8BBA\uFF1B\u5305\u542B\u5F53\u524D\u53EF\u89C1\u697C\u4E2D\u697C\u3002` : "\u539F\u7AD9\u8BC4\u8BBA\u5C1A\u672A\u52A0\u8F7D\u3002\u64AD\u653E\u540E\u540C\u6B65\uFF0C\u6216\u6253\u5F00\u539F\u7248\u52A0\u8F7D\uFF1B\u53D1\u9001\u8BC4\u8BBA\u4F1A\u5728\u539F\u7AD9\u771F\u5B9E\u53D1\u5E03\u3002";
      const render = (c) => {
        const a = el("article", "bo-comment");
        a.append(
          el("strong", "", c.author.name),
          el("span", "bo-stats", c.time),
          el("p", "", c.text)
        );
        for (const src of c.images) {
          const link = el("a", "", "\u67E5\u770B\u56FE\u7247");
          link.href = src;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.onclick = (e) => {
            e.preventDefault();
            this.lightbox.open(src);
          };
          a.append(link);
        }
        for (const r of c.replies) {
          const reply = render(r);
          reply.classList.add("bo-reply");
          a.append(reply);
        }
        return a;
      };
      this.commentList.replaceChildren(...comments.map(render));
    }
    originalURL() {
      return this.route.kind === "search" ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(this.route.query || "")}&page=${this.route.page || 1}&order=${this.route.order || "totalrank"}` : location.href;
    }
    original() {
      this.settings = saveSettings({ enabled: false });
      this.destroy();
      if (this.nativeURL !== location.href) {
        const target = this.route.kind === "search" ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(this.route.query || "")}&page=${this.route.page || 1}&order=${this.route.order || "totalrank"}` : location.href;
        location.assign(target);
      } else showEnable();
    }
    destroy() {
      if (this.disposed) return;
      this.disposed = true;
      this.controller.abort();
      this.lightbox.close();
      this.life.abort();
      this.restoreHistory();
      this.player.stop();
      this.root.remove();
      document.getElementById("bilioffice-style")?.remove();
      document.documentElement.classList.remove("bilioffice-active");
      window.__bilioffice = void 0;
    }
  };
  function showEnable() {
    if (document.getElementById("bilioffice-enable")) return;
    const b = el("button", "", "\u542F\u7528 bilioffice");
    b.id = "bilioffice-enable";
    b.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#1677ff;color:#fff;border:0;border-radius:8px;padding:12px;cursor:pointer";
    b.onclick = () => {
      saveSettings({ enabled: true });
      b.remove();
      boot();
    };
    document.documentElement.append(b);
  }
  function boot() {
    window.__bilioffice?.destroy();
    if (window.top !== window.self) {
      if (bridgeParams().token) {
        window.__biliofficeBridgeCleanup?.();
        window.__biliofficeBridgeCleanup = startBridge();
      }
      return;
    }
    if (!["www.bilibili.com", "search.bilibili.com", "bilibili.com"].includes(
      location.hostname
    ))
      return;
    if (!/^\/$|^\/video\/BV\w+\/?$|^\/search$|^\/all$|^\/(c|v|channel)\//.test(
      location.pathname
    ))
      return;
    if (!loadSettings().enabled) {
      showEnable();
      return;
    }
    const app = new App();
    window.__bilioffice = {
      destroy: () => app.destroy(),
      refresh: () => app.render(),
      openSettings: () => {
        if (!app.panel) app.toggleSettings();
      }
    };
    app.init();
  }
  function registerMenu() {
    if (window.top !== window.self || typeof GM_registerMenuCommand !== "function" || window.__biliofficeMenuRegistered)
      return;
    window.__biliofficeMenuRegistered = true;
    for (const theme of ["feishu", "wecom", "dingtalk"]) {
      GM_registerMenuCommand(
        `\u5207\u6362\u5230${themes[theme].name} \xB7 v${"0.1.3"}`,
        () => {
          saveSettings({ theme, enabled: true });
          document.getElementById("bilioffice-enable")?.remove();
          boot();
        }
      );
    }
    GM_registerMenuCommand(`\u6253\u5F00\u754C\u9762\u8BBE\u7F6E \xB7 v${"0.1.3"}`, () => {
      if (!window.__bilioffice) {
        saveSettings({ enabled: true });
        document.getElementById("bilioffice-enable")?.remove();
        boot();
      }
      window.__bilioffice?.openSettings();
    });
  }
  registerMenu();
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

})();
