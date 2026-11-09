import { watchComments, loadMore } from "../adapters/bilibili/comments";
export const CHANNEL = "bilioffice:v1";
const parents = new Set([
  "https://www.bilibili.com",
  "https://search.bilibili.com",
  "https://bilibili.com",
]);
export function bridgeParams() {
  const u = new URL(location.href);
  return {
    token: u.searchParams.get("boToken"),
    origin: u.searchParams.get("boParent"),
  };
}
function validState(data: any) {
  return (
    Number.isFinite(data.time) &&
    data.time >= 0 &&
    Number.isFinite(data.duration) &&
    data.duration >= 0 &&
    Number.isFinite(data.seekStart) &&
    data.seekStart >= 0 &&
    Number.isFinite(data.seekEnd) &&
    data.seekEnd >= data.seekStart &&
    typeof data.paused === "boolean"
  );
}
export function startBridge(): () => void {
  const { token, origin } = bridgeParams();
  if (
    !token ||
    !origin ||
    !parents.has(origin) ||
    location.origin !== "https://www.bilibili.com" ||
    !/^\/video\/BV\w+\/?$/.test(location.pathname)
  )
    return () => {};
  const abort = new AbortController();
  let video: HTMLVideoElement | null = null,
    stopped = false,
    attempted = false;
  const send = (type: string, data: any = {}) =>
    parent.postMessage({ channel: CHANNEL, token, type, ...data }, origin);
  const style = document.createElement("style");
  // Reveal only the player root. Descendants retain Bilibili's own hover,
  // menu and control visibility rules, so hidden layers cannot cover seeking.
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
  let detachVideo = () => {};
  const state = () => ({
    time:
      video && Number.isFinite(video.currentTime)
        ? Math.max(0, video.currentTime)
        : 0,
    duration:
      video && Number.isFinite(video.duration)
        ? Math.max(0, video.duration)
        : 0,
    paused: video?.paused ?? true,
    seekStart: video?.seekable.length ? video.seekable.start(0) : 0,
    seekEnd: video?.seekable.length
      ? video.seekable.end(video.seekable.length - 1)
      : 0,
  });
  const sendState = () => {
    if (video && !stopped) send("state", state());
  };
  const inspect = () => {
    if (stopped) return;
    const next = document.querySelector<HTMLVideoElement>(
      ".bpx-player-container video,#bilibili-player video,video",
    );
    if (next && next !== video) {
      detachVideo();
      video = next;
      const nativeRoot = next.closest<HTMLElement>(
        ".bpx-player-container, #bilibili-player",
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
        "emptied",
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
  };
  const refreshComments = watchComments(abort.signal, (comments, notice) =>
    send("comments", { comments, notice }),
  );
  const onMessage = (e: MessageEvent) => {
    if (
      e.origin !== origin ||
      e.source !== parent ||
      e.data?.channel !== CHANNEL ||
      e.data?.token !== token
    )
      return;
    if (e.data.type === "comments:sync") refreshComments();
    if (e.data.type === "pause") video?.pause();
    if (e.data.type === "comments:more")
      loadMore(abort.signal).then(
        () => refreshComments(),
        (err) => send("comments:error", { message: err.message }),
      );
  };
  const onKey = (e: KeyboardEvent) => {
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
export function validMessage(
  e: MessageEvent,
  frame: HTMLIFrameElement,
  token: string,
) {
  return (
    e.origin === "https://www.bilibili.com" &&
    e.source === frame.contentWindow &&
    e.data?.channel === CHANNEL &&
    e.data?.token === token &&
    [
      "ready",
      "state",
      "blocked",
      "comments",
      "comments:error",
      "escape",
    ].includes(e.data?.type) &&
    (e.data.type !== "state" || validState(e.data))
  );
}
