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
import { Workspace } from "./components/workspace";
import { wecomIcon, wecomAvatar } from "./components/wecom";
import { interludeAfter, messageTime } from "./components/interludes";
import workspaceCSS from "./styles/workspace.css";
import wecomCSS from "./styles/wecom.css";
import { PlayerSession } from "./player";
import { startBridge, bridgeParams } from "./player/bridge";
declare const __BILIOFFICE_VERSION__: string;
declare const GM_registerMenuCommand:
  | undefined
  | ((name: string, action: () => void) => void);
declare global {
  interface Window {
    __bilioffice?: {
      destroy: () => void;
      refresh: () => void;
      openSettings: () => void;
    };
    __biliofficeBridgeCleanup?: () => void;
    __biliofficeMenuRegistered?: boolean;
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
  rail = el("aside", "bo-app-rail");
  sidebar = el("aside", "bo-sidebar");
  info = el("aside", "bo-info-panel");
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
  workspace = new Workspace();
  nativeURL = location.href;
  autoPage = 1;
  autoPages = 1;
  autoLoading = false;
  autoStalledPages = 0;
  autoFailed = false;
  init() {
    this.root.id = "bilioffice-root";
    this.root.dataset.version = __BILIOFFICE_VERSION__;
    this.root.setAttribute("aria-label", "bilioffice 办公聊天界面");
    document.documentElement.classList.add("bilioffice-active");
    const style = el("style");
    style.id = "bilioffice-style";
    style.textContent = css + extraCSS + modalCSS + workspaceCSS + wecomCSS;
    document.head.append(style);
    this.root.append(this.rail, this.sidebar);
    const main = el("main", "bo-main");
    main.append(this.header, this.chat);
    this.root.append(main, this.info);
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
    window.addEventListener("resize", () => this.maybeLoadNextPage(), {
      signal: this.life.signal,
    });
    this.render();
  }
  button(text: string, fn: () => void, cls = "") {
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
    const railLinks =
      this.settings.theme !== "dingtalk"
        ? ([["⌂", "home", "/"]] as const)
        : ([
            ["⌂", "home", "/"],
            ["▣", "popular", "/v/popular/all"],
            ["◈", "section", "/c/tech/"],
          ] as const);
    for (const [label, kind, url] of railLinks) {
      const b = this.button(label, () =>
        kind === "section"
          ? location.assign(new URL(url, "https://www.bilibili.com").href)
          : this.navigate(url),
      );
      b.dataset.nav = kind;
      b.title =
        kind === "home" ? "推荐" : kind === "popular" ? "热门" : "科技分区";
      b.append(
        el(
          "span",
          "bo-rail-label",
          kind === "home" ? "消息" : kind === "popular" ? "热门" : "分区",
        ),
      );
      if (this.settings.theme === "wecom")
        b.replaceChildren(
          wecomIcon("chat"),
          el("span", "bo-rail-label", "消息"),
        );
      nav.append(b);
    }
    const staticRail =
      this.settings.theme === "wecom"
        ? []
        : this.settings.theme === "feishu"
          ? ["日历", "工作台", "云文档", "知识库", "任务", "联系人", "项目"]
          : ["工作台", "日历", "文档", "会议"];
    staticRail.forEach((label) =>
      nav.append(el("div", "bo-rail-static", label)),
    );
    if (this.settings.theme === "wecom") {
      const nativeApps = [
        ["bot", "智能助理"],
        ["hash", "频道"],
        ["mail", "邮件"],
        ["doc", "文档"],
        ["calendar", "日程"],
        ["check", "待办"],
        ["meeting", "会议"],
        ["bot", "智能机器人"],
        ["grid", "工作台"],
        ["users", "通讯录"],
        ["drive", "微盘"],
        ["upgrade", "高级功能"],
      ];
      nativeApps.forEach(([icon, label], index) => {
        const item = el("div", "bo-rail-static");
        item.append(wecomIcon(icon), el("span", "", label));
        if (index === 0) nav.prepend(item);
        else nav.append(item);
      });
      nav.append(el("div", "wc-rail-groups"));
    }
    this.rail.append(nav);
    const railFooter = el("div", "bo-rail-footer");
    railFooter.append(
      this.button("⚙", () => this.toggleSettings(), "bo-rail-button"),
      this.button("↩", () => this.original(), "bo-rail-button"),
    );
    railFooter
      .querySelectorAll("button")[0]
      .setAttribute("aria-label", "⚙ 设置");
    railFooter
      .querySelectorAll("button")[1]
      .setAttribute("aria-label", "恢复原版");
    if (this.settings.theme === "wecom") {
      const buttons = railFooter.querySelectorAll("button");
      buttons[0].replaceChildren(wecomIcon("settings"));
      buttons[1].replaceChildren(wecomIcon("back"));
    }
    this.rail.append(railFooter);
    this.sidebar.replaceChildren();
    const sidebarHead = el("div", "bo-sidebar-head");
    sidebarHead.append(
      el("strong", "", this.settings.theme === "feishu" ? "消息" : "B站消息"),
      el("span", "", this.settings.theme === "feishu" ? "未读" : "⌄"),
    );
    const sidebarSearch = el("div", "bo-sidebar-search", "⌕ 搜索会话");
    const closeNav = this.button(
      "‹",
      () => this.sidebar.classList.remove("open"),
      "bo-mobile-menu",
    );
    closeNav.setAttribute("aria-label", "收起导航");
    sidebarHead.append(closeNav);
    const conversation = el("div", "bo-conversation bo-conversation-active");
    conversation.append(
      el("span", "bo-avatar", "B"),
      (() => {
        const copy = el("div", "bo-conversation-copy");
        copy.append(
          el(
            "strong",
            "",
            this.settings.theme === "feishu" ? "内容分享群" : "视频助手",
          ),
          el(
            "span",
            "",
            this.settings.theme === "feishu"
              ? "林晓雨：这个视频挺有意思"
              : "仅本地浏览",
          ),
        );
        return copy;
      })(),
      el("time", "", "现在"),
    );
    const local = el("div", "bo-local-conversations");
    local.append(
      el("div", "bo-local-label", "最近会话"),
      ...[
        ["首页推荐", "视频消息", "现在", ""],
        ["搜索结果", "搜索视频", "昨天", ""],
        ["视频详情", "视频评论", "昨天", ""],
        ["热门视频", "热门内容", "昨天", ""],
        ["科技分区", "分区视频", "昨天", ""],
        ["稍后观看", "待观看内容", "昨天", ""],
        ["视频助手", "本地浏览", "昨天", ""],
        ["评论同步", "已加载评论", "昨天", ""],
      ].map(([label, preview, time, unread]) => {
        const row = el("div", "bo-local-row");
        row.append(
          el("span", "bo-local-avatar", label.slice(0, 1)),
          (() => {
            const copy = el("div", "bo-local-copy");
            copy.append(el("strong", "", label), el("span", "", preview));
            return copy;
          })(),
          el("time", "", time),
        );
        if (unread) row.append(el("span", "bo-local-unread", unread));
        return row;
      }),
    );
    const groupNav = el("nav", "bo-group-nav");
    const groupItems = [
      "消息",
      "未读",
      "标记",
      "@我",
      "群聊",
      "单聊",
      "我的企业",
    ];
    groupItems.forEach((item, index) => {
      const row = el(
        "div",
        `bo-group-row${index === 0 ? " active" : ""}`,
        item,
      );
      groupNav.append(row);
    });
    const conversationPane = el("div", "bo-conversation-pane");
    conversationPane.append(
      sidebarHead,
      groupNav,
      sidebarSearch,
      conversation,
      local,
    );
    this.sidebar.append(conversationPane);
    const menu = this.button(
      "☰",
      () => this.sidebar.classList.toggle("open"),
      "bo-mobile-menu",
    );
    menu.setAttribute("aria-label", "展开或收起导航");
    this.header.append(menu, this.heading);
    if (this.settings.theme !== "dingtalk")
      this.header.append(el("span", "bo-header-meta", "12 人"));
    this.header.append(el("div", "bo-header-spacer"));
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
    this.header.append(
      this.button("⋯", () => this.toggleSettings(), "bo-header-menu"),
    );
    sidebarSearch.replaceChildren(form);
    if (this.settings.theme === "feishu") {
      form.classList.add("bo-rail-search");
      this.rail.insertBefore(form, nav);
    }
    const composer = el("form", "bo-composer");
    const composerInput =
      this.settings.theme === "wecom" ? el("textarea") : el("input");
    composerInput.placeholder = "输入消息…";
    composerInput.setAttribute("aria-label", "消息输入");
    const composerButton = this.button("发送", () => {}, "bo-composer-send");
    composerButton.type = "submit";
    if (this.settings.theme === "wecom") {
      composerInput.placeholder = "输入消息…";
      const tools = el("div", "wc-composer-tools");
      for (const [icon, label, action] of [
        [
          "smile",
          "表情",
          () => {
            const old = composer.querySelector(".wc-emoji-picker");
            if (old) {
              old.remove();
              return;
            }
            const picker = el("div", "wc-emoji-picker");
            picker.setAttribute("aria-label", "表情选择");
            for (const emoji of ["🙂", "👍", "👌", "🙏", "🎉", "☕"])
              picker.append(
                this.button(emoji, () => {
                  composerInput.value += emoji;
                  composerInput.dispatchEvent(new Event("input"));
                  composerInput.focus();
                  picker.remove();
                }),
              );
            composer.append(picker);
          },
        ],
        [
          "at",
          "提及成员",
          () => {
            composerInput.value += "@";
            composerInput.dispatchEvent(new Event("input"));
            composerInput.focus();
          },
        ],
        ["quote", "引用最新消息", () => this.workspace.quoteLatest()],
        ["search", "查找视频", () => this.workspace.toggleVideoSearch()],
        ["folder", "群资料", () => this.workspace.toggleDetails()],
      ] as const) {
        const button = this.button("", action);
        button.title = label;
        button.setAttribute("aria-label", label);
        button.append(wecomIcon(icon));
        tools.append(button);
      }
      tools.append(
        el("span", "wc-composer-shortcut", "Enter 发送 · Shift + Enter 换行"),
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
      composerInput.placeholder = "输入消息…";
    };
    this.header.parentElement?.append(composer);
    this.info.replaceChildren();
    const infoHead = el(
      "div",
      "bo-info-head",
      this.settings.theme === "feishu" ? "群详情" : "群公告",
    );
    this.info.append(infoHead);
    const infoSections =
      this.settings.theme === "feishu"
        ? [
            ["群公告", "OpenCode 交流与视频分享"],
            ["群文件", "暂无文件"],
            ["群成员", "11 位成员"],
          ]
        : [
            ["群公告", "B 站视频分享与评论"],
            ["群看板", "最近视频与分区"],
            ["群成员", "视频助手 · 本地会话"],
          ];
    for (const [title, value] of infoSections) {
      const section = el("section", "bo-info-section");
      section.append(
        el("div", "bo-info-title", title),
        el("div", "bo-info-value", value),
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
        this.button("界面设置", () => this.toggleSettings()),
        this.button("恢复原版", () => this.original()),
      );
      this.workspace.attach(
        this.sidebar,
        this.root,
        this.chat,
        this.heading,
        "wecom",
        form,
        controls,
      );
      this.workspace.bindComposer(
        composerInput as HTMLTextAreaElement,
        composerButton,
      );
      this.input.placeholder = "搜索视频";
      const browse = el("div", "wc-browse-links");
      browse.append(
        this.button("首页推荐", () => this.navigate("/")),
        this.button("热门视频", () => this.navigate("/v/popular/all")),
      );
      form.append(browse);
      this.workspace.onOpen = () => this.player.stop();
      const details = this.button(
        "☷",
        () => this.workspace.toggleDetails(),
        "wc-details-toggle",
      );
      details.setAttribute("aria-label", "会话详情");
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
        "wc-info-toggle",
      );
      infoToggle.setAttribute("aria-label", "展开或收起群信息");
      infoToggle.setAttribute(
        "aria-expanded",
        String(!this.root.classList.contains("wc-hide-info")),
      );
      infoToggle.append(wecomIcon("list"));
      this.header.append(infoToggle);
      details.replaceChildren(wecomIcon("users"));
      this.header.append(details);
    }
    if (this.settings.theme === "feishu") {
      this.workspace.attach(this.sidebar, this.root, this.chat, this.heading);
      this.heading.textContent = "产品体验交流";
      this.input.placeholder = "搜索";
      this.input.value = this.route.query || "";
      this.root.querySelector(".bo-brand-icon")!.textContent = "林";
    }
  }
  apply() {
    applyTheme(this.root, this.settings.theme, this.settings.appearance);
    this.root.classList.toggle("bo-hidden-media", this.settings.hideMedia);
    this.root.querySelector(".bo-brand-icon")!.textContent =
      this.settings.theme !== "dingtalk"
        ? "林"
        : themes[this.settings.theme].icon;
    if (this.settings.theme === "wecom")
      this.root
        .querySelector(".bo-brand-icon")!
        .replaceChildren(wecomAvatar("林沐"));
    for (const avatar of this.root.querySelectorAll<HTMLElement>(
      "[data-avatar]",
    ))
      if (this.settings.theme === "wecom" && !this.settings.disguise)
        avatar.replaceChildren(
          wecomAvatar(
            avatar
              .closest(".bo-message")
              ?.querySelector<HTMLElement>("[data-author]")?.dataset.author ||
              avatar.dataset.avatar!,
          ),
        );
      else
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
    const choices = (
      title: string,
      key: "theme" | "appearance",
      options: [string, string][],
    ) => {
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
            optionsRow
              .querySelectorAll<HTMLElement>("button")
              .forEach((b) =>
                b.setAttribute(
                  "aria-pressed",
                  String(b.dataset.value === value),
                ),
              );
          },
          "bo-setting-option",
        );
        option.dataset.value = value;
        option.setAttribute(
          "aria-pressed",
          String(value === this.settings[key]),
        );
        optionsRow.append(option);
      }
      group.append(optionsRow);
      p.append(group);
    };
    choices("主题", "theme", [
      ["wecom", "企业微信"],
      ["dingtalk", "钉钉"],
      ["feishu", "飞书"],
    ]);
    choices("外观", "appearance", [
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
      el("p", "bo-version", `bilioffice v${__BILIOFFICE_VERSION__}`),
    );
    this.root.append(p);
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
      home: this.settings.theme === "feishu" ? "产品体验交流" : "推荐会话",
      popular: this.settings.theme === "feishu" ? "产品体验交流" : "热门视频",
      section: this.settings.theme === "feishu" ? "产品体验交流" : "分区视频",
      search: this.settings.theme === "feishu" ? "产品体验交流" : "搜索结果",
      video: this.settings.theme === "feishu" ? "产品体验交流" : "视频会话",
    }[this.route.kind];
    if (this.settings.theme === "wecom")
      this.heading.textContent = "产品研发交流群";
    this.root
      .querySelectorAll<HTMLElement>("[data-nav]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          this.settings.theme === "wecom"
            ? b.dataset.nav === "home"
            : b.dataset.nav === this.route.kind,
        ),
      );
    this.chat.replaceChildren();
    const toolbar = el("div", "bo-toolbar");
    toolbar.append(
      el(
        "h2",
        "",
        this.route.kind === "search"
          ? `“${this.route.query || ""}”`
          : this.settings.theme === "feishu"
            ? "今天"
            : "今天 · 视频消息",
      ),
    );
    toolbar.append(
      this.settings.theme === "feishu"
        ? this.button("↻", () => this.render(), "bo-icon-action")
        : this.button("返回推荐", () => this.navigate("/")),
      this.settings.theme === "feishu"
        ? this.button("⋯", () => {}, "bo-icon-action")
        : this.button("刷新", () => this.render()),
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
    if (this.settings.theme !== "dingtalk") {
      const intro = el("div", "fs-feed-intro");
      for (const message of this.workspace.conversations.find(
        (c) => c.id === "share",
      )!.messages) {
        const row = el("div", `fs-message${message.self ? " fs-self" : ""}`);
        const avatar = el(
          "span",
          "fs-avatar",
          message.self && this.settings.theme === "wecom"
            ? "林"
            : message.author.slice(0, 1),
        );
        avatar.style.setProperty("--fs-avatar-color", "#528ac7");
        if (this.settings.theme === "wecom")
          avatar.replaceChildren(
            wecomAvatar(message.self ? "林沐" : message.author),
          );
        const body = el("div", "fs-message-body");
        body.append(
          el("div", "fs-message-meta", `${message.author}　${message.time}`),
          el("div", "fs-text-bubble", message.text),
        );
        if (message.quote && this.settings.theme === "wecom") {
          const quote = el("blockquote", "wc-quoted-message");
          quote.append(
            el("strong", "", `${message.quote.author}：`),
            el("div", "", message.quote.text),
          );
          body.querySelector(".fs-text-bubble")!.prepend(quote);
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
      this.autoPages = result.items.length ? result.pages : this.autoPage;
      this.chat.addEventListener("scroll", () => this.maybeLoadNextPage(), {
        signal,
      });
      this.updatePagination();
      this.queueAutoLoad(signal);
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
  updatePagination() {
    let pager = this.chat.querySelector<HTMLElement>(".bo-pagination");
    if (!pager && this.autoPages <= 1) return;
    if (!pager) {
      pager = el("div", "bo-pagination");
      this.chat.append(pager);
    }
    const prev = this.button("上一页", () => this.page(this.autoPage - 1));
    const next = this.button("下一页", () => this.page(this.autoPage + 1));
    prev.disabled = this.autoPage <= 1;
    next.disabled = this.autoPage >= this.autoPages;
    pager.replaceChildren(
      prev,
      el(
        "span",
        "",
        this.route.kind === "search"
          ? `第 ${this.autoPage} / ${this.autoPages} 页`
          : `已加载至第 ${this.autoPage} 页`,
      ),
      next,
    );
  }
  queueAutoLoad(signal: AbortSignal) {
    requestAnimationFrame(() => {
      if (!signal.aborted) this.maybeLoadNextPage();
    });
  }
  maybeLoadNextPage() {
    if (
      this.autoLoading ||
      this.autoFailed ||
      !this.chat.clientHeight ||
      this.route.kind === "video" ||
      this.autoPage >= this.autoPages ||
      this.chat.scrollTop + this.chat.clientHeight <
        this.chat.scrollHeight - 280
    )
      return;
    void this.loadNextPage();
  }
  async loadNextPage() {
    if (this.autoLoading || this.autoPage >= this.autoPages) return;
    const signal = this.controller.signal;
    this.autoLoading = true;
    this.autoFailed = false;
    const nextPage = this.autoPage + 1;
    const loading = el("div", "bo-auto-loading", "正在加载更多消息…");
    this.list.querySelector(".bo-auto-loading")?.remove();
    this.list.append(loading);
    let loaded = false;
    try {
      const result = await fetchVideos(
        { ...this.route, page: nextPage },
        signal,
      );
      if (signal.aborted) return;
      const before = this.cards.size;
      if (
        this.route.kind === "home" &&
        !this.list.querySelector(".bo-feed-source")
      ) {
        this.list.append(
          el("div", "bo-day bo-feed-source", "继续浏览 · 热门视频"),
        );
      }
      this.sync(result.items);
      this.autoStalledPages =
        this.cards.size === before ? this.autoStalledPages + 1 : 0;
      this.autoPage = nextPage;
      this.autoPages =
        !result.items.length || this.autoStalledPages >= 2
          ? nextPage
          : result.pages;
      this.updatePagination();
      loaded = true;
    } catch {
      if (!signal.aborted) {
        this.autoFailed = true;
        loading.textContent = "加载更多失败";
        loading.append(
          this.button("重试加载更多", () => {
            void this.loadNextPage();
          }),
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
  page(page: number) {
    if (this.route.kind === "home" && page === 1) {
      void this.render();
      return;
    }
    this.navigate(
      this.route.kind === "search"
        ? `/search?keyword=${encodeURIComponent(this.route.query || "")}&page=${page}&order=${this.route.order || "totalrank"}`
        : `/v/popular/all?pn=${this.route.kind === "home" ? Math.max(1, page - 1) : page}`,
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
      if (this.route.kind !== "video") {
        const message = interludeAfter(this.cards.size);
        if (message) {
          const row = el("article", "bo-message bo-local-message");
          const avatar = el("span", "bo-avatar");
          avatar.dataset.avatar = message.author.slice(0, 1);
          avatar.textContent = this.settings.disguise
            ? "同"
            : avatar.dataset.avatar;
          if (this.settings.theme === "wecom" && !this.settings.disguise)
            avatar.replaceChildren(wecomAvatar(message.author));
          const content = el("div", "bo-message-content");
          const meta = el("div", "bo-message-meta");
          const author = el(
            "strong",
            "",
            this.settings.disguise ? "项目同事" : message.author,
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
    const feishuSpeakers = ["林晓雨", "王晨", "陈思远", "周宁"];
    const speaker =
      this.settings.theme !== "dingtalk"
        ? feishuSpeakers[this.cards.size % feishuSpeakers.length]
        : v.author.name;
    const avatar = el(
      "span",
      "bo-avatar",
      this.settings.disguise
        ? "同"
        : this.settings.theme !== "dingtalk"
          ? speaker.slice(0, 1)
          : v.author.name.slice(0, 1),
    );
    avatar.dataset.avatar =
      this.settings.theme !== "dingtalk"
        ? speaker.slice(0, 1)
        : v.author.name.slice(0, 1);
    if (this.settings.theme === "wecom" && !this.settings.disguise)
      avatar.replaceChildren(wecomAvatar(speaker));
    const content = el("div", "bo-message-content"),
      meta = el("div", "bo-message-meta");
    const author = el(
      "strong",
      "",
      this.settings.disguise ? "项目同事" : speaker,
    );
    author.dataset.author = speaker;
    meta.append(
      author,
      el(
        "span",
        "",
        this.settings.theme !== "dingtalk"
          ? messageTime(this.cards.size)
          : v.published || "视频分享",
      ),
    );
    const bubble = el("div", "bo-bubble"),
      card = el("div", "bo-video-card"),
      cover = el("div", "bo-cover");
    const img = el("img");
    img.alt = `${v.title} 封面`;
    img.referrerPolicy = "no-referrer";
    img.onload = () => (cover.dataset.loaded = "true");
    img.onerror = () => {
      img.dataset.error = "true";
      img.hidden = true;
      placeholder.textContent = "封面加载失败";
    };
    const placeholder = el(
      "span",
      "bo-cover-placeholder",
      v.cover ? "封面加载中" : "暂无封面",
    );
    img.hidden = !v.cover;
    if (v.cover) img.src = v.cover;
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
        this.settings.theme !== "dingtalk"
          ? `${v.duration || "03:12"} · 视频消息`
          : `播放 ${v.views || "—"}　时长 ${v.duration || "—"}`,
      ),
    );
    card.append(cover, info);
    const controls = el("div", "bo-player-actions");
    controls.append(
      this.button(
        this.settings.theme !== "dingtalk" ? "打开视频" : "原版视频 / 评论",
        () => openOriginal(v.url),
      ),
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
        this.settings.theme !== "dingtalk",
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
    openSettings: () => {
      if (!app.panel) app.toggleSettings();
    },
  };
  app.init();
}
function registerMenu() {
  if (
    window.top !== window.self ||
    typeof GM_registerMenuCommand !== "function" ||
    window.__biliofficeMenuRegistered
  )
    return;
  window.__biliofficeMenuRegistered = true;
  for (const theme of ["feishu", "wecom", "dingtalk"] as const) {
    GM_registerMenuCommand(
      `切换到${themes[theme].name} · v${__BILIOFFICE_VERSION__}`,
      () => {
        saveSettings({ theme, enabled: true });
        document.getElementById("bilioffice-enable")?.remove();
        boot();
      },
    );
  }
  GM_registerMenuCommand(`打开界面设置 · v${__BILIOFFICE_VERSION__}`, () => {
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
