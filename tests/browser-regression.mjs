import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { home, video, videos } from "./fixtures/pages.mjs";
const source = await readFile("dist/bilioffice.user.js", "utf8");
const cover = await readFile("tests/fixtures/cover.avif");
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const passed = [],
  errors = [];
const check = (name, value) => {
  assert.ok(value, name);
  passed.push(name);
  console.log("✓", name);
};
await context.route("**/*", async (r) => {
  const u = new URL(r.request().url());
  if (u.hostname === "i0.hdslb.com")
    return r.fulfill({ contentType: "image/avif", body: cover });
  if (u.hostname === "api.bilibili.com") {
    const q = u.searchParams.get("keyword");
    if (q === "slow") await new Promise((r) => setTimeout(r, 1300));
    if (q === "fail")
      return r.fulfill({
        status: 500,
        body: "failure",
        headers: {
          "access-control-allow-origin": r.request().headers().origin || "*",
          "access-control-allow-credentials": "true",
        },
      });
    const data = u.pathname.endsWith("/view")
      ? videos.find((v) => v.bvid === u.searchParams.get("bvid"))
      : u.pathname.includes("search")
        ? { result: q === "empty" ? [] : videos, numPages: 3, numResults: 6 }
        : { list: videos, no_more: false };
    return r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data }),
      headers: {
        "access-control-allow-origin": r.request().headers().origin || "*",
        "access-control-allow-credentials": "true",
      },
    });
  }
  if (u.hostname.endsWith("bilibili.com"))
    return r.fulfill({
      contentType: "text/html",
      body: u.pathname.startsWith("/video/") ? video : home,
    });
  return r.abort();
});
await context.addInitScript(source);
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("https://www.bilibili.com/");
await page.locator(".bo-play").first().waitFor();
for (const theme of ["wecom", "dingtalk", "feishu"]) {
  await page.getByRole("button", { name: "⚙ 设置", exact: true }).click();
  await page.locator("[data-setting=theme]").selectOption(theme);
  await page
    .locator(".bo-settings")
    .getByRole("button", { name: "关闭", exact: true })
    .click();
  for (const route of ["home", "search", "video"]) {
    await page.evaluate(
      (route) =>
        history.pushState(
          {},
          "",
          route === "home"
            ? "/"
            : route === "search"
              ? "/search?keyword=视频"
              : "/video/BV1xx411c7mD/?p=2",
        ),
      route,
    );
    await page.locator(".bo-play").first().waitFor();
    await page
      .locator(".bo-cover img")
      .first()
      .evaluate((i) => i.decode());
    const dims = await page
      .locator(".bo-cover")
      .first()
      .evaluate((c) => {
        const a = c.getBoundingClientRect(),
          b = c.querySelector("img").getBoundingClientRect();
        return [
          a.width / a.height,
          b.width === a.width,
          b.height === a.height,
          c.querySelector("img").naturalWidth,
        ];
      });
    check(
      `${theme}/${route} 封面真实图片铺满16:9`,
      Math.abs(dims[0] - 16 / 9) < 0.02 && dims[1] && dims[2] && dims[3] > 110,
    );
    await page
      .locator("#bilioffice-root")
      .screenshot({ path: `docs/screenshots/mock-${theme}-${route}.png` });
  }
}
await page.evaluate(() => history.pushState({}, "", "/"));
await page.locator(".bo-play").first().click();
await page.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.2,
);
check("Canvas 模拟视频播放进度实际增长", true);
await page.evaluate(() => {
  window.savedFrame = document.querySelector(".bo-player iframe");
  window.removed = false;
  window.playObserver = new MutationObserver((rs) => {
    for (const r of rs)
      for (const n of r.removedNodes)
        if (n === window.savedFrame || n.contains?.(window.savedFrame))
          window.removed = true;
  });
  window.playObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
});
const before = Number(
  await page.locator(".bo-inline-player").getAttribute("data-time"),
);
await page.getByRole("button", { name: "放大或还原播放器" }).click();
await page.keyboard.press("Escape");
await page.waitForTimeout(750);
check(
  "放大/Esc 保留同一iframe且播放进度连续",
  (await page.evaluate(
    () =>
      savedFrame === document.querySelector(".bo-player iframe") && !removed,
  )) &&
    Number(await page.locator(".bo-inline-player").getAttribute("data-time")) >
      before,
);
await page.getByRole("button", { name: "放大或还原播放器" }).click();
await page.locator(".bo-player-backdrop").click({ position: { x: 10, y: 10 } });
check(
  "遮罩还原不拆卸播放器",
  (await page.locator(".bo-expanded").count()) === 0 &&
    (await page.evaluate(() => !removed)),
);
await page.getByRole("button", { name: "加载更多", exact: true }).click();
await page.getByText("延迟加载的评论", { exact: true }).waitFor();
check(
  "Shadow DOM 异步楼中楼同步且不拆播放节点",
  (await page.getByText("楼中楼正文", { exact: true }).count()) === 1 &&
    (await page.evaluate(() => !removed)),
);
await page.evaluate(() => {
  window.exports = [];
  URL.createObjectURL = (blob) => {
    window.exportText = blob.text();
    return "blob:test";
  };
});
await page.getByRole("button", { name: "导出已加载" }).click();
check(
  "导出包含楼中楼并标明非全量",
  await page.evaluate(async () => {
    const s = await exportText;
    return s.includes("楼中楼正文") && s.includes("非全量");
  }),
);
await page.getByRole("button", { name: "同步已加载", exact: true }).click();
check(
  "同步已加载不触发加载更多",
  (await page.getByText("延迟加载的评论", { exact: true }).count()) === 1,
);
await page.getByText("查看图片", { exact: true }).first().click();
await page
  .getByText("查看图片", { exact: true })
  .first()
  .evaluate((a) => a.click());
