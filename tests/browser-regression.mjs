import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { home, video, videos, seekableVideo } from "./fixtures/pages.mjs";
const source = await readFile("dist/bilioffice.user.js", "utf8");
const cover = await readFile("tests/fixtures/cover.avif");
const seekableMedia = await readFile("tests/fixtures/seekable.webm");
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
  if (
    u.hostname === "www.bilibili.com" &&
    u.pathname === "/bilioffice-seekable.webm"
  ) {
    const range = r
      .request()
      .headers()
      .range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2]
      ? Math.min(Number(range[2]), seekableMedia.length - 1)
      : seekableMedia.length - 1;
    return r.fulfill({
      status: range ? 206 : 200,
      contentType: "video/webm",
      headers: {
        "accept-ranges": "bytes",
        ...(range
          ? { "content-range": `bytes ${start}-${end}/${seekableMedia.length}` }
          : {}),
      },
      body: seekableMedia.subarray(start, end + 1),
    });
  }
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
    const timelineItems = Array.from({ length: 7 }, (_, i) => ({
      ...videos[i % videos.length],
      bvid: i === 0 ? videos[0].bvid : `BV1mock00000${i}`,
    }));
    const data =
      q === "interleaved"
        ? {
            result: timelineItems.slice(
              u.searchParams.get("page") === "2" ? 3 : 0,
              u.searchParams.get("page") === "2" ? 7 : 4,
            ),
            numPages: 2,
            numResults: 7,
          }
        : u.pathname.endsWith("/view")
          ? videos.find((v) => v.bvid === u.searchParams.get("bvid"))
          : u.pathname.includes("search")
            ? {
                result: q === "empty" ? [] : videos,
                numPages: 3,
                numResults: 6,
              }
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
await context.addInitScript(`
window.__testMenus = [];
window.GM_registerMenuCommand = (name, action) => window.__testMenus.push({ name, action });
window.GM_getValue = (key, fallback) => JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
window.GM_setValue = (key, value) => localStorage.setItem(key, JSON.stringify(value));
${source}
`);
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("https://www.bilibili.com/");
await page.locator(".bo-play").first().waitFor();
await page.setViewportSize({ width: 1024, height: 600 });
await page.getByRole("button", { name: "⚙ 设置", exact: true }).click();
await page.locator('[data-setting=theme] [data-value="feishu"]').click();
check(
  "短窗口企微设置可直接点选飞书且设置面板仍可用",
  (await page.locator("#bilioffice-root").getAttribute("data-theme")) ===
    "feishu" &&
    (await page
      .locator('[data-setting=theme] [data-value="feishu"]')
      .getAttribute("aria-pressed")) === "true",
);
await page.locator('[data-setting=theme] [data-value="wecom"]').click();
await page
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-settings-short.png" });
await page
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await page.reload();
await page.locator(".bo-play").first().waitFor();
check(
  "设置切回企微保存后刷新仍保留",
  (await page.locator("#bilioffice-root").getAttribute("data-theme")) ===
    "wecom",
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.evaluate(() =>
  __testMenus.find((m) => m.name.startsWith("切换到飞书")).action(),
);
check(
  "油猴菜单通过GM设置切换飞书并标明版本",
  (await page.locator("#bilioffice-root").getAttribute("data-theme")) ===
    "feishu" &&
    (await page.locator("#bilioffice-root").getAttribute("data-version")) ===
      "0.1.3",
);
await page.evaluate(() =>
  __testMenus.find((m) => m.name.startsWith("打开界面设置")).action(),
);
await page.getByText("bilioffice v0.1.3", { exact: true }).waitFor();
await page
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await page.reload();
await page.locator(".bo-play").first().waitFor();
check(
  "油猴菜单切换飞书刷新仍保留",
  (await page.locator("#bilioffice-root").getAttribute("data-theme")) ===
    "feishu",
);
for (const theme of ["wecom", "dingtalk", "feishu"]) {
  await page.getByRole("button", { name: "⚙ 设置", exact: true }).click();
  await page.locator(`[data-setting=theme] [data-value="${theme}"]`).click();
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
    check(
      `${theme}/${route} HTTP封面及picture懒加载封面均转为HTTPS并加载`,
      await page.locator(".bo-cover img").evaluateAll(async (images) => {
        await Promise.all(images.map((i) => i.decode()));
        return images.every(
          (i) => i.src.startsWith("https://") && i.naturalWidth > 110,
        );
      }),
    );
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
  if (theme === "wecom") {
    await page.evaluate(() => history.pushState({}, "", "/"));
    await page.locator(".bo-play").first().waitFor();
    check(
      "企微标题和会话数据一致",
      (await page.locator(".bo-header h1").textContent()) === "产品研发交流群",
    );
    check(
      "企微参考图四栏布局、白色聊天画布和蓝色选中态",
      await page.locator("#bilioffice-root").evaluate((root) => {
        const info = root.querySelector(".bo-info-panel"),
          header = root.querySelector(".bo-header"),
          chat = root.querySelector(".bo-chat"),
          selected = root.querySelector(".fs-conversation.active");
        return (
          getComputedStyle(chat).backgroundColor === "rgb(255, 255, 255)" &&
          getComputedStyle(selected).backgroundImage.includes("gradient") &&
          info.getBoundingClientRect().width >= 180 &&
          Math.abs(
            info.getBoundingClientRect().top -
              header.getBoundingClientRect().bottom,
          ) < 1
        );
      }),
    );
    await page.locator('.wc-rail-groups [data-filter="single"]').click();
    check(
      "企微单聊分组过滤联系人",
      (await page.locator(".fs-conversation").count()) === 2,
    );
    await page.locator('.wc-rail-groups [data-filter="all"]').click();
    const search = page.getByRole("searchbox", {
      name: "搜索会话",
      exact: true,
    });
    await search.fill("林晓雨");
    check(
      "企微会话搜索过滤联系人",
      (await page.locator(".fs-conversation").count()) === 1,
    );
    await search.fill("找不到的群");
    check("企微搜索空态", await page.locator(".fs-empty").isVisible());
    await search.fill("");
    await page.locator('[data-conversation="lin"]').click();
    const input = page.getByRole("textbox", { name: "消息输入", exact: true });
    await input.fill("下午三点对一下进度");
    await page.locator('[data-conversation="review"]').click();
    check("企微各会话草稿独立", (await input.inputValue()) === "");
    await page.locator('[data-conversation="lin"]').click();
    check(
      "企微切回联系人恢复草稿",
      (await input.inputValue()) === "下午三点对一下进度",
    );
    await input.press("Shift+Enter");
    await input.type("收到后回复一下");
    await input.press("Enter");
    check(
      "企微本地发送保留换行并显示自己的气泡",
      (await page
        .locator(".fs-history .fs-self .fs-text-bubble")
        .last()
        .textContent()) === "下午三点对一下进度\n收到后回复一下" &&
        (await input.inputValue()) === "",
    );
    check(
      "企微空消息不可发送",
      await page
        .getByRole("button", { name: "发送", exact: true })
        .isDisabled(),
    );
    await page
      .getByRole("button", { name: "引用最新消息", exact: true })
      .click();
    await page.locator('[data-conversation="review"]').click();
    check(
      "企微引用草稿不串到其他会话",
      (await page.locator(".wc-compose-quote").count()) === 0,
    );
    await page.locator('[data-conversation="lin"]').click();
    check(
      "企微引用草稿随会话恢复",
      await page.locator(".wc-compose-quote").isVisible(),
    );
    await input.fill("收到，我晚点补充。");
    await input.press("Enter");
    check(
      "企微引用回复显示独立引用块并清理输入预览",
      (await page.locator(".fs-history .wc-quoted-message").count()) === 1 &&
        (await page.locator(".wc-compose-quote").count()) === 0,
    );
    await page.getByRole("button", { name: "会话详情", exact: true }).click();
    await page.getByRole("button", { name: "置顶会话", exact: true }).click();
    check(
      "企微置顶操作立即更新",
      await page
        .getByRole("button", { name: "取消置顶", exact: true })
        .isVisible(),
    );
    await page.getByRole("button", { name: "消息免打扰", exact: true }).click();
    check(
      "企微免打扰状态立即更新",
      await page
        .getByRole("button", { name: "关闭免打扰", exact: true })
        .isVisible(),
    );
    await page
      .locator(".wc-details")
      .getByRole("button", { name: "关闭", exact: true })
      .click();
    await page.locator('[data-conversation="share"]').click();
    await page
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-wecom-workspace.png" });
    await page.setViewportSize({ width: 2048, height: 1166 });
    await page
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-wecom-reference.png" });
    await page.getByRole("button", { name: "表情", exact: true }).click();
    await page
      .locator(".wc-emoji-picker")
      .getByRole("button", { name: "👍", exact: true })
      .click();
    check("企微工具栏表情插入当前草稿", (await input.inputValue()) === "👍");
    await input.fill("");
    await page
      .getByRole("button", { name: "展开或收起群信息", exact: true })
      .click();
    check(
      "企微群信息可收起并释放聊天宽度",
      !(await page.locator(".bo-info-panel").isVisible()),
    );
    await page
      .getByRole("button", { name: "展开或收起群信息", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    check(
      "企微手机聊天无横向溢出",
      await page
        .locator(".bo-main")
        .evaluate((n) => n.scrollWidth <= n.clientWidth),
    );
    await page
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-wecom-mobile-chat.png" });
    await page.getByRole("button", { name: "展开或收起导航" }).click();
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector(".bo-sidebar").getBoundingClientRect().left,
        ) < 1,
    );
    await page.getByRole("button", { name: "搜索视频", exact: true }).click();
    check(
      "企微手机仍可搜索视频和恢复原版",
      (await page
        .getByRole("textbox", { name: "搜索 B 站视频", exact: true })
        .isVisible()) &&
        (await page
          .getByRole("button", { name: "恢复原版", exact: true })
          .isVisible()),
    );
    await page
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-wecom-mobile.png" });
    await page.getByRole("button", { name: "收起导航", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
}
const originalCard = await page.locator(".bo-message").first().elementHandle();
await page.locator('[data-filter="mention"]').click();
check(
  "@我筛选只显示两条有提及的未读会话",
  (await page.locator(".fs-conversation").count()) === 2,
);
await page.locator('[data-conversation="review"]').click();
check(
  "点开会话展示对应聊天、提及高亮和新消息线",
  (await page.locator(".fs-history .fs-mention").count()) === 1 &&
    (await page.locator(".fs-unread-divider").count()) === 1 &&
    (await page.locator(".bo-header h1").textContent()) ===
      "客户工作台 · 项目组",
);
check(
  "阅读会话同步减少未读和提及计数",
  (await page
    .locator('[data-filter="unread"] .fs-filter-count')
    .textContent()) === "8" &&
    (await page
      .locator('[data-filter="mention"] .fs-filter-count')
      .textContent()) === "1" &&
    (await page.locator(".fs-rail-badge").textContent()) === "8",
);
await page
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-feishu-mentions.png" });
await page.locator('[data-filter="starred"]').click();
check(
  "标记筛选与置顶会话一致",
  (await page.locator(".fs-conversation").count()) === 3,
);
await page.locator('[data-conversation="share"]').click();
check(
  "切回交流群保留原视频卡片节点",
  await originalCard.evaluate(
    (n) =>
      n === document.querySelector(".bo-message") && !n.closest("[hidden]"),
  ),
);
await page.locator('[data-filter="all"]').click();
await page.evaluate(() => history.pushState({}, "", "/"));
await page.locator(".bo-play").first().click();
await page.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.2,
);
check("Canvas 模拟视频播放进度实际增长", true);
check(
  "没有可定位区间的媒体禁用进度拖动",
  await page
    .getByRole("slider", { name: "播放进度", exact: true })
    .isDisabled(),
);
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
await page.locator('[data-conversation="design"]').click();
await page.locator(".fs-pin").filter({ hasText: "产品体验" }).click();
check(
  "阅读@我会话后回到视频群保留播放iframe",
  await page.evaluate(
    () =>
      savedFrame === document.querySelector(".bo-player iframe") && !removed,
  ),
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
if (!(await input.isVisible()))
  await page.getByRole("button", { name: "搜索视频", exact: true }).click();
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
await page.locator('[data-setting=appearance] [data-value="dark"]').click();
check(
  "深色实际计算色生效",
  await page
    .locator("#bilioffice-root")
    .evaluate((r) => getComputedStyle(r).backgroundColor === "rgb(31, 35, 41)"),
);
await page.emulateMedia({ colorScheme: "dark" });
await page.locator('[data-setting=appearance] [data-value="system"]').click();
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
await page.evaluate(() =>
  __testMenus.find((m) => m.name.startsWith("切换到飞书")).action(),
);
check(
  "退出办公模式后油猴菜单可直接重新启用飞书",
  (await page.locator("#bilioffice-root").getAttribute("data-theme")) ===
    "feishu" && (await page.locator("#bilioffice-enable").count()) === 0,
);
await page.locator("#bilioffice-root").waitFor();
await page.addScriptTag({ content: source });
check(
  "重复初始化仅一个壳",
  (await page.locator("#bilioffice-root").count()) === 1,
);
const timelinePage = await context.newPage();
timelinePage.on("pageerror", (e) => errors.push(e.message));
await timelinePage.goto("https://www.bilibili.com/search?keyword=interleaved");
await timelinePage.locator(".bo-play").first().waitFor();
check(
  "前四条视频之间按两条间隔插入文字",
  (await timelinePage.locator(".bo-local-message").count()) === 1,
);
await timelinePage.locator(".bo-play").first().click();
await timelinePage.waitForFunction(
  () => Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
);
const timelineFrame = await timelinePage
  .locator(".bo-player iframe")
  .elementHandle();
await timelinePage
  .locator(".bo-chat")
  .evaluate((chat) => (chat.scrollTop = chat.scrollHeight));
await timelinePage.waitForFunction(
  () => document.querySelectorAll(".bo-message[data-video-id]").length === 7,
);
check(
  "自动翻页后以2/3交替间隔连续插入且保留播放器",
  (await timelinePage
    .locator(".bo-message")
    .evaluateAll((rows) =>
      rows.map((r) => (r.hasAttribute("data-video-id") ? "V" : "M")).join(""),
    )) === "VVMVVVMVVM" &&
    (await timelineFrame.evaluate(
      (f) => f === document.querySelector(".bo-player iframe"),
    )),
);
await timelinePage.locator(".bo-chat").evaluate((chat) => (chat.scrollTop = 0));
await timelinePage
  .getByRole("button", { name: "⚙ 设置", exact: true })
  .click();
await timelinePage
  .locator('[data-setting=appearance] [data-value="dark"]')
  .click();
for (const theme of ["wecom", "dingtalk", "feishu"]) {
  await timelinePage
    .locator(`[data-setting=theme] [data-value="${theme}"]`)
    .click();
  await timelinePage.locator(".bo-play").first().waitFor();
  if (theme === "wecom") {
    await timelinePage
      .locator(".bo-settings")
      .getByRole("button", { name: "关闭", exact: true })
      .click();
    await timelinePage
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-wecom-dark.png" });
    await timelinePage
      .getByRole("button", { name: "⚙ 设置", exact: true })
      .click();
  }
  check(
    `${theme} 深色各栏、搜索、设置和气泡均无浅色背景`,
    await timelinePage.locator("#bilioffice-root").evaluate((root) => {
      return [
        ".bo-app-rail",
        ".bo-sidebar",
        ".bo-main",
        ".bo-header",
        ".bo-chat",
        ".bo-search input",
        ".bo-settings",
        ".bo-bubble",
        ".bo-avatar",
      ].every((selector) => {
        const c = getComputedStyle(root.querySelector(selector))
          .backgroundColor.match(/[\d.]+/g)
          .map(Number);
        return (c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722) / 255 < 0.4;
      });
    }),
  );
}
await timelinePage
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await timelinePage
  .locator(".bo-local-message")
  .first()
  .evaluate((n) => n.scrollIntoView({ block: "center" }));
await timelinePage
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-feishu-interleaved-dark.png" });
await timelinePage.emulateMedia({ colorScheme: "dark" });
await timelinePage
  .getByRole("button", { name: "⚙ 设置", exact: true })
  .click();
await timelinePage
  .locator('[data-setting=appearance] [data-value="light"]')
  .click();
check(
  "系统深色下显式浅色保持浅色",
  await timelinePage
    .locator("#bilioffice-root")
    .evaluate(
      (r) =>
        getComputedStyle(r).colorScheme === "light" &&
        getComputedStyle(r).backgroundColor === "rgb(255, 255, 255)",
    ),
);
await timelinePage
  .locator('[data-setting=appearance] [data-value="system"]')
  .click();
check(
  "跟随系统深色使飞书侧栏和主区同步变暗",
  await timelinePage
    .locator("#bilioffice-root")
    .evaluate(
      (r) =>
        getComputedStyle(r).colorScheme === "dark" &&
        getComputedStyle(r.querySelector(".bo-app-rail")).backgroundColor ===
          "rgb(27, 34, 48)",
    ),
);
await timelinePage.emulateMedia({ colorScheme: "light" });
check(
  "跟随系统切回浅色恢复飞书侧栏",
  await timelinePage
    .locator(".bo-app-rail")
    .evaluate(
      (r) => getComputedStyle(r).backgroundColor === "rgb(220, 232, 248)",
    ),
);
await timelinePage
  .locator(".bo-settings")
  .getByRole("button", { name: "关闭", exact: true })
  .click();
await timelinePage
  .locator(".bo-local-message")
  .first()
  .evaluate((n) => n.scrollIntoView({ block: "center" }));
await timelinePage
  .locator("#bilioffice-root")
  .screenshot({ path: "docs/screenshots/mock-feishu-interleaved-light.png" });
await timelinePage.close();
for (const theme of ["wecom", "feishu", "dingtalk"]) {
  const feedPage = await context.newPage();
  feedPage.on("pageerror", (e) => errors.push(e.message));
  await feedPage.setViewportSize({ width: 1440, height: 700 });
  await feedPage.addInitScript(
    (theme) =>
      localStorage.setItem(
        "bilioffice.settings",
        JSON.stringify({ enabled: true, theme, appearance: "light" }),
      ),
    theme,
  );
  const requests = [];
  let fail = true;
  await feedPage.route(
    "https://api.bilibili.com/x/web-interface/popular?*",
    async (route) => {
      const pn = Number(new URL(route.request().url()).searchParams.get("pn"));
      requests.push(pn);
      const headers = {
        "access-control-allow-origin":
          route.request().headers().origin || "https://www.bilibili.com",
        "access-control-allow-credentials": "true",
      };
      if (fail) {
        fail = false;
        return route.fulfill({ status: 500, body: "failure", headers });
      }
      const next = Array.from({ length: pn === 1 ? 3 : 2 }, (_, i) => ({
        ...videos[0],
        bvid: `BV1more000${pn}${i}`,
        title: `续页 ${pn}-${i}`,
      }));
      return route.fulfill({
        contentType: "application/json",
        headers,
        body: JSON.stringify({
          code: 0,
          data: {
            list: pn === 1 ? [videos[0], ...next] : next,
            no_more: pn === 2,
          },
        }),
      });
    },
  );
  await feedPage.goto("https://www.bilibili.com/");
  await feedPage.locator(".bo-play").first().waitFor();
  await feedPage.locator(".bo-play").first().click();
  await feedPage.waitForFunction(
    () =>
      Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
  );
  const playing = await feedPage.locator(".bo-player iframe").elementHandle();
  await feedPage.locator(".bo-chat").evaluate((chat) => {
    chat.scrollTop = chat.scrollHeight;
    chat.dispatchEvent(new Event("scroll"));
  });
  await feedPage
    .getByRole("button", { name: "重试加载更多", exact: true })
    .waitFor();
  check(`${theme} 首页触底请求热门第一页且失败可重试`, requests[0] === 1);
  await feedPage
    .getByRole("button", { name: "重试加载更多", exact: true })
    .click();
  await feedPage.waitForFunction(
    () => document.querySelectorAll(".bo-message[data-video-id]").length === 5,
  );
  await feedPage.locator(".bo-chat").evaluate((chat) => {
    chat.scrollTop = chat.scrollHeight;
    chat.dispatchEvent(new Event("scroll"));
  });
  await feedPage.waitForFunction(
    () => document.querySelectorAll(".bo-message[data-video-id]").length === 7,
  );
  check(
    `${theme} 首页连续翻页去重、更新页码并保留播放器`,
    requests.join(",") === "1,1,2" &&
      (await playing.evaluate(
        (frame) => frame === document.querySelector(".bo-player iframe"),
      )) &&
      (await feedPage.locator(".bo-pagination").textContent()).includes(
        "第 3 页",
      ) &&
      (await feedPage
        .getByRole("button", { name: "下一页", exact: true })
        .isDisabled()),
  );
  check(
    `${theme} 首页续页明确标出热门来源`,
    (await feedPage.locator(".bo-feed-source").textContent()) ===
      "继续浏览 · 热门视频",
  );
  await feedPage.close();
}
const fitPage = await context.newPage();
fitPage.on("pageerror", (e) => errors.push(e.message));
await fitPage.addInitScript(() =>
  localStorage.setItem(
    "bilioffice.settings",
    JSON.stringify({ enabled: true, theme: "wecom", appearance: "light" }),
  ),
);
await fitPage.setViewportSize({ width: 1440, height: 4000 });
const fitRequests = [];
await fitPage.route(
  "https://api.bilibili.com/x/web-interface/popular?*",
  async (route) => {
    fitRequests.push(
      Number(new URL(route.request().url()).searchParams.get("pn")),
    );
    return route.fulfill({
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "https://www.bilibili.com",
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify({ code: 0, data: { list: videos, no_more: false } }),
    });
  },
);
await fitPage.goto("https://www.bilibili.com/");
await fitPage.waitForFunction(
  () => document.querySelector(".bo-pagination button:last-child")?.disabled,
);
check(
  "企微首屏不足一屏仍自动续页，连续重复数据会停止请求",
  fitRequests.join(",") === "1,2" &&
    (await fitPage.locator(".bo-message[data-video-id]").count()) === 2,
);
await fitPage.close();
for (const origin of [
  "https://www.bilibili.com",
  "https://search.bilibili.com",
]) {
  const seekPage = await context.newPage();
  seekPage.on("pageerror", (e) => errors.push(e.message));
  await seekPage.addInitScript(() =>
    localStorage.setItem(
      "bilioffice.settings",
      JSON.stringify({ enabled: true, theme: "wecom", appearance: "light" }),
    ),
  );
  await seekPage.route("**/video/**", (route) =>
    route.fulfill({ contentType: "text/html", body: seekableVideo }),
  );
  await seekPage.goto(
    origin === "https://www.bilibili.com"
      ? origin + "/"
      : origin + "/all?keyword=视频",
  );
  await seekPage.locator(".bo-play").first().click();
  const slider = seekPage.getByRole("slider", {
    name: "播放进度",
    exact: true,
  });
  await seekPage.waitForFunction(
    () =>
      document.querySelector(".bo-playback-progress")?.disabled === false &&
      Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.1,
  );
  const videoFrame = seekPage
    .frames()
    .find((frame) => frame.url().includes("boToken"));
  const frameNode = await seekPage.locator(".bo-player iframe").elementHandle();
  const track = await slider.boundingBox();
  await seekPage.mouse.move(
    track.x + track.width * 0.2,
    track.y + track.height / 2,
  );
  await seekPage.mouse.down();
  await seekPage.mouse.move(
    track.x + track.width * 0.75,
    track.y + track.height / 2,
    { steps: 12 },
  );
  const preview = Number(await slider.inputValue());
  await seekPage.waitForTimeout(750);
  check(
    `${origin} 拖动预览不会被播放状态覆盖，松开前不跳转`,
    preview > 13 &&
      Math.abs(Number(await slider.inputValue()) - preview) < 0.2 &&
      (await videoFrame.locator("video").evaluate((v) => v.currentTime < 8)),
  );
  await seekPage.mouse.up();
  await seekPage.waitForFunction(
    (target) =>
      Math.abs(
        Number(document.querySelector(".bo-inline-player")?.dataset.time) -
          target,
      ) < 1,
    preview,
  );
  check(
    `${origin} 松开进度条定位真实媒体并保持播放`,
    (await videoFrame
      .locator("video")
      .evaluate((v) => !v.paused && v.currentTime > 13)) &&
      (await frameNode.evaluate(
        (frame) => frame === document.querySelector(".bo-player iframe"),
      )),
  );
  await videoFrame.locator("video").evaluate((v) => v.pause());
  await seekPage.waitForFunction(
    () =>
      document.querySelector(".bo-inline-player")?.dataset.paused === "true",
  );
  await slider.focus();
  await slider.press("Home");
  await slider.press("ArrowRight");
  await seekPage.waitForFunction(
    () => Number(document.querySelector(".bo-inline-player")?.dataset.time) < 1,
  );
  check(
    `${origin} 键盘拖动保持暂停并可回退到开头`,
    await videoFrame
      .locator("video")
      .evaluate((v) => v.paused && v.currentTime < 1),
  );
  check(
    `${origin} 拒绝伪造及非法跳转消息`,
    await videoFrame.evaluate(() => {
      const v = document.querySelector("video"),
        before = v.currentTime;
      const u = new URL(location.href),
        token = u.searchParams.get("boToken"),
        parentOrigin = u.searchParams.get("boParent");
      const data = {
        channel: "bilioffice:v1",
        token,
        type: "seek",
        time: 14,
        requestId: 1000,
      };
      for (const event of [
        { origin: "https://evil.example", source: parent, data },
        { origin: parentOrigin, source: window, data },
        {
          origin: parentOrigin,
          source: parent,
          data: { ...data, token: "wrong" },
        },
        { origin: parentOrigin, source: parent, data: { ...data, time: NaN } },
        { origin: parentOrigin, source: parent, data: { ...data, time: -1 } },
      ])
        window.dispatchEvent(new MessageEvent("message", event));
      return v.currentTime === before && v.paused;
    }),
  );
  await seekPage
    .getByRole("button", { name: "放大或还原播放器", exact: true })
    .click();
  await slider.press("End");
  await seekPage.waitForFunction(
    () =>
      Number(document.querySelector(".bo-inline-player")?.dataset.time) > 19,
  );
  check(
    `${origin} 放大后进度条可用且沿用同一播放器`,
    (await slider.isVisible()) &&
      (await frameNode.evaluate(
        (frame) => frame === document.querySelector(".bo-player iframe"),
      )),
  );
  await seekPage.keyboard.press("Escape");
  await seekPage
    .locator(".bo-player")
    .evaluate((player) => player.scrollIntoView({ block: "center" }));
  if (origin === "https://www.bilibili.com")
    await seekPage
      .locator("#bilioffice-root")
      .screenshot({ path: "docs/screenshots/mock-player-seek.png" });
  await seekPage
    .locator(".bo-inline-player > .bo-player-actions")
    .getByRole("button", { name: "关闭", exact: true })
    .click();
  check(
    `${origin} 关闭后移除进度控件和播放 iframe`,
    (await seekPage.locator(".bo-playback-bar, .bo-player iframe").count()) ===
      0,
  );
  await seekPage.close();
}
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
