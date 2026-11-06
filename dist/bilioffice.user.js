// ==UserScript==
// @name         bilioffice · B站办公聊天界面
// @namespace    https://github.com/penn0312/bilibiliOffice
// @version      0.1.0
// @description  用企业微信、钉钉或飞书的聊天界面浏览 B 站，支持内联播放与搜索。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://bilibili.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
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
        accent: "#008a43",
        accent2: "#dff8e9",
        side: "#f5f7f8",
        bubble: "#e9f8ee",
        panel: "#ffffff",
        border: "#dfe5e8",
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
  var base_default = '#bilioffice-root {\n  --bo-accent: var(--bo-theme-accent);\n  --bo-accent2: var(--bo-theme-accent2);\n  --bo-side: var(--bo-theme-side);\n  --bo-bubble: var(--bo-theme-bubble);\n  --bo-panel: var(--bo-theme-panel);\n  --bo-border: var(--bo-theme-border);\n  --bo-text: var(--bo-theme-text);\n  --bo-muted: var(--bo-theme-muted);\n  --bo-radius: 12px;\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: flex;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n  font:\n    14px/1.5 -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    "PingFang SC",\n    sans-serif;\n}\n#bilioffice-root[data-appearance="dark"] {\n  --bo-panel: #1f2329;\n  --bo-side: #17191c;\n  --bo-bubble: #2a3139;\n  --bo-border: #3b424a;\n  --bo-text: #f2f3f5;\n  --bo-muted: #aeb4bc;\n}\n#bilioffice-root[data-appearance="system"] {\n  color-scheme: light dark;\n}\n@media (prefers-color-scheme: dark) {\n  #bilioffice-root[data-appearance="system"] {\n    --bo-panel: #1f2329;\n    --bo-side: #17191c;\n    --bo-bubble: #2a3139;\n    --bo-border: #3b424a;\n    --bo-text: #f2f3f5;\n    --bo-muted: #aeb4bc;\n  }\n}\n#bilioffice-root * {\n  box-sizing: border-box;\n}\n#bilioffice-root button,\n#bilioffice-root input,\n#bilioffice-root select {\n  font: inherit;\n}\n#bilioffice-root button {\n  border: 0;\n  background: none;\n  color: inherit;\n  cursor: pointer;\n}\n#bilioffice-root .bo-sidebar {\n  width: 240px;\n  background: var(--bo-side);\n  border-right: 1px solid var(--bo-border);\n  display: flex;\n  flex-direction: column;\n  flex: none;\n}\n#bilioffice-root .bo-brand {\n  padding: 20px 18px 14px;\n  font-size: 18px;\n  font-weight: 700;\n  display: flex;\n  align-items: center;\n  gap: 9px;\n}\n#bilioffice-root .bo-brand small {\n  font-size: 11px;\n  color: var(--bo-muted);\n  font-weight: 500;\n}\n#bilioffice-root .bo-nav {\n  padding: 6px 10px;\n}\n#bilioffice-root .bo-nav button {\n  display: flex;\n  width: 100%;\n  align-items: center;\n  gap: 10px;\n  text-align: left;\n  padding: 10px 12px;\n  border-radius: 8px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-nav button.active,\n#bilioffice-root .bo-nav button:hover {\n  background: var(--bo-accent2);\n  color: var(--bo-accent);\n  font-weight: 600;\n}\n#bilioffice-root .bo-section-title {\n  padding: 18px 18px 7px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-conversation {\n  margin: 0 10px;\n  padding: 10px 8px;\n  display: flex;\n  gap: 9px;\n  align-items: center;\n  border-radius: 8px;\n  background: var(--bo-accent2);\n}\n#bilioffice-root .bo-avatar {\n  width: 34px;\n  height: 34px;\n  border-radius: 10px;\n  object-fit: cover;\n  background: var(--bo-accent2);\n  display: grid;\n  place-items: center;\n  flex: none;\n}\n#bilioffice-root .bo-conversation strong {\n  display: block;\n  font-size: 13px;\n}\n#bilioffice-root .bo-conversation span {\n  font-size: 11px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-sidebar-footer {\n  margin-top: auto;\n  padding: 12px;\n  border-top: 1px solid var(--bo-border);\n  display: flex;\n  gap: 6px;\n}\n#bilioffice-root .bo-sidebar-footer button {\n  flex: 1;\n  padding: 7px 4px;\n  border-radius: 7px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-sidebar-footer button:hover {\n  background: var(--bo-accent2);\n  color: var(--bo-accent);\n}\n#bilioffice-root .bo-main {\n  min-width: 0;\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  background: var(--bo-panel);\n}\n#bilioffice-root .bo-header {\n  height: 62px;\n  border-bottom: 1px solid var(--bo-border);\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  padding: 0 22px;\n  flex: none;\n}\n#bilioffice-root .bo-header h1 {\n  font-size: 16px;\n  margin: 0;\n}\n#bilioffice-root .bo-header .bo-search {\n  margin-left: auto;\n  max-width: 420px;\n  flex: 1;\n  position: relative;\n}\n#bilioffice-root .bo-search input {\n  width: 100%;\n  border: 1px solid var(--bo-border);\n  background: var(--bo-side);\n  border-radius: 8px;\n  padding: 9px 36px 9px 12px;\n  outline: none;\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-search input:focus {\n  border-color: var(--bo-accent);\n}\n#bilioffice-root .bo-search button {\n  position: absolute;\n  right: 5px;\n  top: 4px;\n  padding: 5px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-chat {\n  flex: 1;\n  overflow: auto;\n  padding: 24px max(22px, calc((100% - 900px) / 2));\n  background: color-mix(in srgb, var(--bo-panel) 92%, var(--bo-side));\n}\n#bilioffice-root .bo-day {\n  text-align: center;\n  color: var(--bo-muted);\n  font-size: 11px;\n  margin: 0 0 18px;\n}\n#bilioffice-root .bo-message {\n  display: flex;\n  gap: 10px;\n  margin: 0 0 24px;\n  align-items: flex-start;\n}\n#bilioffice-root .bo-message.self {\n  flex-direction: row-reverse;\n}\n#bilioffice-root .bo-message-content {\n  max-width: min(760px, calc(100% - 48px));\n  min-width: 0;\n}\n#bilioffice-root .bo-message-meta {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  color: var(--bo-muted);\n  font-size: 12px;\n  margin: 0 0 5px;\n}\n#bilioffice-root .bo-message-meta strong {\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-bubble {\n  background: var(--bo-bubble);\n  border: 1px solid color-mix(in srgb, var(--bo-border) 60%, transparent);\n  border-radius: 4px 12px 12px 12px;\n  padding: 12px;\n  box-shadow: 0 1px 2px #00000008;\n}\n#bilioffice-root .bo-bubble h3 {\n  margin: 0 0 7px;\n  font-size: 15px;\n}\n#bilioffice-root .bo-bubble p {\n  margin: 7px 0;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-video-card {\n  width: min(620px, 100%);\n  border-radius: 10px;\n  overflow: hidden;\n  background: var(--bo-panel);\n  border: 1px solid var(--bo-border);\n}\n#bilioffice-root .bo-cover {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 16/9;\n  background: linear-gradient(135deg, var(--bo-accent2), var(--bo-side));\n  overflow: hidden;\n}\n#bilioffice-root .bo-cover img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}\n#bilioffice-root .bo-cover .bo-cover-placeholder {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-cover img[data-error="true"] {\n  display: none;\n}\n#bilioffice-root .bo-cover .bo-play {\n  position: absolute;\n  inset: auto auto 12px 12px;\n  background: var(--bo-accent);\n  color: #fff;\n  border-radius: 999px;\n  width: 38px;\n  height: 38px;\n  box-shadow: 0 2px 9px #0004;\n}\n#bilioffice-root .bo-card-info {\n  padding: 11px 13px;\n}\n#bilioffice-root .bo-card-info h3 {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#bilioffice-root .bo-stats {\n  display: flex;\n  gap: 12px;\n  color: var(--bo-muted);\n  font-size: 12px;\n}\n#bilioffice-root .bo-player {\n  position: relative;\n  aspect-ratio: 16/9;\n  background: #111;\n  border-radius: 8px;\n  overflow: hidden;\n}\n#bilioffice-root .bo-player iframe {\n  width: 100%;\n  height: 100%;\n  border: 0;\n  display: block;\n}\n#bilioffice-root .bo-player-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 7px;\n  padding: 7px 0 0;\n}\n#bilioffice-root .bo-player-actions button {\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  padding: 5px 9px;\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-player-actions button:hover {\n  color: var(--bo-accent);\n  border-color: var(--bo-accent);\n}\n#bilioffice-root .bo-status {\n  padding: 20px;\n  text-align: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-status button {\n  margin-top: 9px;\n  background: var(--bo-accent);\n  color: #fff;\n  border-radius: 6px;\n  padding: 7px 12px;\n}\n#bilioffice-root .bo-comments {\n  margin-top: 18px;\n  border-top: 1px solid var(--bo-border);\n  padding-top: 12px;\n}\n#bilioffice-root .bo-comment {\n  padding: 9px 0;\n  border-bottom: 1px solid color-mix(in srgb, var(--bo-border) 65%, transparent);\n}\n#bilioffice-root .bo-comment .bo-comment-body {\n  margin-left: 43px;\n}\n#bilioffice-root .bo-comment p {\n  margin: 3px 0;\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-reply {\n  margin: 6px 0 0 14px;\n  padding-left: 10px;\n  border-left: 2px solid var(--bo-border);\n}\n#bilioffice-root .bo-toolbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 14px;\n  gap: 8px;\n}\n#bilioffice-root .bo-toolbar h2 {\n  font-size: 18px;\n  margin: 0;\n}\n#bilioffice-root .bo-toolbar select {\n  padding: 6px 9px;\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n}\n#bilioffice-root .bo-pagination {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  margin: 18px 0;\n}\n#bilioffice-root .bo-pagination button {\n  border: 1px solid var(--bo-border);\n  border-radius: 6px;\n  padding: 6px 10px;\n}\n#bilioffice-root .bo-pagination button[disabled] {\n  opacity: 0.45;\n  cursor: default;\n}\n#bilioffice-root .bo-empty {\n  padding: 50px 0;\n  text-align: center;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-settings {\n  position: absolute;\n  right: 20px;\n  top: 58px;\n  background: var(--bo-panel);\n  border: 1px solid var(--bo-border);\n  box-shadow: 0 10px 30px #0002;\n  border-radius: 10px;\n  padding: 14px;\n  width: 270px;\n  z-index: 3;\n}\n#bilioffice-root .bo-settings h3 {\n  margin: 0 0 10px;\n}\n#bilioffice-root .bo-settings label {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 8px 0;\n  border-bottom: 1px solid var(--bo-border);\n  font-size: 13px;\n}\n#bilioffice-root .bo-settings select {\n  background: var(--bo-side);\n  color: var(--bo-text);\n  border: 1px solid var(--bo-border);\n  border-radius: 5px;\n  padding: 4px;\n}\n#bilioffice-root .bo-settings input {\n  accent-color: var(--bo-accent);\n}\n#bilioffice-root .bo-hidden-media .bo-cover,\n#bilioffice-root .bo-hidden-media .bo-player {\n  display: none;\n}\n#bilioffice-root .bo-lightbox {\n  position: fixed;\n  inset: 0;\n  background: #000b;\n  display: grid;\n  place-items: center;\n  z-index: 5;\n}\n#bilioffice-root .bo-lightbox img {\n  max-width: 90vw;\n  max-height: 90vh;\n}\n#bilioffice-root .bo-mobile-menu {\n  display: none;\n}\n@media (max-width: 800px) {\n  #bilioffice-root .bo-sidebar {\n    width: 190px;\n  }\n  #bilioffice-root .bo-chat {\n    padding: 18px 12px;\n  }\n  #bilioffice-root .bo-header {\n    padding: 0 12px;\n  }\n  #bilioffice-root .bo-header .bo-search {\n    max-width: none;\n  }\n  #bilioffice-root .bo-message-content {\n    max-width: calc(100% - 42px);\n  }\n}\n@media (max-width: 600px) {\n  #bilioffice-root .bo-sidebar {\n    position: absolute;\n    inset: 0 auto 0 0;\n    width: 240px;\n    z-index: 4;\n    transform: translateX(-100%);\n    transition: transform 0.2s;\n  }\n  #bilioffice-root .bo-sidebar.open {\n    transform: none;\n  }\n  #bilioffice-root .bo-mobile-menu {\n    display: block;\n    font-size: 19px;\n  }\n  #bilioffice-root .bo-header h1 {\n    font-size: 14px;\n  }\n  #bilioffice-root .bo-bubble {\n    padding: 9px;\n  }\n  #bilioffice-root .bo-chat {\n    padding: 14px 9px;\n  }\n}\n';

  // src/styles/layout.css
  var layout_default = 'html.bilioffice-active {\n  overflow: hidden;\n}\n#bilioffice-root [hidden] {\n  display: none;\n}\n#bilioffice-root button:focus-visible,\n#bilioffice-root a:focus-visible {\n  outline: 2px solid var(--bo-accent);\n  outline-offset: 3px;\n}\n#bilioffice-root .bo-search {\n  display: flex;\n  gap: 4px;\n  max-width: 500px;\n}\n#bilioffice-root .bo-search input {\n  padding-right: 8px;\n  min-width: 40px;\n}\n#bilioffice-root .bo-search button {\n  position: static;\n  flex: none;\n  white-space: nowrap;\n}\n#bilioffice-root .bo-video-card {\n  width: 560px;\n  max-width: 100%;\n}\n#bilioffice-root .bo-cover img {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  max-width: none;\n  max-height: none;\n  margin: 0;\n  object-fit: cover;\n}\n#bilioffice-root .bo-cover-placeholder {\n  pointer-events: none;\n}\n#bilioffice-root .bo-cover[data-loaded="true"] .bo-cover-placeholder {\n  display: none;\n}\n#bilioffice-root .bo-cover .bo-play {\n  width: auto;\n  padding: 8px 15px;\n  z-index: 1;\n}\n#bilioffice-root .bo-player-backdrop {\n  position: fixed;\n  inset: 0;\n  background: #000b;\n  z-index: 7;\n}\n#bilioffice-root .bo-player.bo-expanded {\n  position: fixed;\n  inset: 10vh 5vw 15vh;\n  width: 90vw;\n  height: 75vh;\n  aspect-ratio: auto;\n  z-index: 8;\n}\n#bilioffice-root .bo-inline-player:has(.bo-expanded) > .bo-player-actions {\n  position: fixed;\n  bottom: 6vh;\n  right: 5vw;\n  z-index: 9;\n  background: var(--bo-panel);\n  padding: 8px;\n  border-radius: 8px;\n}\n#bilioffice-root .bo-player-status {\n  font-size: 12px;\n  color: var(--bo-muted);\n  padding: 8px 2px;\n}\n#bilioffice-root .bo-settings p {\n  font-size: 12px;\n  color: var(--bo-muted);\n}\n#bilioffice-root .bo-bubble {\n  min-width: 0;\n}\n#bilioffice-root .bo-comments {\n  margin: 20px 0 0 44px;\n  max-width: 720px;\n}\n#bilioffice-root .bo-toolbar {\n  flex-wrap: wrap;\n}\n#bilioffice-root .bo-status {\n  white-space: pre-wrap;\n}\n#bilioffice-root .bo-status button {\n  margin: 8px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-sidebar {\n  width: 210px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-avatar {\n  border-radius: 50%;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-bubble {\n  border-radius: 14px;\n  box-shadow: 0 3px 12px #1677ff10;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-chat {\n  padding-top: 16px;\n}\n#bilioffice-root[data-theme="dingtalk"] .bo-message {\n  margin-bottom: 16px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-sidebar {\n  width: 270px;\n  border-left: 56px solid var(--bo-accent2);\n}\n#bilioffice-root[data-theme="feishu"] .bo-bubble {\n  background: var(--bo-panel);\n  border-radius: 6px;\n  box-shadow: none;\n}\n#bilioffice-root[data-theme="feishu"] .bo-avatar {\n  border-radius: 7px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-nav button {\n  padding: 7px 10px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-header {\n  height: 70px;\n}\n#bilioffice-root[data-theme="feishu"] .bo-message {\n  margin-bottom: 28px;\n}\n#bilioffice-root[data-appearance="dark"] .bo-nav button.active,\n#bilioffice-root[data-appearance="dark"] .bo-conversation {\n  background: #283850;\n}\n#bilioffice-root mark {\n  background: #ffe599;\n  color: #242424;\n}\n#bilioffice-root .bo-message-content {\n  width: min(680px, calc(100% - 48px));\n}\n#bilioffice-root .bo-inline-player {\n  width: 560px;\n  max-width: 100%;\n}\n@media (max-width: 600px) {\n  #bilioffice-root[data-theme] .bo-sidebar {\n    width: 240px;\n  }\n  #bilioffice-root .bo-header {\n    gap: 6px;\n  }\n  #bilioffice-root .bo-header h1 {\n    display: none;\n  }\n  #bilioffice-root .bo-player-actions {\n    flex-wrap: wrap;\n  }\n  #bilioffice-root .bo-settings {\n    right: 8px;\n    width: 270px;\n  }\n  #bilioffice-root .bo-comments {\n    margin-left: 0;\n  }\n}\n\n@media (prefers-color-scheme: dark) {\n  #bilioffice-root[data-appearance="system"] .bo-nav button.active,\n  #bilioffice-root[data-appearance="system"] .bo-conversation {\n    background: #283850;\n  }\n}\n';

  // src/styles/modal.css
  var modal_default = "#bilioffice-root .bo-image-dialog {\n  border: 1px solid var(--bo-border);\n  border-radius: 12px;\n  background: var(--bo-panel);\n  color: var(--bo-text);\n  max-width: 95vw;\n  max-height: 95vh;\n  padding: 12px;\n}\n#bilioffice-root .bo-image-dialog::backdrop {\n  background: #000b;\n}\n#bilioffice-root .bo-image-dialog img {\n  display: block;\n  max-width: 85vw;\n  max-height: 80vh;\n  object-fit: contain;\n}\n#bilioffice-root .bo-image-dialog button {\n  display: block;\n  padding: 8px;\n  margin: auto;\n}\n";

  // src/adapters/bilibili.ts
  var initialPath = location.pathname;
  var initialURL = new URL(location.href);
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
        cover: safeURL(img?.currentSrc || img?.dataset.src || img?.src || ""),
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
      cover: safeURL(v.pic || ""),
      author: {
        name: plain(v.owner?.name || v.author || "B\u7AD9\u7528\u6237"),
        avatar: safeURL(v.owner?.face || "")
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
    const native = route.kind === "home" && initialPath === "/" || route.kind === "section" && initialPath === route.path ? await waitNative(signal) : [];
    if ((route.kind === "home" || route.kind === "section") && native.length)
      return { items: native, total: native.length, pages: 1 };
    if (route.kind === "section")
      throw Error("\u5F53\u524D\u5206\u533A\u672A\u91C7\u96C6\u5230\u539F\u7AD9\u5217\u8868\uFF0C\u8BF7\u4F7F\u7528\u539F\u7248\u52A0\u8F7D\u540E\u91CD\u8BD5\u3002");
    const data = await api(
      `/x/web-interface/popular?ps=20&pn=${route.page || 1}`,
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
  function startBridge() {
    const { token, origin } = bridgeParams();
    if (!token || !origin || !parents.has(origin) || location.origin !== "https://www.bilibili.com" || !/^\/video\/BV\w+\/?$/.test(location.pathname))
      return () => {
      };
    const abort = new AbortController();
    let video = null, stopped = false, lastComments = "", attempted = false;
    const send = (type, data = {}) => parent.postMessage({ channel: CHANNEL, token, type, ...data }, origin);
    const style = document.createElement("style");
    style.textContent = "html,body{margin:0;background:#111;overflow:hidden}body>*{visibility:hidden}#bilibili-player,.bpx-player-container{visibility:visible;position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646}#bilibili-player *,.bpx-player-container *{visibility:visible}";
    document.head.append(style);
    const inspect = () => {
      if (stopped) return;
      const next = document.querySelector(
        ".bpx-player-container video,#bilibili-player video,video"
      );
      if (next && next !== video) {
        video = next;
        send("ready");
        if (!attempted) {
          attempted = true;
          video.play().catch((e) => send("blocked", { message: e.message }));
        }
      }
      if (video) send("state", { time: video.currentTime, paused: video.paused });
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
    document.addEventListener("keydown", onKey);
    const timer = setInterval(inspect, 650);
    inspect();
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      abort.abort();
      video?.pause();
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey);
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
    ].includes(e.data?.type);
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
    mount(host, video, onStop, onComments, onCommentError) {
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
      status.textContent = "\u6B63\u5728\u52A0\u8F7D\u539F\u751F\u64AD\u653E\u5668\u2026";
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
      button("\u539F\u7248\u89C6\u9891 / \u6536\u85CF / \u5173\u6CE8", () => openOriginal(video.url));
      button("\u91CD\u8BD5", () => {
        ready = false;
        status.textContent = "\u6B63\u5728\u91CD\u65B0\u52A0\u8F7D\u539F\u751F\u64AD\u653E\u5668\u2026";
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!ready) status.textContent = "\u52A0\u8F7D\u8D85\u65F6\uFF0C\u53EF\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u7248\u89C6\u9891\u3002";
        }, 18e3);
        frame.src = url.href;
      });
      host.replaceChildren(player, status, actions, backdrop);
      this.iframe = frame;
      let ready = false;
      let timeout = setTimeout(() => {
        if (!ready)
          status.textContent = "\u52A0\u8F7D\u8D85\u65F6\u6216\u88AB\u539F\u7AD9\u9650\u5236\uFF0C\u53EF\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u7248\u89C6\u9891\u3002";
      }, 18e3);
      const handler = (e) => {
        if (!validMessage(e, frame, token)) return;
        switch (e.data.type) {
          case "ready":
            ready = true;
            clearTimeout(timeout);
            status.textContent = "\u539F\u751F\u64AD\u653E\u5668\u5DF2\u5C31\u7EEA\uFF1B\u4F7F\u7528\u64AD\u653E\u5668\u63A7\u5236\u64AD\u653E";
            break;
          case "state":
            host.dataset.time = String(e.data.time);
            host.dataset.paused = String(e.data.paused);
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
    const node = document.createElement(tag);
    node.className = cls;
    node.textContent = text;
    return node;
  };
  var App = class {
    constructor() {
      __publicField(this, "root", el("section"));
      __publicField(this, "chat", el("div", "bo-chat"));
      __publicField(this, "list", el("div"));
      __publicField(this, "header", el("header", "bo-header"));
      __publicField(this, "sidebar", el("aside", "bo-sidebar"));
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
      __publicField(this, "nativeURL", location.href);
    }
    init() {
      this.root.id = "bilioffice-root";
      this.root.setAttribute("aria-label", "bilioffice \u529E\u516C\u804A\u5929\u754C\u9762");
      document.documentElement.classList.add("bilioffice-active");
      const style = el("style");
      style.id = "bilioffice-style";
      style.textContent = base_default + layout_default + modal_default;
      document.head.append(style);
      this.root.append(this.sidebar);
      const main = el("main", "bo-main");
      main.append(this.header, this.chat);
      this.root.append(main);
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
      this.render();
    }
    button(text, fn, cls = "") {
      const b = el("button", cls, text);
      b.type = "button";
      b.onclick = fn;
      return b;
    }
    shell() {
      const brand = el("div", "bo-brand");
      brand.append(
        el("span", "bo-brand-icon", themes[this.settings.theme].icon),
        el("strong", "", "bilioffice")
      );
      const closeNav = this.button(
        "\u2039",
        () => this.sidebar.classList.remove("open"),
        "bo-mobile-menu"
      );
      closeNav.setAttribute("aria-label", "\u6536\u8D77\u5BFC\u822A");
      brand.append(closeNav);
      this.sidebar.append(brand, el("div", "bo-section-title", "\u5DE5\u4F5C\u7A7A\u95F4 \xB7 B\u7AD9"));
      const nav = el("nav", "bo-nav");
      for (const [label, kind, url] of [
        ["\u2302 \u63A8\u8350", "home", "/"],
        ["\u25A3 \u70ED\u95E8", "popular", "/v/popular/all"],
        ["\u25C8 \u79D1\u6280\u5206\u533A", "section", "/c/tech/"]
      ]) {
        const b = this.button(
          label,
          () => kind === "section" ? location.assign(new URL(url, "https://www.bilibili.com").href) : this.navigate(url)
        );
        b.dataset.nav = kind;
        nav.append(b);
      }
      this.sidebar.append(nav, el("div", "bo-section-title", "\u89C6\u9891\u4F1A\u8BDD"));
      const conv = el("div", "bo-conversation");
      conv.append(
        el("span", "bo-avatar", "B"),
        el("div", "", "\u89C6\u9891\u52A9\u624B \xB7 \u4EC5\u672C\u5730\u6D4F\u89C8")
      );
      this.sidebar.append(conv);
      const footer = el("div", "bo-sidebar-footer");
      footer.append(
        this.button("\u2699 \u8BBE\u7F6E", () => this.toggleSettings()),
        this.button("\u6062\u590D\u539F\u7248", () => this.original())
      );
      this.sidebar.append(footer);
      const menu = this.button(
        "\u2630",
        () => this.sidebar.classList.toggle("open"),
        "bo-mobile-menu"
      );
      menu.setAttribute("aria-label", "\u5C55\u5F00\u6216\u6536\u8D77\u5BFC\u822A");
      this.header.append(menu, this.heading);
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
      this.header.append(form);
    }
    apply() {
      applyTheme(this.root, this.settings.theme, this.settings.appearance);
      this.root.classList.toggle("bo-hidden-media", this.settings.hideMedia);
      this.root.querySelector(".bo-brand-icon").textContent = themes[this.settings.theme].icon;
      for (const avatar of this.root.querySelectorAll(
        "[data-avatar]"
      ))
        avatar.textContent = this.settings.disguise ? "\u540C" : avatar.dataset.avatar;
      for (const node of this.root.querySelectorAll("[data-author]"))
        node.textContent = this.settings.disguise ? "\u9879\u76EE\u540C\u4E8B" : node.dataset.author;
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
      const select = (title, key, options) => {
        const label = el("label", "", title);
        const s = el("select");
        s.dataset.setting = key;
        for (const [value, text] of options) {
          const o = el("option", "", text);
          o.value = value;
          s.append(o);
        }
        s.value = this.settings[key];
        s.onchange = () => {
          this.settings = saveSettings({ [key]: s.value });
          this.apply();
        };
        label.append(s);
        p.append(label);
      };
      select("\u4E3B\u9898", "theme", [
        ["wecom", "\u4F01\u4E1A\u5FAE\u4FE1"],
        ["dingtalk", "\u9489\u9489"],
        ["feishu", "\u98DE\u4E66"]
      ]);
      select("\u5916\u89C2", "appearance", [
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
        )
      );
      this.header.append(p);
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
      this.player.stop();
      this.lightbox.close();
      this.controller.abort();
      this.controller = new AbortController();
      const signal = this.controller.signal;
      const serial = ++this.request;
      this.cards.clear();
      this.comments = [];
      this.commentList = null;
      this.commentStatus = null;
      this.input.value = this.route.query || "";
      this.heading.textContent = {
        home: "\u63A8\u8350\u4F1A\u8BDD",
        popular: "\u70ED\u95E8\u89C6\u9891",
        section: "\u5206\u533A\u89C6\u9891",
        search: "\u641C\u7D22\u7ED3\u679C",
        video: "\u89C6\u9891\u4F1A\u8BDD"
      }[this.route.kind];
      this.root.querySelectorAll("[data-nav]").forEach(
        (b) => b.classList.toggle("active", b.dataset.nav === this.route.kind)
      );
      this.chat.replaceChildren();
      const toolbar = el("div", "bo-toolbar");
      toolbar.append(
        el(
          "h2",
          "",
          this.route.kind === "search" ? `\u201C${this.route.query || ""}\u201D` : "\u4ECA\u5929 \xB7 \u89C6\u9891\u6D88\u606F"
        )
      );
      toolbar.append(
        this.button("\u8FD4\u56DE\u63A8\u8350", () => this.navigate("/")),
        this.button("\u5237\u65B0", () => this.render())
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
        if (result.pages > 1) {
          const pager = el("div", "bo-pagination");
          const page = this.route.page || 1;
          const prev = this.button("\u4E0A\u4E00\u9875", () => this.page(page - 1)), next = this.button("\u4E0B\u4E00\u9875", () => this.page(page + 1));
          prev.disabled = page <= 1;
          next.disabled = page >= result.pages;
          pager.append(
            prev,
            el("span", "", `\u7B2C ${page} / ${result.pages} \u9875`),
            next
          );
          this.chat.append(pager);
        }
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
    page(page) {
      this.navigate(
        this.route.kind === "search" ? `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=${page}&order=${this.route.order || "totalrank"}` : `/v/popular/all?pn=${page}`
      );
    }
    sync(items) {
      for (const v of items) {
        const found = this.cards.get(v.id);
        if (found) {
          found.title.textContent = v.title;
          continue;
        }
        const node = this.card(v);
        this.cards.set(v.id, { node, title: node.querySelector("h3") });
        this.list.append(node);
      }
    }
    title(node, title) {
      const query = this.route.query || "";
      if (!query) {
        node.textContent = title;
        return;
      }
      const index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
      if (index < 0) {
        node.textContent = title;
        return;
      }
      node.replaceChildren(
        document.createTextNode(title.slice(0, index)),
        el("mark", "", title.slice(index, index + query.length)),
        document.createTextNode(title.slice(index + query.length))
      );
    }
    card(v) {
      const row = el("article", "bo-message");
      row.dataset.videoId = v.id;
      const avatar = el(
        "span",
        "bo-avatar",
        this.settings.disguise ? "\u540C" : v.author.name.slice(0, 1)
      );
      avatar.dataset.avatar = v.author.name.slice(0, 1);
      const content = el("div", "bo-message-content"), meta = el("div", "bo-message-meta");
      const author = el(
        "strong",
        "",
        this.settings.disguise ? "\u9879\u76EE\u540C\u4E8B" : v.author.name
      );
      author.dataset.author = v.author.name;
      meta.append(author, el("span", "", v.published || "\u89C6\u9891\u5206\u4EAB"));
      const bubble = el("div", "bo-bubble"), card = el("div", "bo-video-card"), cover = el("div", "bo-cover");
      const img = el("img");
      img.alt = `${v.title} \u5C01\u9762`;
      img.referrerPolicy = "no-referrer";
      if (v.cover) img.src = v.cover;
      img.onload = () => cover.dataset.loaded = "true";
      img.onerror = () => {
        img.dataset.error = "true";
        placeholder.textContent = "\u5C01\u9762\u52A0\u8F7D\u5931\u8D25";
      };
      const placeholder = el(
        "span",
        "bo-cover-placeholder",
        v.cover ? "\u5C01\u9762\u52A0\u8F7D\u4E2D" : "\u6682\u65E0\u5C01\u9762"
      );
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
          `\u64AD\u653E ${v.views || "\u2014"}\u3000\u65F6\u957F ${v.duration || "\u2014"}`
        )
      );
      card.append(cover, info);
      const controls = el("div", "bo-player-actions");
      controls.append(this.button("\u539F\u7248\u89C6\u9891 / \u8BC4\u8BBA", () => openOriginal(v.url)));
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
          }
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
      refresh: () => app.render()
    };
    app.init();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

})();