await page.keyboard.press("Escape");
check(
  "重复打开图片后Esc清理dialog",
  (await page.locator("dialog").count()) === 0,
);
await page.getByRole("button", { name: "重试", exact: true }).click();
await page.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
);
check(
  "播放器重试保持挂载并重新播放",
  (await page.locator(".bo-player iframe").count()) === 1,
);
await page.evaluate(() => playObserver.disconnect());
await page.getByRole("button", { name: "⚙ 设置", exact: true }).click();
await page.locator("[data-setting=hideMedia]").check();
check(
  "隐藏媒体立即释放含加载中iframe",
  (await page.locator(".bo-player iframe").count()) === 0,
);
await page.locator("[data-setting=hideMedia]").uncheck();
check(
  "恢复显示不自动播放",
  (await page.locator(".bo-player iframe").count()) === 0,
);
await page
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await page.locator(".bo-play").first().click();
await page.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
);
await page.getByRole("button", { name: "加载更多", exact: true }).click();
await page.locator(".bo-play").last().click();
await page.waitForTimeout(850);
check(
  "切视频取消旧评论加载且旧结果不覆盖新会话",
  (await page.getByText("延迟加载的评论", { exact: true }).count()) === 0,
);
check(
  "切视频只保留一实例",
  (await page.locator(".bo-player iframe").count()) === 1,
);
await page
  .locator(".bo-player-actions")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
