import { wecomIcon, wecomAvatar } from "./wecom";
type Filter = "all" | "unread" | "mention" | "starred" | "single" | "group";
interface Message {
  author: string;
  text: string;
  time: string;
  mention?: boolean;
  self?: boolean;
  quote?: { author: string; text: string };
}
interface Conversation {
  id: string;
  name: string;
  members?: number;
  color: string;
  unread: number;
  starred?: boolean;
  muted?: boolean;
  messages: Message[];
}
const node = (tag: string, cls: string, text = "") => {
  const element = document.createElement(tag);
  element.className = cls;
  element.textContent = text;
  return element;
};
const conversation = (
  id: string,
  name: string,
  color: string,
  unread: number,
  messages: Message[],
  extra: Partial<Conversation> = {},
): Conversation => ({ id, name, color, unread, messages, ...extra });
const seed = (): Conversation[] => [
  conversation(
    "review",
    "客户工作台 · 项目组",
    "#6479c8",
    4,
    [
      {
        author: "李想",
        text: "客户工作台的验收清单更新好了，大家看看还有没有遗漏。",
        time: "09:18",
      },
      {
        author: "王晨",
        text: "补了空状态和权限不足两个场景，接口联调下午可以开始。",
        time: "09:21",
      },
      {
        author: "李想",
        text: "@林沐 筛选项的交互麻烦再确认一下，今天 15:00 前给个结论就行。",
        time: "09:26",
        mention: true,
      },
      {
        author: "孙悦",
        text: "设计稿里的说明也补上了，按最新一版走。",
        time: "09:32",
      },
    ],
    { members: 18, starred: true },
  ),
  conversation(
    "design",
    "设计与研发对齐",
    "#cb9860",
    2,
    [
      {
        author: "孙悦",
        text: "列表密度调到了 64px，长标题统一省略，完整内容 hover 展示。",
        time: "09:10",
      },
      { author: "王晨", text: "收到，这版我先合到测试环境。", time: "09:15" },
      {
        author: "孙悦",
        text: "@林沐 有空帮看一下详情页的间距，右侧面板我标了两处。",
        time: "09:28",
        mention: true,
      },
    ],
    { members: 9, starred: true },
  ),
  conversation(
    "share",
    "产品体验交流",
    "#528ac7",
    0,
    [
      {
        author: "林晓雨",
        text: "上午的评审纪要已经整理好了，结论放在文档最后一页。",
        time: "09:40",
      },
      {
        author: "陈思远",
        text: "收到。我找了几个相关的例子，放群里大家有空看一下。",
        time: "09:42",
      },
    ],
    { members: 12, starred: true },
  ),
  conversation("lin", "林晓雨", "#b388b8", 1, [
    {
      author: "林晓雨",
      text: "周报模板我发你了，这周新增的两个指标在第二张表。",
      time: "09:07",
    },
    {
      author: "林晓雨",
      text: "你方便的时候补一下研发进度就好，不着急。",
      time: "09:12",
    },
  ]),
  conversation(
    "release",
    "本周发布协调",
    "#57a999",
    3,
    [
      {
        author: "周宁",
        text: "今晚发布窗口 20:00—20:30，回滚方案请在下班前确认。",
        time: "08:58",
      },
      {
        author: "陈思远",
        text: "灰度名单已更新，测试环境验证通过。",
        time: "09:05",
      },
      { author: "周宁", text: "收到，下午再过一次 checklist。", time: "09:16" },
    ],
    { members: 26, muted: true },
  ),
  conversation("chen", "陈思远", "#629da5", 0, [
    {
      author: "我",
      text: "日志看到了，是旧缓存，清理后再试一下。",
      time: "昨天",
      self: true,
    },
    { author: "陈思远", text: "可以了，感谢！", time: "昨天" },
  ]),
  conversation(
    "lunch",
    "午饭搭子",
    "#d89954",
    2,
    [
      { author: "王晨", text: "中午去楼下那家面馆？", time: "昨天" },
      { author: "林晓雨", text: "可以，十二点电梯口见。", time: "昨天" },
    ],
    { members: 7, muted: true },
  ),
  conversation(
    "weekly",
    "每周技术分享",
    "#7882ae",
    0,
    [
      {
        author: "周宁",
        text: "本周四的分享改到 16:00，还是 302 会议室。",
        time: "周五",
      },
      {
        author: "王晨",
        text: "日历邀请已更新，大家记得接受一下。",
        time: "周五",
      },
    ],
    { members: 31 },
  ),
];

