import type { Comment } from "../../types";
import { safeURL } from "../bilibili";
// Traverse open shadow roots only within the native comment host, never the whole site.
export function deepAll(selector: string, root: ParentNode): Element[] {
  const out = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll("*"))
    if (el.shadowRoot) out.push(...deepAll(selector, el.shadowRoot));
  return out;
}
export function commentHost() {
  return document.querySelector("bili-comments,.reply-list");
}
export function readComments(): Comment[] {
  const host = commentHost();
  if (!host) return [];
  const read = (el: Element): Comment | null => {
    const root = el.shadowRoot || el;
    const find = (s: string) => deepAll(s, root)[0];
    const body = find("#contents,.reply-content,.sub-reply-content");
    const name = find("#user-name,.user-name,.sub-user-name");
    const text = body?.textContent?.trim() || "";
    const images = [
      ...deepAll(".reply-content img,.sub-reply-content img", root),
      ...deepAll("bili-comment-pictures-renderer", root).flatMap((p) =>
        deepAll("img", p.shadowRoot || p),
      ),
    ]
      .map((i) => safeURL((i as HTMLImageElement).src))
      .filter(Boolean);
    if (!name || (!text && !images.length)) return null;
    return {
      id:
        el.getAttribute("rpid") ||
        el.getAttribute("data-id") ||
        `${name.textContent}:${text}`,
      author: { name: name.textContent?.trim() || "", avatar: "" },
      text,
      time: find("#pubdate,.reply-time,.sub-reply-time")?.textContent || "",
      likes:
        Number(find("#like #count,#like .count,.like-count")?.textContent) || 0,
      images,
      replies: [],
    };
  };
  const roots = deepAll(
    "bili-comment-renderer,.reply-item",
    host.shadowRoot || host,
  );
  return roots
    .map((el) => {
      const c = read(el);
      if (!c) return null;
      const thread =
        el.closest("bili-comment-thread-renderer,.reply-item") ||
        (el.getRootNode() as ShadowRoot).host ||
        el;
      const root = thread.shadowRoot || thread;
      c.replies = deepAll("bili-comment-reply-renderer,.sub-reply-item", root)
        .map(read)
        .filter(Boolean) as Comment[];
      return c;
    })
    .filter(Boolean) as Comment[];
}
/** Read the native read-access notice, not the login prompt for posting. */
export function commentNotice() {
  const host = commentHost();
  if (!host) return "";
  return (
    deepAll("#limit-mask-tip", host.shadowRoot || host)[0]
      ?.textContent?.trim()
      .slice(0, 400) || ""
  );
}
/** Watch only the native comment host; route/frame cancellation releases polling. */
export function watchComments(
  signal: AbortSignal,
  onChange: (comments: Comment[], notice: string) => void,
) {
  let previous = "";
  let deadline = Date.now() + 10000;
  let activated = false;
  const previousScroll = { x: window.scrollX, y: window.scrollY };
  let managedScroll: { x: number; y: number } | null = null;
  const scan = () => {
    if (signal.aborted) return;
    const comments = readComments();
    if (!comments.length && !activated) {
      const anchor =
        commentHost() || document.querySelector("#commentapp,#comment");
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        if (rect.height > 0 || rect.width > 0) {
          activated = true;
          if (rect.top >= window.innerHeight || rect.bottom <= 0) {
            // Let the native lazy loader see its host behind the fixed office UI/player.
            anchor.scrollIntoView({ block: "start" });
            managedScroll = { x: window.scrollX, y: window.scrollY };
          }
        }
      }
    }
    const notice =
      commentNotice() ||
      (!comments.length && Date.now() >= deadline
        ? "原站评论暂未加载，可点“同步已加载”重试或在原版查看。"
        : "");
    const key = JSON.stringify([comments, notice]);
    if (key !== previous) {
      previous = key;
      onChange(comments, notice);
    }
  };
  if (signal.aborted) return () => {};
  const timer = setInterval(scan, 650);
  const cleanup = () => {
    clearInterval(timer);
    signal.removeEventListener("abort", cleanup);
    if (
      managedScroll &&
      window.scrollX === managedScroll.x &&
      window.scrollY === managedScroll.y
    )
      window.scrollTo(previousScroll.x, previousScroll.y);
  };
  signal.addEventListener("abort", cleanup, { once: true });
  scan();
  return () => {
    deadline = Date.now() + 10000;
    activated = false;
    previous = "";
    scan();
  };
}
export async function loadMore(signal: AbortSignal): Promise<Comment[]> {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const host = commentHost();
  if (!host) throw Error("原站评论尚未加载，请打开原版视频页。");
  const restriction = commentNotice();
  if (restriction) throw Error(`原站提示：${restriction}`);
  const before = JSON.stringify(readComments());
  const button = deepAll(
    "button,.view-more,.reply-more",
    host.shadowRoot || host,
  ).find((b) => /更多|下一页|展开/.test(b.textContent || ""));
  if (!button) throw Error("未找到原站加载更多控件，可在原版加载评论后重试。");
  (button as HTMLElement).click();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearInterval(timer);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    let n = 0;
    const timer = setInterval(() => {
      if (signal.aborted) {
        abort();
        return;
      }
      const list = readComments();
      if (JSON.stringify(list) !== before) {
        cleanup();
        resolve(list);
      } else if (++n >= 40) {
        cleanup();
        reject(Error("等待评论变化超时，请重试。"));
      }
    }, 250);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export function exportComments(comments: Comment[]) {
  const lines = [
    "bilioffice 评论导出：仅当前已加载内容，非全量评论",
    location.href,
    "",
  ];
  const emit = (c: Comment, indent = "") => {
    lines.push(
      `${indent}${c.author.name} ${c.time}：${c.text}`,
      ...c.images.map((i) => `${indent}[图片] ${i}`),
    );
    c.replies.forEach((r) => emit(r, indent + "  "));
  };
  comments.forEach((c) => emit(c));
  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bilioffice-loaded-comments.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
