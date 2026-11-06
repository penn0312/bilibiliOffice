import { readComments, loadMore } from "../adapters/bilibili/comments";
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
    lastComments = "",
    attempted = false;
  const send = (type: string, data: any = {}) =>
    parent.postMessage({ channel: CHANNEL, token, type, ...data }, origin);
  const style = document.createElement("style");
  style.textContent =
    "html,body{margin:0;background:#111;overflow:hidden}body>*{visibility:hidden}#bilibili-player,.bpx-player-container{visibility:visible;position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646}#bilibili-player *,.bpx-player-container *{visibility:visible}";
  document.head.append(style);
  const inspect = () => {
    if (stopped) return;
    const next = document.querySelector<HTMLVideoElement>(
      ".bpx-player-container video,#bilibili-player video,video",
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
  const onMessage = (e: MessageEvent) => {
    if (
      e.origin !== origin ||
      e.source !== parent ||
      e.data?.channel !== CHANNEL ||
      e.data?.token !== token
    )
      return;
    if (e.data.type === "comments:sync")
      send("comments", { comments: readComments() });
    if (e.data.type === "pause") video?.pause();
    if (e.data.type === "comments:more")
      loadMore(abort.signal).then(
        (comments) => send("comments", { comments }),
        (err) => send("comments:error", { message: err.message }),
      );
  };
  const onKey = (e: KeyboardEvent) => {
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
    ].includes(e.data?.type)
  );
}
