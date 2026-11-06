import type { Route, VideoItem, SearchResult } from "../types";
declare const GM_xmlhttpRequest:
  | undefined
  | ((options: any) => { abort(): void });
const initialPath = location.pathname;
const initialURL = new URL(location.href);
export const orders = ["totalrank", "click", "pubdate", "dm", "stow"];
export function routeFromLocation(): Route {
  const u = new URL(location.href),
    m = u.pathname.match(/^\/video\/(BV[a-zA-Z0-9]+)\/?$/);
  if (m)
    return {
      kind: "video",
      videoId: m[1],
      part: Math.max(1, Number(u.searchParams.get("p")) || 1),
    };
  if (u.hostname === "search.bilibili.com" || u.pathname === "/search")
    return {
      kind: "search",
      query: u.searchParams.get("keyword") || "",
      page: Math.max(1, Number(u.searchParams.get("page")) || 1),
      order: orders.includes(u.searchParams.get("order") || "")
        ? u.searchParams.get("order")!
        : "totalrank",
    };
  if (u.pathname.includes("/popular"))
    return {
      kind: "popular",
      page: Math.max(1, Number(u.searchParams.get("pn")) || 1),
    };
  if (
    u.pathname.startsWith("/c/") ||
    u.pathname.startsWith("/v/") ||
    u.pathname.startsWith("/channel/")
  )
    return { kind: "section", path: u.pathname };
  return { kind: "home" };
}
export const safeURL = (value: string, base = location.href) => {
  if (!value.trim()) return "";
  try {
    const u = new URL(value, base);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};
export function originalVideo(id: string, part = 1) {
  return `https://www.bilibili.com/video/${encodeURIComponent(id)}/?p=${part}`;
}
export function openOriginal(url: string) {
  const u = safeURL(url);
  if (u) window.open(u, "_blank", "noopener,noreferrer");
}
function plain(value: unknown) {
  const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
  return doc.body.textContent || "";
}
export function nativeVideos(): VideoItem[] {
  const seen = new Set<string>(),
    out: VideoItem[] = [];
  document
    .querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]')
    .forEach((a) => {
      if (a.closest("#bilioffice-root")) return;
      const id = a.href.match(/\/video\/(BV[\w]+)/)?.[1];
      if (!id || seen.has(id)) return;
      const card =
        a.closest(".bili-video-card,.feed-card,.video-item,.video-list-item") ||
        a;
      const img = card.querySelector<HTMLImageElement>("img");
      const title = (
        card.querySelector("[title]")?.getAttribute("title") ||
        a.title ||
        img?.alt ||
        a.textContent ||
        ""
      ).trim();
      if (!title) return;
      seen.add(id);
      out.push({
        id,
        title,
        url: originalVideo(id),
        cover: safeURL(img?.currentSrc || img?.dataset.src || img?.src || ""),
        author: {
          name:
            card
              .querySelector(
                ".bili-video-card__info--author,.up-name,.bili-video-card__info--owner",
              )
              ?.textContent?.trim() || "B站视频",
          avatar: "",
        },
        duration: card
          .querySelector(".bili-video-card__stats__duration,.length")
          ?.textContent?.trim(),
        views: card
          .querySelector(".bili-video-card__stats--item")
          ?.textContent?.trim(),
      });
    });
  return out;
}
export function api(path: string, signal: AbortSignal): Promise<any> {
  const url = `https://api.bilibili.com${path}`;
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    let done = false;
    let cancel = () => {};
    const finish = (err?: Error, data?: any) => {
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
    const parse = (text: string) => {
      try {
        const j = JSON.parse(text);
        if (j.code !== 0)
          throw Error(`B站接口 ${j.code}：${j.message || "请求被限制"}`);
        finish(undefined, j.data);
      } catch (e) {
        finish(e as Error);
      }
    };
    if (typeof GM_xmlhttpRequest === "function") {
      const req = GM_xmlhttpRequest({
        method: "GET",
        url,
        timeout: 18000,
        onload: (r: any) =>
          r.status === 200
            ? parse(r.responseText)
            : finish(Error(`HTTP ${r.status}`)),
        onerror: () => finish(Error("网络请求失败")),
        ontimeout: () => finish(Error("请求超时")),
      });
      cancel = () => req.abort();
    } else {
      const c = new AbortController();
      cancel = () => c.abort();
      fetch(url, { credentials: "include", signal: c.signal })
        .then((r) => {
          if (!r.ok) throw Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(parse, (e) => finish(e));
    }
  });
}
function item(v: any): VideoItem {
  return {
    id: v.bvid,
    title: plain(v.title),
    url: originalVideo(v.bvid),
    cover: safeURL(v.pic || ""),
    author: {
      name: plain(v.owner?.name || v.author || "B站用户"),
      avatar: safeURL(v.owner?.face || ""),
    },
    duration:
      typeof v.duration === "string"
        ? v.duration
        : `${Math.floor((v.duration || 0) / 60)}:${String((v.duration || 0) % 60).padStart(2, "0")}`,
    views: String(v.stat?.view ?? v.play ?? ""),
    published: v.pubdate
      ? new Date(v.pubdate * 1000).toLocaleDateString("zh-CN")
      : "",
  };
}
export async function fetchVideos(
  route: Route,
  signal: AbortSignal,
): Promise<SearchResult> {
  if (route.kind === "search") {
    if (!route.query) return { items: [], pages: 0, total: 0 };
    const p = new URLSearchParams({
      search_type: "video",
      keyword: route.query,
      page: String(route.page || 1),
      order: route.order || "totalrank",
    });
    if (
      initialURL.hostname === "search.bilibili.com" &&
      initialURL.searchParams.get("keyword") === route.query &&
      Number(initialURL.searchParams.get("page") || 1) === (route.page || 1) &&
      (initialURL.searchParams.get("order") || "totalrank") ===
        (route.order || "totalrank")
    ) {
      const cards = await waitNative(signal);
      if (cards.length) {
        const buttons = [
          ...document.querySelectorAll(
            "[class*=pagination] button,[class*=pagenation] button,[class*=pagination] .page-item",
          ),
        ];
        const pages = Math.max(
          route.page || 1,
          ...buttons
            .map((b) => Number(b.textContent?.trim()))
            .filter(Number.isFinite),
        );
        return { items: cards, total: cards.length, pages };
      }
    }
    const data = await api(`/x/web-interface/search/type?${p}`, signal);
    return {
      items: (data.result || []).filter((v: any) => v.bvid).map(item),
      pages: data.numPages || 1,
      total: data.numResults || 0,
    };
  }
  const native =
    (route.kind === "home" && initialPath === "/") ||
    (route.kind === "section" && initialPath === route.path)
      ? await waitNative(signal)
      : [];
  if ((route.kind === "home" || route.kind === "section") && native.length)
    return { items: native, total: native.length, pages: 1 };
  if (route.kind === "section")
    throw Error("当前分区未采集到原站列表，请使用原版加载后重试。");
  const data = await api(
    `/x/web-interface/popular?ps=20&pn=${route.page || 1}`,
    signal,
  );
  return {
    items: (data.list || []).map(item),
    total: 0,
    pages: data.no_more ? route.page || 1 : (route.page || 1) + 1,
  };
}
export async function getVideo(
  id: string,
  part: number,
  signal: AbortSignal,
): Promise<VideoItem> {
  const data = await api(
    `/x/web-interface/view?bvid=${encodeURIComponent(id)}`,
    signal,
  );
  return { ...item(data), part, url: originalVideo(id, part) };
}

async function waitNative(signal: AbortSignal): Promise<VideoItem[]> {
  const existing = nativeVideos();
  if (existing.length) return existing;
  const root = document.querySelector("#app,#i_cecream,main");
  if (!root) return [];
  return new Promise((resolve, reject) => {
    let debounce: ReturnType<typeof setTimeout>;
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
    }, 4000);
    observer.observe(root, { childList: true, subtree: true });
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
