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
/** Clamp to the nearest seekable segment, including gaps in the media timeline. */
export function clampSeekTime(time: number, ranges: TimeRanges): number | null {
  if (!Number.isFinite(time) || time < 0) return null;
  let closest: number | null = null;
  let distance = Infinity;
  for (let i = 0; i < Math.min(ranges.length, 32); i++) {
    const start = ranges.start(i),
      end = ranges.end(i);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end <= start
    )
      continue;
    const target = Math.max(start, Math.min(time, end));
    if (Math.abs(target - time) < distance) {
      closest = target;
      distance = Math.abs(target - time);
    }
  }
  return closest;
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
    lastComments = "",
    attempted = false;
  const send = (type: string, data: any = {}) =>
    parent.postMessage({ channel: CHANNEL, token, type, ...data }, origin);
  const style = document.createElement("style");
  style.textContent =
    "html,body{margin:0;background:#111;overflow:hidden}body>*{visibility:hidden}#bilibili-player,.bpx-player-container{visibility:visible;position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646}#bilibili-player *,.bpx-player-container *{visibility:visible}";
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
  const onMessage = (e: MessageEvent) => {
    if (
      e.origin !== origin ||
      e.source !== parent ||
      e.data?.channel !== CHANNEL ||
      e.data?.token !== token
    )
      return;
    if (e.data.type === "seek") {
      if (
        !Number.isSafeInteger(e.data.requestId) ||
        e.data.requestId <= 0 ||
        !Number.isFinite(e.data.time) ||
        e.data.time < 0
      )
        return;
      const target = video ? clampSeekTime(e.data.time, video.seekable) : null;
      let ok = false;
      if (video && target !== null) {
        try {
          video.currentTime = target;
          ok = true;
        } catch {
          /* Media may have been detached during a part change. */
        }
      }
      send("seek:result", { ...state(), requestId: e.data.requestId, ok });
    }
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
    detachVideo();
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
      "seek:result",
    ].includes(e.data?.type) &&
    (!["state", "seek:result"].includes(e.data.type) || validState(e.data)) &&
    (e.data.type !== "seek:result" ||
      (typeof e.data.ok === "boolean" &&
        Number.isSafeInteger(e.data.requestId) &&
        e.data.requestId > 0))
  );
}
