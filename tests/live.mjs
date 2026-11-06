import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const source = await readFile("dist/bilioffice.user.js", "utf8");
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const report = {
  kind: "real-bilibili",
  date: new Date().toISOString(),
  environment: "Chromium clean context, no login",
  checks: [],
  pageErrors: [],
  networkFailures: [],
  notes: [
    "GM HTTP emulation uses same browser context request client; no cookie or token extraction.",
    "No comments, likes, favorites, follows or media downloads performed.",
  ],
};
await context.exposeBinding("__boRequest", async (_, url) => {
  try {
    const r = await context.request.get(url, { timeout: 18000 });
    return { status: r.status(), responseText: await r.text() };
  } catch (e) {
    return {
      status: 0,
      responseText: JSON.stringify({ code: -1, message: e.message }),
    };
  }
});
await context.addInitScript(() => {
  window.GM_xmlhttpRequest = (o) => {
    let aborted = false;
    window.__boRequest(o.url).then((r) => {
      if (!aborted) o.onload(r);
    });
    return {
      abort() {
        aborted = true;
      },
    };
  };
});
await context.addInitScript(source);
const p = await context.newPage();
p.setDefaultTimeout(8000);
p.on("pageerror", (e) =>
  report.pageErrors.push({ url: p.url(), error: e.message }),
);
p.on("requestfailed", (r) =>
  report.networkFailures.push({
    url: r.url().split("?")[0],
    error: r.failure()?.errorText,
  }),
);
for (const [name, url] of [
  ["home", "https://www.bilibili.com/"],
  ["search", "https://search.bilibili.com/all?keyword=%E7%A7%91%E6%8A%80"],
  ["detail", "https://www.bilibili.com/video/BV1xx411c7mD/?p=1"],
]) {
  const result = { name, url };
  try {
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p.waitForTimeout(6000);
    if (name === "home") {
      await p.evaluate(() => window.__bilioffice?.refresh());
      await p.waitForTimeout(1500);
    }
    result.cards = await p.locator(".bo-play").count();
    result.status = await p.locator(".bo-status").allTextContents();
    for (const theme of ["wecom", "dingtalk", "feishu"]) {
      await p.getByRole("button", { name: "⚙ 设置", exact: true }).click();
      await p.locator("[data-setting=theme]").selectOption(theme);
      await p
        .locator(".bo-settings")
        .getByRole("button", { name: "关闭", exact: true })
        .click();
      await p
        .locator("#bilioffice-root")
        .screenshot({ path: `docs/screenshots/live-${name}-${theme}.png` });
    }
    if (result.cards) {
      await p
        .locator(".bo-play")
        .nth(name === "home" ? Math.min(2, result.cards - 1) : 0)
        .click();
      await p
        .waitForFunction(
          () =>
            Number(document.querySelector(".bo-inline-player")?.dataset.time) >
            0.4,
          {},
          { timeout: 22000 },
        )
        .catch(() => {});
      result.location = p.url();
      result.playerStatus = await p
        .locator(".bo-player-status")
        .allTextContents();
      result.before = await p.evaluate(
        () =>
          Number(document.querySelector(".bo-inline-player")?.dataset.time) ||
          0,
      );
      result.frames = p.frames().map((f) => f.url());
      if (result.before > 0) {
        await p.evaluate(
          () =>
            (window.savedFrame = document.querySelector(".bo-player iframe")),
        );
        await p.getByRole("button", { name: "放大或还原播放器" }).click();
        await p.keyboard.press("Escape");
        await p.waitForTimeout(1700);
        result.after = await p.evaluate(
          () =>
            Number(document.querySelector(".bo-inline-player")?.dataset.time) ||
            0,
        );
        result.sameFrame = await p.evaluate(
          () =>
            window.savedFrame === document.querySelector(".bo-player iframe"),
        );
      }
      await p
        .locator("#bilioffice-root")
        .screenshot({ path: `docs/screenshots/live-${name}-player.png` });
    }
  } catch (e) {
    result.failure = e.message;
  }
  report.checks.push(result);
  console.log(JSON.stringify(result));
}
await writeFile("docs/live-results.json", JSON.stringify(report, null, 2));
await browser.close();
