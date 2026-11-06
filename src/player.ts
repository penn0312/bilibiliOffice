import type { VideoItem, Comment } from "./types";
import { openOriginal, originalVideo } from "./adapters/bilibili";
import { CHANNEL, validMessage } from "./player/bridge";
export class PlayerSession {
  iframe: HTMLIFrameElement | null = null;
  currentId = "";
  private cleanup?: () => void;
  private more?: () => void;
  private sync?: () => void;
  mount(
    host: HTMLElement,
    video: VideoItem,
    onStop: () => void,
    onComments: (comments: Comment[]) => void,
    onCommentError: (message: string) => void,
  ) {
    this.stop();
    const token = crypto.randomUUID();
    this.currentId = video.id;
    const player = document.createElement("div");
    player.className = "bo-player";
    const frame = document.createElement("iframe");
    frame.title = `播放：${video.title}`;
    frame.allow = "autoplay; fullscreen; picture-in-picture";
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation",
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
    status.textContent = "正在加载原生播放器…";
    const actions = document.createElement("div");
    actions.className = "bo-player-actions";
    const button = (text: string, fn: () => void) => {
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
    const zoom = button("放大", () => setLarge(!large));
    zoom.setAttribute("aria-label", "放大或还原播放器");
    const setLarge = (value: boolean) => {
      large = value;
      player.classList.toggle("bo-expanded", value);
      backdrop.hidden = !value;
      zoom.textContent = value ? "还原" : "放大";
    };
    backdrop.hidden = true;
    backdrop.onclick = () => setLarge(false);
    button("关闭", () => this.stop());
    button("原版视频 / 收藏 / 关注", () => openOriginal(video.url));
    button("重试", () => {
      ready = false;
      status.textContent = "正在重新加载原生播放器…";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!ready) status.textContent = "加载超时，可重试或打开原版视频。";
      }, 18000);
      frame.src = url.href;
    });
    host.replaceChildren(player, status, actions, backdrop);
    this.iframe = frame;
    let ready = false;
    let timeout = setTimeout(() => {
      if (!ready)
        status.textContent = "加载超时或被原站限制，可重试或打开原版视频。";
    }, 18000);
    const handler = (e: MessageEvent) => {
      if (!validMessage(e, frame, token)) return;
      switch (e.data.type) {
        case "ready":
          ready = true;
          clearTimeout(timeout);
          status.textContent = "原生播放器已就绪；使用播放器控制播放";
          break;
        case "state":
          host.dataset.time = String(e.data.time);
          host.dataset.paused = String(e.data.paused);
          break;
        case "blocked":
          status.textContent = "自动播放被浏览器阻止，请在播放器中点击播放。";
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLarge(false);
    };
    window.addEventListener("message", handler);
    window.addEventListener("keydown", onKey);
    this.sync = () =>
      frame.contentWindow?.postMessage(
        { channel: CHANNEL, token, type: "comments:sync" },
        "https://www.bilibili.com",
      );
    this.more = () =>
      frame.contentWindow?.postMessage(
        { channel: CHANNEL, token, type: "comments:more" },
        "https://www.bilibili.com",
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
    this.cleanup = undefined;
    this.more = undefined;
    this.sync = undefined;
    this.iframe = null;
    this.currentId = "";
    cleanup?.();
  }
  hide() {
    this.stop();
  }
}
