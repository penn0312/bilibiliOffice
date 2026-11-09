import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const source = await readFile("dist/bilioffice.user.js", "utf8");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.exposeBinding("__boRequest", async (_, url) => {
  try {
    const response = await context.request.get(url, { timeout: 15000 });
    return { status: response.status(), responseText: await response.text() };
  } catch (error) {
    return { status: 0, responseText: error.message };
  }
});
await context.addInitScript(() => {
  window.GM_xmlhttpRequest = (options) => {
    let aborted = false;
    window.__boRequest(options.url).then((response) => {
      if (!aborted) options.onload(response);
    });
    return {
      abort() {
        aborted = true;
      },
    };
  };
  window.__nativeScrollPositions = [];
  document.addEventListener(
    "scroll",
    (event) => {
      if (event.target === document)
        window.__nativeScrollPositions.push(scrollY);
    },
    true,
  );
});
await context.addInitScript(source);
const page = await context.newPage();
const report = {
  date: new Date().toISOString(),
  environment: "Chromium clean context, no login",
  url: "https://www.bilibili.com/video/BV1xx411c7mD/?p=1",
  scope:
    "Native playback clicks, drags, comments and zoom only. No social actions or cookie/token extraction.",
  checks: [],
};
const verify = (label, result) => {
  assert.ok(result, label);
  report.checks.push(label);
  console.log("✓", label);
};
try {
  await page.goto(report.url, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.locator(".bo-play").first().click({ timeout: 12000 });
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".bo-comments .bo-comment").length > 0 &&
      Number(document.querySelector(".bo-inline-player")?.dataset.time) > 0.2,
    null,
    { timeout: 20000 },
  );
  const frame = page.frames().find((f) => f.url().includes("boToken"));
  const frameNode = await page.locator(".bo-player iframe").elementHandle();
  const video = frame.locator("video");
  const inspect = () =>
    video.evaluate((v) => ({
      time: v.currentTime,
      paused: v.paused,
      scroll: scrollY,
    }));
  verify(
    "评论加载不改变 iframe 滚动坐标",
    await frame.evaluate(
      () =>
        scrollY === 0 && window.__nativeScrollPositions.every((y) => y === 0),
    ),
  );
  const timeline = async (target) => {
    await frame.locator(".bpx-player-container").hover();
    await frame.waitForFunction(
      () =>
        document
          .querySelector(".bpx-player-progress-wrap")
          ?.getBoundingClientRect().width > 100,
      null,
      { timeout: 10000 },
    );
    const rect = await frame.locator(".bpx-player-progress-wrap").boundingBox();
    const duration = await video.evaluate((v) => v.duration);
    return {
      x: rect.x + (rect.width * target) / duration,
      y: rect.y + rect.height / 2,
    };
  };
  const click = async (target) => {
    const point = await timeline(target);
    await page.mouse.click(point.x, point.y);
    await frame.waitForFunction(
      (target) =>
        Math.abs(document.querySelector("video").currentTime - target) < 10,
      target,
      { timeout: 10000 },
    );
    return inspect();
  };
  const drag = async (target) => {
    const current = await video.evaluate((v) => v.currentTime);
    const start = await timeline(current),
      end = await timeline(target);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
    await frame.waitForFunction(
      (target) =>
        Math.abs(document.querySelector("video").currentTime - target) < 10,
      target,
      { timeout: 10000 },
    );
    return inspect();
  };
  report.inlineClick = await click(90);
  verify(
    "加载评论后无需回顶即可单击定位并继续播放",
    !report.inlineClick.paused && report.inlineClick.scroll === 0,
  );
  report.inlineDrag = await drag(150);
  verify(
    "内嵌原生进度条可拖动",
    !report.inlineDrag.paused && report.inlineDrag.scroll === 0,
  );
  await frame.locator(".bpx-player-ctrl-play").click();
  await frame.waitForFunction(() => document.querySelector("video").paused);
  report.pausedClick = await click(60);
  verify("暂停时单击可回退并保持暂停", report.pausedClick.paused);
  await page
    .getByRole("button", { name: "放大或还原播放器", exact: true })
    .click();
  report.expandedClick = await click(180);
  report.expandedDrag = await drag(240);
  verify(
    "放大后单击和拖动均可定位且滚动坐标保持为0",
    report.expandedClick.scroll === 0 && report.expandedDrag.scroll === 0,
  );
  await page
    .getByRole("button", { name: "放大或还原播放器", exact: true })
    .click();
  await page
    .locator(".bo-comments")
    .getByRole("button", { name: "同步已加载", exact: true })
    .click();
  await page.waitForTimeout(800);
  report.afterCommentSync = await click(120);
  verify(
    "再次同步评论不会影响原生进度定位",
    report.afterCommentSync.scroll === 0,
  );
  verify(
    "点击、拖动和放大始终保留同一 iframe",
    await frameNode.evaluate(
      (node) => node === document.querySelector(".bo-player iframe"),
    ),
  );
  await page
    .locator(".bo-player")
    .evaluate((node) => node.scrollIntoView({ block: "center" }));
  await frame.locator(".bpx-player-container").hover();
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/live-player-click-drag.png",
  });
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(
    "docs/player-interactions-live-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