const wecomSeed = (): Conversation[] => {
  const items = seed();
  items.find((c) => c.id === "share")!.name = "产品研发交流群";
  items.find((c) => c.id === "share")!.messages = [
    {
      author: "林晓雨",
      text: "上午评审的结论放到群公告了，排期有变动的话在群里说一声。",
      time: "09:40",
    },
    {
      author: "我",
      text: "收到，下午把剩下两个页面走一遍。",
      time: "09:41",
      self: true,
      quote: { author: "林晓雨", text: "排期有变动的话在群里说一声。" },
    },
    {
      author: "陈思远",
      text: "刚看到几个不错的案例，分享过来，大家有空看看。",
      time: "09:42",
    },
  ];
  items
    .find((c) => c.id === "review")!
    .messages.unshift({
      author: "我",
      text: "昨天提的筛选问题修好了，我再核一下验收清单。",
      time: "09:16",
      self: true,
    });
  return items;
};

/** Local display data only. No messages are sent to external services. */
export class Workspace {
  conversations = seed();
  private theme: "feishu" | "wecom" = "feishu";
  private wecomConversations = wecomSeed();
  private feishuConversations = this.conversations;
  private query = "";
  private videoSearch: HTMLElement | null = null;
  private controls: HTMLElement | null = null;
  private videoSearchOpen = false;
  private drafts = new Map<string, string>();
  private quotes = new Map<string, NonNullable<Message["quote"]>>();
  private composerInput: HTMLTextAreaElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  onOpen: (() => void) | null = null;
  selected = "share";
  filter: Filter = "all";
  private sidebar!: HTMLElement;
  private root!: HTMLElement;
  private chat!: HTMLElement;
  private heading!: HTMLElement;
  private panel: HTMLElement | null = null;
  private badge: HTMLElement | null = null;
  attach(
    sidebar: HTMLElement,
    root: HTMLElement,
    chat: HTMLElement,
    heading: HTMLElement,
    theme: "feishu" | "wecom" = "feishu",
    videoSearch: HTMLElement | null = null,
    controls: HTMLElement | null = null,
  ) {
    this.theme = theme;
    this.videoSearch = videoSearch;
    this.controls = controls;
    this.conversations =
      theme === "wecom" ? this.wecomConversations : this.feishuConversations;
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
    this.root
      .querySelector(".wc-details-toggle")
      ?.setAttribute("aria-expanded", "false");
    this.selected = "share";
    if (this.composerInput)
      this.composerInput.value = this.drafts.get("share") || "";
    this.updateSend();
    this.renderQuote();
    this.panel?.remove();
    this.panel = null;
    this.chat.hidden = false;
    this.heading.textContent = this.conversations.find(
      (c) => c.id === "share",
    )!.name;
    const meta = this.root.querySelector(".bo-header-meta");
    if (meta) meta.textContent = "12 人";
    this.render();
  }
  private totals() {
    return {
      unread: this.conversations.reduce((sum, c) => sum + c.unread, 0),
      mention: this.conversations.filter(
        (c) => c.unread && c.messages.some((m) => m.mention),
      ).length,
      starred: this.conversations.filter((c) => c.starred).length,
    };
  }
  private button(text: string, action: () => void, cls = "") {
    const b = node("button", cls, text) as HTMLButtonElement;
    b.type = "button";
    b.onclick = action;
    return b;
  }
  private avatar(c: Conversation) {
    const avatar = node("span", "fs-avatar", c.name.slice(0, 1));
    avatar.style.setProperty("--fs-avatar-color", c.color);
    if (c.members) {
      avatar.textContent = "";
      avatar.classList.add("fs-group-avatar");
      const letters =
        this.theme === "wecom"
          ? [
              ...new Set([
                ...c.messages.map((m) =>
                  m.self ? "林" : m.author.slice(0, 1),
                ),
                "林",
                "王",
                "陈",
              ]),
            ].slice(0, 4)
          : ["李", "林", "陈", "王"];
      for (const letter of letters) avatar.append(node("i", "", letter));
    }
    if (this.theme === "wecom") {
      if (c.members) {
        avatar.replaceChildren();
        for (const name of [
          ...new Set([
            ...c.messages.map((m) => m.author),
            "李想",
            "王晨",
            "周宁",
            "孙悦",
            "林晓雨",
            "陈思远",
            "许嘉宁",
            "赵一帆",
            "陆远",
          ]),
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
  private renderInfo() {
    if (this.theme !== "wecom") return;
    const info = this.root.querySelector<HTMLElement>(".bo-info-panel");
    if (!info) return;
    info.setAttribute("aria-label", "群信息");
    const c = this.conversations.find((c) => c.id === this.selected)!;
    info.replaceChildren();
    if (!c.members) {
      info.append(
        node("h3", "wc-contact-title", "联系人资料"),
        this.avatar(c),
        node("strong", "wc-contact-title", c.name),
        node("p", "wc-info-muted", "企业联系人"),
      );
      return;
    }
    const announcements = document.createElement("details");
    announcements.className = "wc-info-announcements";
    announcements.open = true;
    announcements.append(node("summary", "", "群公告"));
    for (const title of [
      "本周项目排期与交付计划",
      "联调环境使用说明",
      "发布检查清单",
    ]) {
      const item = node("p", "wc-info-document");
      item.append(wecomIcon("doc"), node("span", "", title));
      announcements.append(item);
    }
    const board = document.createElement("details");
    board.className = "wc-info-board";
    board.append(
      node("summary", "", "群看板"),
      node("p", "wc-info-muted", "验收清单已更新，下午同步联调进度。"),
    );
    const members = node("section", "wc-info-members");
    members.append(node("h3", "", `群成员 · ${c.members}`));
    const names = [
      ...new Set([
        ...c.messages.map((m) => (m.self ? "林沐" : m.author)),
        "林沐",
        "李想",
        "王晨",
        "孙悦",
        "周宁",
        "陈思远",
        "林晓雨",
        "许嘉宁",
        "赵一帆",
        "沈知行",
        "唐可",
        "陆远",
      ]),
    ].slice(0, Math.min(c.members, 12));
    names.forEach((name, index) => {
      const row = node("div", "wc-info-member");
      row.append(wecomIcon("user"), node("span", "", name));
      if (index === 0) row.append(node("small", "", "群主"));
      members.append(row);
    });
    if (c.members > names.length)
      members.append(node("p", "wc-info-muted", `等 ${c.members} 位成员`));
    info.append(announcements, board, members);
  }
  private render() {
    this.renderInfo();
    const totals = this.totals();
    if (this.badge) {
      this.badge.textContent = String(totals.unread);
      this.badge.hidden = !totals.unread;
    }
    const filters = node("nav", "fs-filters");
    filters.setAttribute("aria-label", "消息筛选");
    const choices: [Filter, string, number | null][] =
      this.theme === "wecom"
        ? [
            ["all", "全部消息", null],
            ["unread", "未读", totals.unread],
            ["mention", "@我", totals.mention],
            [
              "single",
              "单聊",
              this.conversations.filter((c) => !c.members).length,
            ],
            [
              "group",
              "群聊",
              this.conversations.filter((c) => !!c.members).length,
            ],
            ["starred", "置顶", totals.starred],
          ]
        : [
            ["all", "消息", null],
            ["unread", "未读", totals.unread],
            ["mention", "@我", totals.mention],
            ["starred", "标记", totals.starred],
          ];
    for (const [key, label, count] of choices) {
      const b = this.button(
        label,
        () => {
          this.filter = key;
          this.render();
        },
        "fs-filter",
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
              group: "users",
            }[key],
          ),
        );
      b.dataset.filter = key;
      b.setAttribute("aria-pressed", String(this.filter === key));
      if (count) b.append(node("span", "fs-filter-count", String(count)));
      filters.append(b);
    }
    const pins = node("div", "fs-pins");
    for (const c of this.conversations.filter((c) => c.starred)) {
      const pin = this.button("", () => this.open(c), "fs-pin");
      pin.title = c.name;
      pin.append(this.avatar(c), node("span", "", c.name.split(" · ")[0]));
      pins.append(pin);
    }
    const rows = node("div", "fs-conversations");
    rows.setAttribute("aria-label", "会话列表");
    const visible = this.conversations.filter(
      (c) =>
        this.filter === "all" ||
        (this.filter === "unread" && c.unread > 0) ||
        (this.filter === "mention" &&
          c.unread > 0 &&
          c.messages.some((m) => m.mention)) ||
        (this.filter === "starred" && c.starred) ||
        (this.filter === "single" && !c.members) ||
        (this.filter === "group" && !!c.members),
    );
    const matched = visible.filter(
      (c) =>
        !this.query ||
        `${c.name} ${c.messages.map((m) => m.text).join(" ")}`.includes(
          this.query,
        ),
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
            c.muted ? "" : String(c.unread),
          ),
        );
      const copy = node("span", "fs-conversation-copy");
      copy.append(node("strong", "", c.name));
      const last = c.messages[c.messages.length - 1];
      const preview = node("span", "fs-preview");
      if (c.unread && c.messages.some((m) => m.mention))
        preview.append(node("em", "", "[有人@我] "));
      preview.append(
        document.createTextNode(
          `${c.members ? last.author + "：" : ""}${last.text}`,
        ),
      );
      copy.append(preview);
      const meta = node("span", "fs-conversation-meta");
      meta.append(
        node("time", "", last.time),
        node("span", "", c.muted ? "免打扰" : c.starred ? "置顶" : ""),
      );
      if (this.theme === "wecom") {
        row.title = `${c.name}\n${last.author}：${last.text}`;
        const status = meta.querySelector("span")!;
        status.replaceChildren();
        if (c.muted) {
          status.append(wecomIcon("mute"));
          status.setAttribute("aria-label", "免打扰");
        } else if (c.starred) {
          status.append(wecomIcon("pin"));
          status.setAttribute("aria-label", "置顶");
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
          this.query ? "没有找到相关会话" : "没有待处理的消息",
        ),
      );
    const close = this.button(
      "‹",
      () => this.sidebar.classList.remove("open"),
      "bo-mobile-menu",
    );
    close.setAttribute("aria-label", "收起导航");
    const head = node("div", "fs-list-head");
    head.append(node("strong", "", "消息"), close);
    if (this.theme === "wecom") {
      head.querySelector("strong")!.textContent = "消息";
      const search = document.createElement("input");
      search.type = "search";
      search.className = "wc-conversation-search";
      search.placeholder = "搜索";
      search.setAttribute("aria-label", "搜索会话");
      search.value = this.query;
      let composing = false;
      const updateSearch = () => {
        if (composing) return;
        this.query = search.value;
        this.render();
        const next = this.sidebar.querySelector<HTMLInputElement>(
          ".wc-conversation-search",
        )!;
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
        "wc-search-add",
      );
      add.append(wecomIcon("plus"));
      add.setAttribute("aria-label", "搜索视频");
      add.setAttribute("aria-expanded", String(this.videoSearchOpen));
      searchHead.append(searchBox, add, close);
      const searchTools = node("div", "wc-search-tools");
      searchTools.hidden = !this.videoSearchOpen;
      if (this.videoSearch) searchTools.append(this.videoSearch);
      const railGroups = this.root.querySelector(".wc-rail-groups");
      const mobileFilters = filters.cloneNode(true) as HTMLElement;
      mobileFilters.classList.add("wc-mobile-filters");
      mobileFilters
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach(
          (b, i) =>
            (b.onclick = () =>
              (
                filters.querySelectorAll("button")[i] as HTMLButtonElement
              ).click()),
        );
      railGroups?.replaceChildren(
        node("div", "wc-group-label", "分组"),
        filters,
      );
      this.sidebar.replaceChildren(
        searchHead,
        searchTools,
        mobileFilters,
        rows,
      );
      if (this.controls) this.sidebar.append(this.controls);
    } else this.sidebar.replaceChildren(head, filters, pins, rows);
  }
  bindComposer(input: HTMLTextAreaElement, button: HTMLButtonElement) {
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
    const c = this.conversations.find((c) => c.id === this.selected)!;
    const last = c.messages[c.messages.length - 1];
    this.quotes.set(c.id, { author: last.author, text: last.text });
    this.renderQuote();
    this.composerInput?.focus();
  }
  private renderQuote() {
    const composer = this.composerInput?.closest("form");
    if (!composer) return;
    composer.querySelector(".wc-compose-quote")?.remove();
    const quote = this.quotes.get(this.selected);
    if (!quote) return;
    const preview = node("div", "wc-compose-quote");
    const cancel = this.button("×", () => {
      this.quotes.delete(this.selected);
      this.renderQuote();
    });
    cancel.setAttribute("aria-label", "取消引用");
    preview.append(node("span", "", `${quote.author}：${quote.text}`), cancel);
    composer.append(preview);
  }
  private updateSend() {
    if (this.sendButton)
      this.sendButton.disabled = !this.composerInput?.value.trim();
  }
  send(text: string) {
    if (!text.trim()) return;
    const c = this.conversations.find((c) => c.id === this.selected)!;
    const time = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const quote = this.quotes.get(c.id);
    c.messages.push({
      author: "我",
      text: text.trim(),
      time,
      self: true,
      ...(quote ? { quote } : {}),
    });
    this.quotes.delete(c.id);
    this.renderQuote();
    this.drafts.delete(c.id);
    if (this.composerInput) this.composerInput.value = "";
    this.updateSend();
    if (c.id === "share") {
      const row = node("article", "fs-message fs-self wc-local-sent");
      const avatar = node("span", "fs-avatar", "");
      avatar.append(wecomAvatar("林沐"));
      const body = node("div", "fs-message-body");
      body.append(
        node("div", "fs-message-meta", `我　${time}`),
        node("div", "fs-text-bubble", text.trim()),
      );
      if (quote) {
        const block = node("blockquote", "wc-quoted-message");
        block.append(
          node("strong", "", `${quote.author}：`),
          node("div", "", quote.text),
        );
        body.querySelector(".fs-text-bubble")!.prepend(block);
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
    const c = this.conversations.find((c) => c.id === this.selected)!;
    const panel = node("section", "wc-details");
    panel.setAttribute("aria-label", "会话详情");
    const close = this.button("关闭", () => this.toggleDetails());
    const title = node("strong", "", c.name);
    const pin = this.button(c.starred ? "取消置顶" : "置顶会话", () => {
      c.starred = !c.starred;
      panel.remove();
      this.render();
      this.toggleDetails();
    });
    const mute = this.button(c.muted ? "关闭免打扰" : "消息免打扰", () => {
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
      node("p", "", c.members ? `群成员 · ${c.members} 人` : "企业联系人"),
      pin,
      mute,
      node("h4", "", "群公告"),
      node(
        "p",
        "",
        c.members
          ? "项目进展请及时同步；评审结论和排期以文档最新版为准。"
          : "暂无公告",
      ),
    );
    this.root.append(panel);
  }
  private open(c: Conversation) {
    this.root.querySelector(".wc-details")?.remove();
    this.root
      .querySelector(".wc-details-toggle")
      ?.setAttribute("aria-expanded", "false");
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
    if (meta) meta.textContent = c.members ? `${c.members} 人` : "企业联系人";
    this.chat.hidden = c.id !== "share";
    if (c.id === "share") return;
    const panel = node("div", "fs-history");
    panel.append(
      node(
        "div",
        "fs-history-day",
        ["昨天", "周五"].includes(c.messages[0].time)
          ? c.messages[0].time
          : "今天",
      ),
    );
    c.messages.forEach((m, index) => {
      if (unread && index === Math.max(0, c.messages.length - unread))
        panel.append(node("div", "fs-unread-divider", "以下是新消息"));
      const row = node("article", `fs-message${m.self ? " fs-self" : ""}`);
      const avatar = node(
        "span",
        "fs-avatar",
        m.self && this.theme === "wecom" ? "林" : m.author.slice(0, 1),
      );
      avatar.style.setProperty("--fs-avatar-color", c.color);
      if (this.theme === "wecom")
        avatar.replaceChildren(wecomAvatar(m.self ? "林沐" : m.author));
      const body = node("div", "fs-message-body");
      body.append(node("div", "fs-message-meta", `${m.author}　${m.time}`));
      const bubble = node("div", "fs-text-bubble");
      if (m.quote && this.theme === "wecom") {
        const quote = node("blockquote", "wc-quoted-message");
        quote.append(
          node("strong", "", `${m.quote.author}：`),
          node("div", "", m.quote.text),
        );
        bubble.append(quote);
      }
      if (m.mention) {
        const parts = m.text.split("@林沐");
        bubble.append(
          document.createTextNode(parts[0]),
          node("mark", "fs-mention", "@林沐"),
          document.createTextNode(parts.slice(1).join("@林沐")),
        );
      } else bubble.append(document.createTextNode(m.text));
      body.append(bubble);
      row.append(avatar, body);
      panel.append(row);
    });
    this.chat.after(panel);
    this.panel = panel;
  }
}
