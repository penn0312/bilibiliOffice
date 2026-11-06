import type { AppSettings, Comment, Route, VideoItem } from "./types";
import { loadSettings, saveSettings } from "./core/settings";
import { applyTheme, themes } from "./themes";
import css from "./styles/base.css";
import extraCSS from "./styles/layout.css";
import modalCSS from "./styles/modal.css";
import {
  fetchVideos,
  getVideo,
  openOriginal,
  routeFromLocation,
} from "./adapters/bilibili";
import {
  readComments,
  loadMore,
  exportComments,
} from "./adapters/bilibili/comments";
import { Lightbox } from "./components/lightbox";
import { PlayerSession } from "./player";
import { startBridge, bridgeParams } from "./player/bridge";
declare global {
  interface Window {
    __bilioffice?: { destroy: () => void; refresh: () => void };
    __biliofficeBridgeCleanup?: () => void;
  }
}
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = "",
  text = "",
) => {
  const node = document.createElement(tag);
  node.className = cls;
  node.textContent = text;
  return node;
};
class App {
  root = el("section");
  chat = el("div", "bo-chat");
  list = el("div");
  header = el("header", "bo-header");
  sidebar = el("aside", "bo-sidebar");
  heading = el("h1");
  input = el("input");
  settings = loadSettings();
  route = routeFromLocation();
  player = new PlayerSession();
  controller = new AbortController();
  life = new AbortController();
  panel: HTMLElement | null = null;
  comments: Comment[] = [];
  commentList: HTMLElement | null = null;
  commentStatus: HTMLElement | null = null;
  cards = new Map<string, { node: HTMLElement; title: HTMLElement }>();
  disposed = false;
  request = 0;
  restoreHistory = () => {};
  lightbox = new Lightbox();
  nativeURL = location.href;
  init() {
    this.root.id = "bilioffice-root";
    this.root.setAttribute("aria-label", "bilioffice 办公聊天界面");
    document.documentElement.classList.add("bilioffice-active");
    const style = el("style");
    style.id = "bilioffice-style";
    style.textContent = css + extraCSS + modalCSS;
    document.head.append(style);
    this.root.append(this.sidebar);
    const main = el("main", "bo-main");
    main.append(this.header, this.chat);
    this.root.append(main);
    document.documentElement.append(this.root);
    const pauseNative = (event: Event) => {
      if (
        event.target instanceof HTMLVideoElement &&
        !this.root.contains(event.target)
      )
        event.target.pause();
    };
    document.addEventListener("play", pauseNative, {
      capture: true,
      signal: this.life.signal,
    });
    document.querySelectorAll("video").forEach((v) => v.pause());
    this.shell();
    this.apply();
    this.watchRoute();
    this.render();
  }
  button(text: string, fn: () => void, cls = "") {
    const b = el("button", cls, text);
    b.type = "button";
    b.onclick = fn;
    return b;
  }
  shell() {
    const brand = el("div", "bo-brand");
    brand.append(
      el("span", "bo-brand-icon", themes[this.settings.theme].icon),
      el("strong", "", "bilioffice"),
    );
    const closeNav = this.button(
      "‹",
      () => this.sidebar.classList.remove("open"),
      "bo-mobile-menu",
    );
    closeNav.setAttribute("aria-label", "收起导航");
    brand.append(closeNav);
    this.sidebar.append(brand, el("div", "bo-section-title", "工作空间 · B站"));
    const nav = el("nav", "bo-nav");
    for (const [label, kind, url] of [
      ["⌂ 推荐", "home", "/"],
      ["▣ 热门", "popular", "/v/popular/all"],
      ["◈ 科技分区", "section", "/c/tech/"],
    ] as const) {
      const b = this.button(label, () =>
        kind === "section"
          ? location.assign(new URL(url, "https://www.bilibili.com").href)
          : this.navigate(url),
      );
      b.dataset.nav = kind;
      nav.append(b);
    }
    this.sidebar.append(nav, el("div", "bo-section-title", "视频会话"));
    const conv = el("div", "bo-conversation");
    conv.append(
      el("span", "bo-avatar", "B"),
      el("div", "", "视频助手 · 仅本地浏览"),
    );
    this.sidebar.append(conv);
    const footer = el("div", "bo-sidebar-footer");
    footer.append(
      this.button("⚙ 设置", () => this.toggleSettings()),
      this.button("恢复原版", () => this.original()),
    );
    this.sidebar.append(footer);
    const menu = this.button(
      "☰",
      () => this.sidebar.classList.toggle("open"),
      "bo-mobile-menu",
    );
    menu.setAttribute("aria-label", "展开或收起导航");
    this.header.append(menu, this.heading);
    const form = el("form", "bo-search");
    this.input.placeholder = "搜索视频，Enter 提交";
    this.input.setAttribute("aria-label", "搜索 B 站视频");
    const submit = this.button("搜索", () => {});
    submit.type = "submit";
    const clear = this.button("清空", () => {
      this.input.value = "";
      this.input.focus();
    });
    clear.className = "bo-clear";
    form.append(this.input, clear, submit);
    let composing = false;
    this.input.addEventListener("compositionstart", () => (composing = true));
    this.input.addEventListener("compositionend", () => (composing = false));
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.isComposing || composing)) e.preventDefault();
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      if (composing) return;
      const q = this.input.value.trim();
      if (q)
        this.navigate(
          `/search?keyword=${encodeURIComponent(q)}&page=1&order=totalrank`,
        );
    };
    this.header.append(form);
  }
  apply() {
    applyTheme(this.root, this.settings.theme, this.settings.appearance);
    this.root.classList.toggle("bo-hidden-media", this.settings.hideMedia);
    this.root.querySelector(".bo-brand-icon")!.textContent =
      themes[this.settings.theme].icon;
    for (const avatar of this.root.querySelectorAll<HTMLElement>(
      "[data-avatar]",
    ))
      avatar.textContent = this.settings.disguise
        ? "同"
        : avatar.dataset.avatar!;
    for (const node of this.root.querySelectorAll<HTMLElement>("[data-author]"))
      node.textContent = this.settings.disguise
        ? "项目同事"
        : node.dataset.author!;
  }
  toggleSettings() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      return;
    }
    const p = el("section", "bo-settings");
    p.setAttribute("aria-label", "界面设置");
    p.append(
      el("h3", "", "界面设置"),
      this.button("关闭", () => this.toggleSettings()),
    );
    const select = (
      title: string,
      key: "theme" | "appearance",
      options: [string, string][],
    ) => {
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
    select("主题", "theme", [
      ["wecom", "企业微信"],
      ["dingtalk", "钉钉"],
      ["feishu", "飞书"],
    ]);
    select("外观", "appearance", [
      ["system", "跟随系统"],
      ["light", "浅色"],
      ["dark", "深色"],
    ]);
    for (const [key, title] of [
      ["disguise", "头像 / 会话名伪装"],
      ["hideMedia", "隐藏媒体并停止播放"],
    ] as const) {
      const l = el("label", "", title),
        check = el("input");
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
        "设置只改变本地显示；不能隐藏网络访问记录。评论、收藏和关注请打开原版操作。",
      ),
    );
    this.header.append(p);
    this.panel = p;
  }
  navigate(path: string) {
    const base =
      path === "/" || path.startsWith("/v/") || path.startsWith("/c/")
        ? "https://www.bilibili.com"
        : location.href;
    const u = new URL(path, base);
    if (u.origin !== location.origin) {
      location.href = u.href;
      return;
    }
    history.pushState({}, "", u.pathname + u.search);
    this.sidebar.classList.remove("open");
  }
  watchRoute() {
    const push = history.pushState,
      replace = history.replaceState;
    const change = () => {
      const next = routeFromLocation();
      if (JSON.stringify(next) !== JSON.stringify(this.route)) {
        this.route = next;
        this.render();
      }
    };
    history.pushState = function (...args) {
      push.apply(history, args);
      change();
    };
    history.replaceState = function (...args) {
      replace.apply(history, args);
      change();
    };
    const wrappedPush = history.pushState,
      wrappedReplace = history.replaceState;
    this.restoreHistory = () => {
      if (history.pushState === wrappedPush) history.pushState = push;
      if (history.replaceState === wrappedReplace)
        history.replaceState = replace;
    };
    window.addEventListener("popstate", change, { signal: this.life.signal });
    window.addEventListener("pagehide", () => this.destroy(), {
      signal: this.life.signal,
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
      home: "推荐会话",
      popular: "热门视频",
      section: "分区视频",
      search: "搜索结果",
      video: "视频会话",
    }[this.route.kind];
    this.root
      .querySelectorAll<HTMLElement>("[data-nav]")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.nav === this.route.kind),
      );
    this.chat.replaceChildren();
    const toolbar = el("div", "bo-toolbar");
    toolbar.append(
      el(
        "h2",
        "",
        this.route.kind === "search"
          ? `“${this.route.query || ""}”`
          : "今天 · 视频消息",
      ),
    );
    toolbar.append(
      this.button("返回推荐", () => this.navigate("/")),
      this.button("刷新", () => this.render()),
    );
    if (this.route.kind === "search") {
      const sort = el("select");
      sort.setAttribute("aria-label", "搜索排序");
      for (const [value, label] of [
        ["totalrank", "综合排序"],
        ["click", "最多播放"],
        ["pubdate", "最新发布"],
        ["dm", "最多弹幕"],
        ["stow", "最多收藏"],
      ]) {
        const opt = el("option", "", label);
        opt.value = value;
        sort.append(opt);
      }
      sort.value = this.route.order || "totalrank";
      sort.onchange = () =>
        this.navigate(
          `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=1&order=${sort.value}`,
        );
      toolbar.append(sort);
    }
    this.chat.append(toolbar);
    const status = el("div", "bo-status", "正在等待新结果…");
    status.setAttribute("role", "status");
    this.list = el("div");
    this.chat.append(status, this.list);
    try {
      if (this.route.kind === "video") {
        const v = await getVideo(
          this.route.videoId!,
          this.route.part || 1,
          signal,
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
          el("div", "bo-empty", "暂无结果。可以更换关键词或返回推荐。"),
        );
      else this.sync(result.items);
      if (result.pages > 1) {
        const pager = el("div", "bo-pagination");
        const page = this.route.page || 1;
        const prev = this.button("上一页", () => this.page(page - 1)),
          next = this.button("下一页", () => this.page(page + 1));
        prev.disabled = page <= 1;
        next.disabled = page >= result.pages;
        pager.append(
          prev,
          el("span", "", `第 ${page} / ${result.pages} 页`),
          next,
        );
        this.chat.append(pager);
      }
    } catch (e) {
      if (signal.aborted) return;
      status.textContent = `加载失败：${(e as Error).message}`;
      status.append(
        this.button("重试", () => this.render()),
        this.button("打开原版", () => this.original()),
        this.button("在原站加载后继续", () =>
          location.assign(this.originalURL()),
        ),
      );
    }
  }
  page(page: number) {
    this.navigate(
      this.route.kind === "search"
        ? `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=${page}&order=${this.route.order || "totalrank"}`
        : `/v/popular/all?pn=${page}`,
    );
  }
  sync(items: VideoItem[]) {
    for (const v of items) {
      const found = this.cards.get(v.id);
      if (found) {
        found.title.textContent = v.title;
        continue;
      }
      const node = this.card(v);
      this.cards.set(v.id, { node, title: node.querySelector("h3")! });
      this.list.append(node);
    }
  }
  title(node: HTMLElement, title: string) {
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
      document.createTextNode(title.slice(index + query.length)),
    );
  }
  card(v: VideoItem) {
    const row = el("article", "bo-message");
    row.dataset.videoId = v.id;
    const avatar = el(
      "span",
      "bo-avatar",
      this.settings.disguise ? "同" : v.author.name.slice(0, 1),
    );
    avatar.dataset.avatar = v.author.name.slice(0, 1);
    const content = el("div", "bo-message-content"),
      meta = el("div", "bo-message-meta");
    const author = el(
      "strong",
      "",
      this.settings.disguise ? "项目同事" : v.author.name,
    );
    author.dataset.author = v.author.name;
    meta.append(author, el("span", "", v.published || "视频分享"));
    const bubble = el("div", "bo-bubble"),
      card = el("div", "bo-video-card"),
      cover = el("div", "bo-cover");
    const img = el("img");
    img.alt = `${v.title} 封面`;
    img.referrerPolicy = "no-referrer";
    if (v.cover) img.src = v.cover;
    img.onload = () => (cover.dataset.loaded = "true");
    img.onerror = () => {
      img.dataset.error = "true";
      placeholder.textContent = "封面加载失败";
    };
    const placeholder = el(
      "span",
      "bo-cover-placeholder",
      v.cover ? "封面加载中" : "暂无封面",
    );
    const play = this.button("▶ 播放", () => start(), "bo-play");
    play.setAttribute("aria-label", `播放 ${v.title}`);
    cover.append(img, placeholder, play);
    const info = el("div", "bo-card-info"),
      heading = el("h3");
    this.title(heading, v.title);
    info.append(
      heading,
      el(
        "div",
        "bo-stats",
        `播放 ${v.views || "—"}　时长 ${v.duration || "—"}`,
      ),
    );
    card.append(cover, info);
    const controls = el("div", "bo-player-actions");
    controls.append(this.button("原版视频 / 评论", () => openOriginal(v.url)));
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
  renderComments(comments: Comment[]) {
    this.comments = comments;
    if (!this.commentList) {
      const area = el("section", "bo-comments");
      area.append(el("h3", "", "当前已加载评论"));
      const actions = el("div", "bo-player-actions");
      actions.append(
        this.button("同步已加载", () =>
          this.player.iframe
            ? this.player.syncComments()
            : this.renderComments(readComments()),
        ),
        this.button("加载更多", () => {
          if (this.commentStatus)
            this.commentStatus.textContent = "正在等待原站评论变化…";
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
              },
            );
          }
        }),
        this.button("导出已加载", () => exportComments(this.comments)),
      );
      this.commentStatus = el("div", "bo-status");
      this.commentStatus.setAttribute("role", "status");
      this.commentList = el("div");
      area.append(actions, this.commentStatus, this.commentList);
      this.chat.append(area);
    }
    this.commentStatus!.textContent = comments.length
      ? `${comments.length} 条主评论；包含当前可见楼中楼。`
      : "原站评论尚未加载。播放后同步，或打开原版加载；发送评论会在原站真实发布。";
    const render = (c: Comment) => {
      const a = el("article", "bo-comment");
      a.append(
        el("strong", "", c.author.name),
        el("span", "bo-stats", c.time),
        el("p", "", c.text),
      );
      for (const src of c.images) {
        const link = el("a", "", "查看图片");
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
    return this.route.kind === "search"
      ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(this.route.query || "")}&page=${this.route.page || 1}&order=${this.route.order || "totalrank"}`
      : location.href;
  }
  original() {
    this.settings = saveSettings({ enabled: false });
    this.destroy();
    if (this.nativeURL !== location.href) {
      const target =
        this.route.kind === "search"
          ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(this.route.query || "")}&page=${this.route.page || 1}&order=${this.route.order || "totalrank"}`
          : location.href;
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
    window.__bilioffice = undefined;
  }
}
function showEnable() {
  if (document.getElementById("bilioffice-enable")) return;
  const b = el("button", "", "启用 bilioffice");
  b.id = "bilioffice-enable";
  b.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#1677ff;color:#fff;border:0;border-radius:8px;padding:12px;cursor:pointer";
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
  if (
    !["www.bilibili.com", "search.bilibili.com", "bilibili.com"].includes(
      location.hostname,
    )
  )
    return;
  if (
    !/^\/$|^\/video\/BV\w+\/?$|^\/search$|^\/all$|^\/(c|v|channel)\//.test(
      location.pathname,
    )
  )
    return;
  if (!loadSettings().enabled) {
    showEnable();
    return;
  }
  const app = new App();
  window.__bilioffice = {
    destroy: () => app.destroy(),
    refresh: () => app.render(),
  };
  app.init();
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
