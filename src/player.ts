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
    feishu = false,
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
    const progress = document.createElement("input");
    progress.type = "range";
    progress.className = "bo-playback-progress";
    progress.setAttribute("aria-label", "播放进度");
    progress.min = "0";
    progress.max = "0";
    progress.step = "0.1";
    progress.value = "0";
    progress.disabled = true;
    const clock = document.createElement("output");
    clock.className = "bo-playback-time";
    clock.textContent = "00:00 / --:--";
    const transport = document.createElement("div");
    transport.className = "bo-playback-bar";
    transport.append(progress, clock);
    player.append(frame, transport);
    const status = document.createElement("div");
    status.className = "bo-player-status";
    status.setAttribute("role", "status");
    status.textContent = feishu ? "正在加载视频…" : "正在加载原生播放器…";
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
    type PlaybackState = {
      time: number;
      duration: number;
      paused: boolean;
      seekStart: number;
      seekEnd: number;
    };
    let lastState: PlaybackState | null = null;
    let scrubbing = false;
    let seekRequest = 0;
    let pendingSeek: number | null = null;
    let seekTimeout: ReturnType<typeof setTimeout> | undefined;
    const formatTime = (time: number) => {
      const seconds = Math.max(0, Math.floor(time));
      const h = Math.floor(seconds / 3600);
      return `${h ? h + ":" : ""}${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    };
    const showTime = (time: number) => {
      const total = lastState?.duration
        ? formatTime(lastState.duration)
        : "--:--";
      clock.textContent = `${formatTime(time)} / ${total}`;
      progress.setAttribute("aria-valuetext", `${formatTime(time)} / ${total}`);
    };
    const updateState = (state: PlaybackState) => {
      lastState = state;
      host.dataset.time = String(state.time);
      host.dataset.paused = String(state.paused);
      host.dataset.duration = String(state.duration);
      progress.disabled = state.seekEnd <= state.seekStart;
      if (scrubbing || pendingSeek !== null) return;
      progress.min = String(state.seekStart);
      progress.max = String(state.seekEnd);
      progress.value = String(
        Math.max(state.seekStart, Math.min(state.time, state.seekEnd)),
      );
      showTime(state.time);
    };
    const resetProgress = () => {
      clearTimeout(seekTimeout);
      seekRequest++;
      pendingSeek = null;
      scrubbing = false;
      lastState = null;
      progress.disabled = true;
      progress.min = "0";
      progress.max = "0";
      progress.value = "0";
      host.dataset.time = "0";
      host.dataset.duration = "0";
      host.dataset.paused = "true";
      showTime(0);
    };
    progress.onpointerdown = () => {
      scrubbing = true;
    };
    progress.onpointerup = () => {
      scrubbing = false;
    };
    progress.onpointercancel = () => {
      scrubbing = false;
      if (lastState && pendingSeek === null) updateState(lastState);
    };
    progress.oninput = () => {
      scrubbing = true;
      showTime(Number(progress.value));
    };
    progress.onchange = () => {
      if (progress.disabled) return;
      scrubbing = false;
      const time = Number(progress.value);
      if (!Number.isFinite(time)) return;
      const requestId = ++seekRequest;
      pendingSeek = requestId;
      clearTimeout(seekTimeout);
      seekTimeout = setTimeout(() => {
        if (pendingSeek !== requestId) return;
        pendingSeek = null;
        status.textContent = "定位超时，请重试。";
        if (lastState) updateState(lastState);
      }, 8000);
      frame.contentWindow?.postMessage(
        { channel: CHANNEL, token, type: "seek", time, requestId },
        "https://www.bilibili.com",
      );
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
    button(feishu ? "打开视频" : "原版视频 / 收藏 / 关注", () =>
      openOriginal(video.url),
    );
    button("重试", () => {
      ready = false;
      resetProgress();
      status.textContent = feishu
        ? "正在重新加载视频…"
        : "正在重新加载原生播放器…";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!ready)
          status.textContent = feishu
            ? "视频加载超时，请重试。"
            : "加载超时，可重试或打开原版视频。";
      }, 18000);
      frame.src = url.href;
    });
    host.replaceChildren(player, status, actions, backdrop);
    this.iframe = frame;
    let ready = false;
    let timeout = setTimeout(() => {
      if (!ready)
        status.textContent = feishu
          ? "视频加载超时，请重试。"
          : "加载超时或被原站限制，可重试或打开原版视频。";
    }, 18000);
    const handler = (e: MessageEvent) => {
      if (!validMessage(e, frame, token)) return;
      switch (e.data.type) {
        case "ready":
          ready = true;
          clearTimeout(timeout);
          status.textContent = feishu
            ? "视频已准备好，点击播放器播放"
            : "原生播放器已就绪；使用播放器控制播放";
          break;
        case "state":
          if (ready) updateState(e.data);
          break;
        case "seek:result":
          if (!ready || pendingSeek !== e.data.requestId) break;
          clearTimeout(seekTimeout);
          pendingSeek = null;
          updateState(e.data);
          status.textContent = e.data.ok
            ? e.data.paused
              ? "已定位，视频已暂停"
              : "已定位，继续播放"
            : "当前视频暂时无法定位，请稍后重试。";
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
      clearTimeout(seekTimeout);
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