check("关闭清理iframe", (await page.locator("iframe").count()) === 0);
await page.goto("https://search.bilibili.com/all?keyword=视频");
await page.locator(".bo-play").first().click();
await page.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
);
check("搜索子域通过受限桥播放增长", true);
const f = page.frames().find((f) => f.url().includes("boToken"));
check(
  "iframe不运行完整办公壳",
  (await f.locator("#bilioffice-root").count()) === 0,
);
await page.evaluate(() => {
  const f = document.querySelector("iframe");
  window.dispatchEvent(
    new MessageEvent("message", {
      origin: "https://evil.example",
      source: f.contentWindow,
      data: {
        channel: "bilioffice:v1",
        token: new URL(f.src).searchParams.get("boToken"),
        type: "comments",
        comments: [{ text: "evil" }],
      },
    }),
  );
  window.dispatchEvent(
    new MessageEvent("message", {
      origin: "https://www.bilibili.com",
      source: window,
      data: {
        channel: "bilioffice:v1",
        token: new URL(f.src).searchParams.get("boToken"),
        type: "comments",
        comments: [{ text: "evil" }],
      },
    }),
  );
});
check(
  "拒绝无关origin/source",
  (await page.getByText("evil", { exact: true }).count()) === 0,
);
const input = page.getByRole("textbox", { name: "搜索 B 站视频" });
await input.fill("slow");
await input.press("Enter");
check(
  "重新搜索先停止旧播放显示加载",
  (await page.locator("iframe").count()) === 0 &&
    (await page.getByText("正在等待新结果…").count()) === 1,
);
await input.fill("empty");
await input.press("Enter");
await page.getByText("暂无结果。可以更换关键词或返回推荐。").waitFor();
await page.waitForTimeout(1400);
check(
  "取消旧延迟请求不覆盖新空结果",
  (await page.locator(".bo-play").count()) === 0,
);
await input.fill("fail");
await input.press("Enter");
await page.getByText(/加载失败：HTTP 500/).waitFor();
check(
  "搜索失败明确显示重试",
  (await page.getByRole("button", { name: "重试", exact: true }).count()) === 1,
);
await input.fill("视频");
await input.press("Enter");
await page.locator(".bo-play").first().waitFor();
await page.getByRole("combobox", { name: "搜索排序" }).selectOption("click");
await page.locator(".bo-play").first().waitFor();
check("排序与原站参数一致", page.url().includes("order=click"));
await page.getByRole("button", { name: "下一页" }).click();
await page.locator(".bo-play").first().waitFor();
check("翻页参数", page.url().includes("page=2"));
await input.evaluate((i) => {
  i.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
  i.value = "中文输入法";
  i.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  i.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
});
check("中文输入确认不提前提交", page.url().includes("page=2"));
await page.getByRole("button", { name: "⚙ 设置", exact: true }).click();
await page.locator("[data-setting=appearance]").selectOption("dark");
check(
  "深色实际计算色生效",
  await page
    .locator("#bilioffice-root")
    .evaluate((r) => getComputedStyle(r).backgroundColor === "rgb(31, 35, 41)"),
);
await page.emulateMedia({ colorScheme: "dark" });
await page.locator("[data-setting=appearance]").selectOption("system");
check(
  "跟随系统实际切换深色",
  await page
    .locator("#bilioffice-root")
    .evaluate((r) => getComputedStyle(r).backgroundColor === "rgb(31, 35, 41)"),
);

await page
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await page.setViewportSize({ width: 390, height: 844 });
await page
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-mobile-chat-dark.png" });
await page.getByRole("button", { name: "展开或收起导航" }).click();
await page.waitForFunction(
  () =>
    Math.abs(
      document.querySelector(".bo-sidebar").getBoundingClientRect().left,
    ) < 1,
);

await page
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-mobile-dark.png" });
check(
  "窄窗口有导航入口",
  (await page.locator(".bo-sidebar").getAttribute("class")) ===
    "bo-sidebar open",
);
await page.getByRole("button", { name: "恢复原版" }).click();
await page.getByRole("button", { name: "启用 bilioffice" }).click();
await page.locator("#bilioffice-root").waitFor();
await page.addScriptTag({ content: source });
check(
  "重复初始化仅一个壳",
  (await page.locator("#bilioffice-root").count()) === 1,
);
check("模拟页无框架异常", errors.length === 0);
await writeFile(
  "docs/mock-results.json",
  JSON.stringify(
    { kind: "mock", passed, errors, date: new Date().toISOString() },
    null,
    2,
  ),
);
await browser.close();
