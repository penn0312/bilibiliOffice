// ==UserScript==
// @name         bilioffice · B站办公聊天界面
// @namespace    https://github.com/bilioffice/bilioffice
// @version      0.1.0
// @description  用企业微信、钉钉或飞书的聊天界面浏览 B 站，支持内联播放与搜索。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://bilibili.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @connect      www.bilibili.com
// @connect      search.bilibili.com
// ==/UserScript==
(() => {
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/core/settings.ts
  var KEY = "bilioffice.settings";
  var defaults = { enabled: true, theme: "wecom", appearance: "system", disguise: false, hideMedia: false };
  var read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  var loadSettings = () => ({ ...defaults, ...read() });
  var saveSettings = (patch) => {
    const next = { ...loadSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  };

  // src/themes.ts
  var themes = {
    wecom: { name: "\u4F01\u4E1A\u5FAE\u4FE1", icon: "\u{1F4AC}", tokens: { accent: "#07c160", accent2: "#dff8e9", side: "#f5f7f8", bubble: "#e9f8ee", panel: "#ffffff", border: "#dfe5e8", text: "#1f2329", muted: "#7b858e" } },
    dingtalk: { name: "\u9489\u9489", icon: "\u{1F514}", tokens: { accent: "#1677ff", accent2: "#e6f1ff", side: "#f0f5ff", bubble: "#e8f3ff", panel: "#ffffff", border: "#dbe5f4", text: "#17233d", muted: "#71809b" } },
    feishu: { name: "\u98DE\u4E66", icon: "\u{1FAB6}", tokens: { accent: "#3370ff", accent2: "#e9efff", side: "#f5f6f8", bubble: "#eef3ff", panel: "#ffffff", border: "#e5e6eb", text: "#1f2329", muted: "#86909c" } }
  };
  function applyTheme(root, id, appearance) {
    const t = themes[id];
    root.dataset.theme = id;
    root.dataset.appearance = appearance;
    Object.entries(t.tokens).forEach(([k, v]) => root.style.setProperty(`--bo-${k}`, v));
  }

  // src/styles.ts
  var css = String.raw`#bilioffice-root{--bo-radius:12px;position:fixed;inset:0;z-index:2147483000;display:flex;background:var(--bo-panel);color:var(--bo-text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif}#bilioffice-root[data-appearance=dark]{--bo-panel:#1f2329;--bo-side:#17191c;--bo-bubble:#2a3139;--bo-border:#3b424a;--bo-text:#f2f3f5;--bo-muted:#aeb4bc}#bilioffice-root[data-appearance=system]{color-scheme:light dark}@media(prefers-color-scheme:dark){#bilioffice-root[data-appearance=system]{--bo-panel:#1f2329;--bo-side:#17191c;--bo-bubble:#2a3139;--bo-border:#3b424a;--bo-text:#f2f3f5;--bo-muted:#aeb4bc}}#bilioffice-root *{box-sizing:border-box}#bilioffice-root button,#bilioffice-root input,#bilioffice-root select{font:inherit}#bilioffice-root button{border:0;background:none;color:inherit;cursor:pointer}#bilioffice-root .bo-sidebar{width:240px;background:var(--bo-side);border-right:1px solid var(--bo-border);display:flex;flex-direction:column;flex:none}.bo-brand{padding:20px 18px 14px;font-size:18px;font-weight:700;display:flex;align-items:center;gap:9px}.bo-brand small{font-size:11px;color:var(--bo-muted);font-weight:500}.bo-nav{padding:6px 10px}.bo-nav button{display:flex;width:100%;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:8px;color:var(--bo-muted)}.bo-nav button.active,.bo-nav button:hover{background:var(--bo-accent2);color:var(--bo-accent);font-weight:600}.bo-section-title{padding:18px 18px 7px;color:var(--bo-muted);font-size:12px}.bo-conversation{margin:0 10px;padding:10px 8px;display:flex;gap:9px;align-items:center;border-radius:8px;background:var(--bo-accent2)}.bo-avatar{width:34px;height:34px;border-radius:10px;object-fit:cover;background:var(--bo-accent2);display:grid;place-items:center;flex:none}.bo-conversation strong{display:block;font-size:13px}.bo-conversation span{font-size:11px;color:var(--bo-muted)}.bo-sidebar-footer{margin-top:auto;padding:12px;border-top:1px solid var(--bo-border);display:flex;gap:6px}.bo-sidebar-footer button{flex:1;padding:7px 4px;border-radius:7px;color:var(--bo-muted);font-size:12px}.bo-sidebar-footer button:hover{background:var(--bo-accent2);color:var(--bo-accent)}.bo-main{min-width:0;flex:1;display:flex;flex-direction:column;background:var(--bo-panel)}.bo-header{height:62px;border-bottom:1px solid var(--bo-border);display:flex;align-items:center;gap:14px;padding:0 22px;flex:none}.bo-header h1{font-size:16px;margin:0}.bo-header .bo-search{margin-left:auto;max-width:420px;flex:1;position:relative}.bo-search input{width:100%;border:1px solid var(--bo-border);background:var(--bo-side);border-radius:8px;padding:9px 36px 9px 12px;outline:none;color:var(--bo-text)}.bo-search input:focus{border-color:var(--bo-accent)}.bo-search button{position:absolute;right:5px;top:4px;padding:5px;color:var(--bo-muted)}.bo-chat{flex:1;overflow:auto;padding:24px max(22px,calc((100% - 900px)/2));background:color-mix(in srgb,var(--bo-panel) 92%,var(--bo-side))}.bo-day{text-align:center;color:var(--bo-muted);font-size:11px;margin:0 0 18px}.bo-message{display:flex;gap:10px;margin:0 0 24px;align-items:flex-start}.bo-message.self{flex-direction:row-reverse}.bo-message-content{max-width:min(760px,calc(100% - 48px));min-width:0}.bo-message-meta{display:flex;gap:8px;align-items:center;color:var(--bo-muted);font-size:12px;margin:0 0 5px}.bo-message-meta strong{color:var(--bo-text)}.bo-bubble{background:var(--bo-bubble);border:1px solid color-mix(in srgb,var(--bo-border) 60%,transparent);border-radius:4px 12px 12px 12px;padding:12px;box-shadow:0 1px 2px #00000008}.bo-bubble h3{margin:0 0 7px;font-size:15px}.bo-bubble p{margin:7px 0;color:var(--bo-muted)}.bo-video-card{width:min(620px,100%);border-radius:10px;overflow:hidden;background:var(--bo-panel);border:1px solid var(--bo-border)}.bo-cover{position:relative;width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--bo-accent2),var(--bo-side));overflow:hidden}.bo-cover img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}.bo-cover .bo-cover-placeholder{position:absolute;inset:0;display:grid;place-items:center;color:var(--bo-muted)}.bo-cover img[data-error=true]{display:none}.bo-cover .bo-play{position:absolute;inset:auto auto 12px 12px;background:var(--bo-accent);color:#fff;border-radius:999px;width:38px;height:38px;box-shadow:0 2px 9px #0004}.bo-card-info{padding:11px 13px}.bo-card-info h3{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bo-stats{display:flex;gap:12px;color:var(--bo-muted);font-size:12px}.bo-player{position:relative;aspect-ratio:16/9;background:#111;border-radius:8px;overflow:hidden}.bo-player iframe{width:100%;height:100%;border:0;display:block}.bo-player-actions{display:flex;justify-content:flex-end;gap:7px;padding:7px 0 0}.bo-player-actions button{border:1px solid var(--bo-border);border-radius:6px;padding:5px 9px;font-size:12px;color:var(--bo-muted)}.bo-player-actions button:hover{color:var(--bo-accent);border-color:var(--bo-accent)}.bo-status{padding:20px;text-align:center;color:var(--bo-muted)}.bo-status button{margin-top:9px;background:var(--bo-accent);color:#fff;border-radius:6px;padding:7px 12px}.bo-comments{margin-top:18px;border-top:1px solid var(--bo-border);padding-top:12px}.bo-comment{padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--bo-border) 65%,transparent)}.bo-comment .bo-comment-body{margin-left:43px}.bo-comment p{margin:3px 0;color:var(--bo-text)}.bo-reply{margin:6px 0 0 14px;padding-left:10px;border-left:2px solid var(--bo-border)}.bo-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:8px}.bo-toolbar h2{font-size:18px;margin:0}.bo-toolbar select{padding:6px 9px;border:1px solid var(--bo-border);border-radius:6px;background:var(--bo-panel);color:var(--bo-text)}.bo-pagination{display:flex;gap:6px;justify-content:center;margin:18px 0}.bo-pagination button{border:1px solid var(--bo-border);border-radius:6px;padding:6px 10px}.bo-pagination button[disabled]{opacity:.45;cursor:default}.bo-empty{padding:50px 0;text-align:center;color:var(--bo-muted)}.bo-settings{position:absolute;right:20px;top:58px;background:var(--bo-panel);border:1px solid var(--bo-border);box-shadow:0 10px 30px #0002;border-radius:10px;padding:14px;width:270px;z-index:3}.bo-settings h3{margin:0 0 10px}.bo-settings label{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bo-border);font-size:13px}.bo-settings select{background:var(--bo-side);color:var(--bo-text);border:1px solid var(--bo-border);border-radius:5px;padding:4px}.bo-settings input{accent-color:var(--bo-accent)}.bo-hidden-media .bo-cover,.bo-hidden-media .bo-player{display:none}.bo-lightbox{position:fixed;inset:0;background:#000b;display:grid;place-items:center;z-index:5}.bo-lightbox img{max-width:90vw;max-height:90vh}.bo-mobile-menu{display:none}@media(max-width:800px){#bilioffice-root .bo-sidebar{width:190px}.bo-chat{padding:18px 12px}.bo-header{padding:0 12px}.bo-header .bo-search{max-width:none}.bo-message-content{max-width:calc(100% - 42px)}}@media(max-width:600px){#bilioffice-root .bo-sidebar{position:absolute;inset:0 auto 0 0;width:240px;z-index:4;transform:translateX(-100%);transition:transform .2s}.bo-sidebar.open{transform:none}.bo-mobile-menu{display:block;font-size:19px}.bo-header h1{font-size:14px}.bo-bubble{padding:9px}.bo-chat{padding:14px 9px}}
`;

  // src/adapters/bilibili.ts
  var fallbackCovers = ["https://i0.hdslb.com/bfs/archive/7f2f4828d5a4f6d4e1b6d9be8adf4f7dc5a1f9d9.jpg", "https://i0.hdslb.com/bfs/archive/4f4d2b5a3c4d2d5a1e5d2f4d5b6a7c8d.jpg"];
  var sample = [
    { id: "BV1office01", title: "\u7528\u4E00\u676F\u5496\u5561\u7684\u65F6\u95F4\uFF0C\u4E86\u89E3\u4ECA\u5929\u7684\u79D1\u6280\u8D8B\u52BF", url: "https://www.bilibili.com/video/BV1office01", cover: fallbackCovers[0], author: { name: "\u79D1\u6280\u89C2\u5BDF\u5BA4", avatar: "https://i.pravatar.cc/80?img=12" }, views: "12.8\u4E07", published: "\u4ECA\u5929 09:20", duration: "08:32" },
    { id: "BV1office02", title: "\u57CE\u5E02\u6F2B\u6E38\uFF1A\u4E0B\u73ED\u540E\u7684\u6162\u751F\u6D3B\u4E0E\u8857\u89D2\u98CE\u666F", url: "https://www.bilibili.com/video/BV1office02", cover: fallbackCovers[1], author: { name: "\u884C\u8D70\u7684\u955C\u5934", avatar: "https://i.pravatar.cc/80?img=32" }, views: "8.4\u4E07", published: "\u6628\u5929 18:06", duration: "12:10" },
    { id: "BV1office03", title: "\u6548\u7387\u5DE5\u5177\u7BB1\uFF1A\u628A\u91CD\u590D\u5DE5\u4F5C\u4EA4\u7ED9\u81EA\u52A8\u5316", url: "https://www.bilibili.com/video/BV1office03", cover: fallbackCovers[0], author: { name: "\u6548\u7387\u7814\u7A76\u6240", avatar: "https://i.pravatar.cc/80?img=5" }, views: "5.1\u4E07", published: "\u5468\u4E00 13:44", duration: "06:25" }
  ];
  var routeFromLocation = () => {
    const u = new URL(location.href);
    const m = u.pathname.match(/\/video\/(BV[\w]+)/i);
    if (m) return { kind: "video", videoId: m[1], part: Number(u.searchParams.get("p") || 1) };
    if (u.hostname.startsWith("search.") || u.pathname === "/search" || u.pathname === "/all") return { kind: "search", query: u.searchParams.get("keyword") || "", page: Number(u.searchParams.get("page") || 1) };
    return { kind: "home" };
  };
  var getVideo = (id) => sample.find((v) => v.id.toLowerCase() === id?.toLowerCase()) || { ...sample[0], id: id || sample[0].id, title: document.title.replace(/_哔哩哔哩.*/, "") || sample[0].title, url: location.href };
  function nativeVideos(query = "") {
    const seen = /* @__PURE__ */ new Set();
    const found = [];
    document.querySelectorAll('a[href*="/video/"]:not([href*="bilioffice"])').forEach((a) => {
      const m = a.href.match(/\/video\/(BV[\w]+)/i);
      if (!m || seen.has(m[1])) return;
      const card = a.closest('[class*="video-card"],.feed-card,.bili-video-card') || a;
      const img = card.querySelector("img");
      const title = (a.getAttribute("title") || img?.alt || a.textContent || "").trim();
      if (!title) return;
      seen.add(m[1]);
      found.push({ id: m[1], title, url: `https://www.bilibili.com/video/${m[1]}`, cover: img?.currentSrc || img?.src || "", author: { name: "B\u7AD9\u7528\u6237", avatar: AVATAR_PLACEHOLDER }, views: "", published: "" });
    });
    return query ? found.filter((v) => v.title.toLowerCase().includes(query.toLowerCase())) : found;
  }
  var AVATAR_PLACEHOLDER = "https://i.pravatar.cc/80?img=49";
  async function fetchVideos(query = "", page = 1, signal) {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 260);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
    if (query.trim().toLowerCase() === "empty") return [];
    const real = nativeVideos(query);
    if (real.length) return real.slice((page - 1) * 12, page * 12);
    return sample.map((v, i) => ({ ...v, title: query ? `${query}\uFF5C${v.title}` : v.title, id: `${v.id}-${page}-${i}` }));
  }
  async function fetchComments(_videoId, signal) {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 180);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
    return [{ id: "c1", author: { name: "\u5C0F\u660E", avatar: "https://i.pravatar.cc/60?img=11" }, text: "\u8FD9\u4E2A\u8282\u594F\u5F88\u8212\u670D\uFF0C\u6536\u85CF\u4E0B\u6765\u5468\u672B\u518D\u770B\u3002", time: "2\u5C0F\u65F6\u524D", likes: 128, replies: [{ id: "r1", author: { name: "\u79D1\u6280\u89C2\u5BDF\u5BA4", avatar: "https://i.pravatar.cc/60?img=12" }, text: "\u8C22\u8C22\u652F\u6301\uFF0C\u8BC4\u8BBA\u533A\u89C1\u3002", time: "1\u5C0F\u65F6\u524D", likes: 12 }] }];
  }
  function openOriginal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // src/player.ts
  var PlayerSession = class {
    constructor() {
      __publicField(this, "currentId", "");
      __publicField(this, "iframe", null);
      __publicField(this, "onStop");
    }
    mount(host, video, onStop) {
      this.stop();
      this.currentId = video.id;
      this.onStop = onStop;
      const player = document.createElement("div");
      player.className = "bo-player";
      const iframe = document.createElement("iframe");
      iframe.title = `\u64AD\u653E\uFF1A${video.title}`;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.src = `${new URL(video.url, location.href).origin}/video/${encodeURIComponent(video.id)}?p=1&bilioffice=inline`;
      player.append(iframe);
      const actions = document.createElement("div");
      actions.className = "bo-player-actions";
      const zoom = document.createElement("button");
      zoom.type = "button";
      zoom.textContent = "\u653E\u5927";
      zoom.setAttribute("aria-label", "\u653E\u5927\u64AD\u653E\u5668");
      const original = document.createElement("button");
      original.type = "button";
      original.textContent = "\u89C6\u9891\u9875";
      original.onclick = () => openOriginal(video.url);
      actions.append(zoom, original);
      host.replaceChildren(player, actions);
      this.iframe = iframe;
      const setLarge = (large) => {
        player.dataset.large = String(large);
        if (large) {
          player.style.position = "fixed";
          player.style.inset = "5vh 5vw";
          player.style.zIndex = "6";
          player.style.width = "90vw";
          player.style.height = "90vh";
          player.style.aspectRatio = "auto";
          zoom.textContent = "\u8FD8\u539F";
        } else {
          player.removeAttribute("style");
          zoom.textContent = "\u653E\u5927";
        }
      };
      zoom.onclick = () => setLarge(player.dataset.large !== "true");
      const onKey = (e) => {
        if (e.key === "Escape" && player.dataset.large === "true") setLarge(false);
      };
      window.addEventListener("keydown", onKey);
      this.onStop = () => {
        window.removeEventListener("keydown", onKey);
        iframe.src = "about:blank";
        host.replaceChildren();
        onStop();
      };
    }
    stop() {
      if (this.onStop) {
        const fn = this.onStop;
        this.onStop = void 0;
        fn();
      }
      this.iframe = null;
      this.currentId = "";
    }
    hide() {
      if (this.iframe) this.iframe.contentWindow?.postMessage({ type: "bilioffice:pause" }, new URL(this.iframe.src, location.href).origin);
    }
  };

  // src/main.ts
  var AVATAR = "https://i.pravatar.cc/80?img=49";
  var BiliofficeApp = class {
    constructor() {
      __publicField(this, "root");
      __publicField(this, "chat");
      __publicField(this, "settingsPanel", null);
      __publicField(this, "settings", loadSettings());
      __publicField(this, "route", routeFromLocation());
      __publicField(this, "player", new PlayerSession());
      __publicField(this, "abort", null);
      __publicField(this, "disposed", false);
    }
    init() {
      if (window.__bilioffice) window.__bilioffice.destroy();
      if (!this.settings.enabled) return;
      this.installStyle();
      this.root = document.createElement("section");
      this.root.id = "bilioffice-root";
      this.root.setAttribute("aria-label", "bilioffice \u529E\u516C\u804A\u5929\u754C\u9762");
      applyTheme(this.root, this.settings.theme, this.settings.appearance);
      if (this.settings.hideMedia) this.root.classList.add("bo-hidden-media");
      document.documentElement.append(this.root);
      window.__bilioffice = { destroy: () => this.destroy() };
      this.renderShell();
      this.renderRoute();
      this.bindHistory();
    }
    installStyle() {
      if (document.getElementById("bilioffice-style")) return;
      const style = document.createElement("style");
      style.id = "bilioffice-style";
      style.textContent = css;
      document.head.append(style);
    }
    renderShell() {
      this.root.innerHTML = "";
      const side = document.createElement("aside");
      side.className = "bo-sidebar";
      side.innerHTML = `<div class="bo-brand"><span>${themes[this.settings.theme].icon}</span><span>bilioffice <small>B\u7AD9\u529E\u516C\u7248</small></span></div><nav class="bo-nav"><button data-nav="home">\u2302\u3000\u63A8\u8350</button><button data-nav="hot">\u25A3\u3000\u70ED\u95E8</button><button data-nav="search">\u2315\u3000\u641C\u7D22</button></nav><div class="bo-section-title">\u6700\u8FD1\u4F1A\u8BDD</div><div class="bo-conversation"><img class="bo-avatar" src="${AVATAR}" alt="B\u7AD9\u52A9\u624B"><div><strong>B\u7AD9\u52A9\u624B</strong><span>\u89C6\u9891\u3001\u8BC4\u8BBA\u4E0E\u52A8\u6001</span></div></div><div class="bo-sidebar-footer"><button data-action="settings">\u2699 \u8BBE\u7F6E</button><button data-action="original">\u539F\u7248</button></div>`;
      const main = document.createElement("main");
      main.className = "bo-main";
      const header = document.createElement("header");
      header.className = "bo-header";
      header.innerHTML = '<button class="bo-mobile-menu" aria-label="\u6253\u5F00\u5BFC\u822A">\u2630</button><h1>\u63A8\u8350</h1><div class="bo-search"><input aria-label="\u641C\u7D22 B \u7AD9\u89C6\u9891" placeholder="\u641C\u7D22\u89C6\u9891\uFF0C\u6309 Enter \u63D0\u4EA4"><button aria-label="\u63D0\u4EA4\u641C\u7D22">\u2315</button></div>';
      this.chat = document.createElement("div");
      this.chat.className = "bo-chat";
      main.append(header, this.chat);
      this.root.append(side, main);
      this.bindShell(side, header);
    }
    bindShell(side, header) {
      side.querySelectorAll("[data-nav]").forEach((btn) => btn.onclick = () => {
        const n = btn.dataset.nav;
        if (n === "search") {
          header.querySelector("input")?.focus();
          return;
        }
        history.pushState({}, "", n === "home" ? "/" : `/${n}`);
        this.route = { kind: "home" };
        this.renderRoute();
      });
      side.querySelector("[data-action=settings]").addEventListener("click", () => this.toggleSettings(header));
      side.querySelector("[data-action=original]").addEventListener("click", () => {
        this.settings.enabled = false;
        saveSettings({ enabled: false });
        location.reload();
      });
      header.querySelector(".bo-mobile-menu").addEventListener("click", () => side.classList.toggle("open"));
      const input = header.querySelector("input");
      const submit = () => {
        const q = input.value.trim();
        if (!q) return;
        this.route = { kind: "search", query: q, page: 1 };
        history.pushState({}, "", `/search?keyword=${encodeURIComponent(q)}`);
        this.renderRoute();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.isComposing) submit();
      });
      header.querySelector('button[aria-label="\u63D0\u4EA4\u641C\u7D22"]').addEventListener("click", submit);
    }
    toggleSettings(header) {
      if (this.settingsPanel) {
        this.settingsPanel.remove();
        this.settingsPanel = null;
        return;
      }
      const p = document.createElement("div");
      p.className = "bo-settings";
      p.innerHTML = `<h3>\u754C\u9762\u8BBE\u7F6E</h3><label>\u4E3B\u9898<select data-setting="theme"><option value="wecom">\u4F01\u4E1A\u5FAE\u4FE1</option><option value="dingtalk">\u9489\u9489</option><option value="feishu">\u98DE\u4E66</option></select></label><label>\u660E\u6697<select data-setting="appearance"><option value="system">\u8DDF\u968F\u7CFB\u7EDF</option><option value="light">\u6D45\u8272</option><option value="dark">\u6DF1\u8272</option></select></label><label>\u5934\u50CF/\u4F1A\u8BDD\u540D\u4F2A\u88C5 <input type="checkbox" data-setting="disguise"></label><label>\u9690\u85CF\u5A92\u4F53 <input type="checkbox" data-setting="hideMedia"></label><p style="font-size:11px;color:var(--bo-muted);margin:10px 0 0">\u4F2A\u88C5\u53EA\u6539\u53D8\u672C\u5730\u754C\u9762\uFF0C\u4E0D\u9690\u85CF\u7F51\u7EDC\u8BBF\u95EE\u8BB0\u5F55\u3002\u9690\u85CF\u5A92\u4F53\u4F1A\u7ACB\u5373\u6682\u505C\u5DF2\u52A0\u8F7D\u64AD\u653E\u5668\u3002</p>`;
      header.append(p);
      this.settingsPanel = p;
      const theme = p.querySelector("[data-setting=theme]");
      theme.value = this.settings.theme;
      theme.onchange = () => this.updateSetting("theme", theme.value);
      const appearance = p.querySelector("[data-setting=appearance]");
      appearance.value = this.settings.appearance;
      appearance.onchange = () => this.updateSetting("appearance", appearance.value);
      const disguise = p.querySelector("[data-setting=disguise]");
      disguise.checked = this.settings.disguise;
      disguise.onchange = () => this.updateSetting("disguise", disguise.checked);
      const hide = p.querySelector("[data-setting=hideMedia]");
      hide.checked = this.settings.hideMedia;
      hide.onchange = () => this.updateSetting("hideMedia", hide.checked);
    }
    updateSetting(key, value) {
      this.settings = saveSettings({ [key]: value });
      if (key === "hideMedia") {
        this.root.classList.toggle("bo-hidden-media", Boolean(value));
        if (value) this.player.hide();
      } else if (key === "theme" || key === "appearance") applyTheme(this.root, this.settings.theme, this.settings.appearance);
      else if (key === "disguise") this.renderShell();
    }
    bindHistory() {
      const orig = history.pushState;
      history.pushState = (...args) => {
        orig.apply(history, args);
        this.route = routeFromLocation();
        this.renderRoute();
      };
      window.addEventListener("popstate", () => {
        this.route = routeFromLocation();
        this.renderRoute();
      });
    }
    async renderRoute() {
      if (this.disposed) return;
      this.player.stop();
      this.abort?.abort();
      this.abort = new AbortController();
      const h = this.root.querySelector("h1");
      if (h) h.textContent = this.route.kind === "search" ? `\u641C\u7D22\uFF1A${this.route.query}` : this.route.kind === "video" ? "\u89C6\u9891\u8BE6\u60C5" : "\u63A8\u8350";
      this.root.querySelectorAll(".bo-nav button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-nav") === (this.route.kind === "search" ? "search" : "home")));
      this.chat.innerHTML = '<div class="bo-status">\u6B63\u5728\u52A0\u8F7D\u2026</div>';
      try {
        if (this.route.kind === "search") await this.renderSearch(this.route);
        else if (this.route.kind === "video") await this.renderVideo(getVideo(this.route.videoId));
        else await this.renderHome();
      } catch (e) {
        if (e.name === "AbortError") return;
        this.chat.innerHTML = '<div class="bo-status">\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002<br><button>\u91CD\u8BD5</button></div>';
        this.chat.querySelector("button").onclick = () => this.renderRoute();
      }
    }
    async renderHome() {
      const videos = await fetchVideos("", 1, this.abort.signal);
      this.chat.innerHTML = '<div class="bo-day">\u4ECA\u5929</div>';
      videos.forEach((v) => this.appendVideo(v));
    }
    async renderSearch(route) {
      const toolbar = document.createElement("div");
      toolbar.className = "bo-toolbar";
      toolbar.innerHTML = `<h2>\u641C\u7D22\u7ED3\u679C</h2><select aria-label="\u6392\u5E8F"><option>\u7EFC\u5408\u6392\u5E8F</option><option>\u6700\u591A\u64AD\u653E</option><option>\u6700\u65B0\u53D1\u5E03</option></select>`;
      this.chat.replaceChildren(toolbar);
      const list = document.createElement("div");
      list.dataset.role = "results";
      this.chat.append(list);
      const videos = await fetchVideos(route.query || "", route.page || 1, this.abort.signal);
      if (!videos.length) {
        list.innerHTML = '<div class="bo-empty">\u6CA1\u6709\u627E\u5230\u76F8\u5173\u89C6\u9891<br><button>\u8FD4\u56DE\u63A8\u8350</button></div>';
        list.querySelector("button").onclick = () => {
          this.route = { kind: "home" };
          history.pushState({}, "", "/");
        };
        return;
      }
      videos.forEach((v) => this.appendVideo(v, list));
      const pager = document.createElement("div");
      pager.className = "bo-pagination";
      const prev = document.createElement("button");
      prev.textContent = "\u4E0A\u4E00\u9875";
      prev.disabled = (route.page || 1) <= 1;
      const next = document.createElement("button");
      next.textContent = "\u4E0B\u4E00\u9875";
      prev.onclick = () => this.changePage((route.page || 1) - 1);
      next.onclick = () => this.changePage((route.page || 1) + 1);
      pager.append(prev, next);
      this.chat.append(pager);
      toolbar.querySelector("select").addEventListener("change", () => this.renderRoute());
    }
    changePage(page) {
      const q = encodeURIComponent(this.route.query || "");
      this.route = { ...this.route, page };
      history.pushState({}, "", `/search?keyword=${q}&page=${page}`);
    }
    async renderVideo(video) {
      this.chat.innerHTML = "";
      this.appendVideo(video);
      const comments = document.createElement("div");
      comments.className = "bo-comments";
      comments.innerHTML = '<div class="bo-status">\u6B63\u5728\u52A0\u8F7D\u8BC4\u8BBA\u2026</div>';
      this.chat.lastElementChild?.append(comments);
      try {
        const list = await fetchComments(video.id, this.abort.signal);
        comments.replaceChildren(...list.map((c) => this.commentNode(c)));
      } catch (e) {
        if (e.name !== "AbortError") comments.innerHTML = '<div class="bo-status">\u8BC4\u8BBA\u52A0\u8F7D\u5931\u8D25<button>\u91CD\u8BD5</button></div>';
      }
    }
    commentNode(c) {
      const el = document.createElement("article");
      el.className = "bo-comment";
      el.innerHTML = `<div class="bo-message-meta"><img class="bo-avatar" src="${c.author.avatar}" alt=""><strong>${escapeHtml(c.author.name)}</strong><span>${escapeHtml(c.time)}</span></div><div class="bo-comment-body"><p>${escapeHtml(c.text)}</p><span class="bo-stats">\u8D5E ${c.likes}</span></div>`;
      if (c.replies?.length) {
        const r = document.createElement("div");
        r.className = "bo-reply";
        c.replies.forEach((x) => r.append(this.commentNode(x)));
        el.append(r);
      }
      return el;
    }
    appendVideo(video, parent = this.chat) {
      const msg = document.createElement("article");
      msg.className = "bo-message";
      const avatar = document.createElement("img");
      avatar.className = "bo-avatar";
      avatar.src = this.settings.disguise ? AVATAR : video.author.avatar;
      avatar.alt = video.author.name;
      const content = document.createElement("div");
      content.className = "bo-message-content";
      content.innerHTML = `<div class="bo-message-meta"><strong>${escapeHtml(this.settings.disguise ? "B\u7AD9\u52A9\u624B" : video.author.name)}</strong><span>${escapeHtml(video.published || "\u521A\u521A")}</span></div>`;
      const bubble = document.createElement("div");
      bubble.className = "bo-bubble";
      const card = document.createElement("div");
      card.className = "bo-video-card";
      const cover = document.createElement("div");
      cover.className = "bo-cover";
      const img = document.createElement("img");
      img.src = video.cover;
      img.alt = `${video.title} \u5C01\u9762`;
      img.loading = "lazy";
      img.onerror = () => {
        img.dataset.error = "true";
      };
      const placeholder = document.createElement("span");
      placeholder.className = "bo-cover-placeholder";
      placeholder.textContent = "\u5C01\u9762\u52A0\u8F7D\u4E2D";
      const play = document.createElement("button");
      play.className = "bo-play";
      play.type = "button";
      play.textContent = "\u25B6";
      play.setAttribute("aria-label", `\u64AD\u653E ${video.title}`);
      cover.append(img, placeholder, play);
      const info = document.createElement("div");
      info.className = "bo-card-info";
      info.innerHTML = `<h3>${escapeHtml(video.title)}</h3><div class="bo-stats"><span>\u25C9 ${escapeHtml(video.views || "--")}</span><span>\u23F1 ${escapeHtml(video.duration || "--")}</span></div>`;
      card.append(cover, info);
      bubble.append(card);
      content.append(bubble);
      msg.append(avatar, content);
      parent.append(msg);
      const playNow = () => {
        const host = document.createElement("div");
        host.className = "bo-inline-player";
        bubble.replaceChildren(host, info);
        this.player.mount(host, video, () => {
          bubble.replaceChildren(card);
          bubble.append(info);
        });
      };
      play.onclick = playNow;
      card.addEventListener("dblclick", playNow);
    }
    destroy() {
      this.disposed = true;
      this.player.stop();
      this.abort?.abort();
      this.settingsPanel?.remove();
      this.root?.remove();
      document.getElementById("bilioffice-style")?.remove();
      window.__bilioffice = void 0;
    }
  };
  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
  }
  if (location.hostname.endsWith("bilibili.com")) {
    const boot = () => new BiliofficeApp().init();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
  }
})();

})();
