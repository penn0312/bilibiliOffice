import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const { version } = JSON.parse(await readFile("package.json", "utf8"));

const banner = `// ==UserScript==
// @name         bilioffice · B站办公聊天界面
// @namespace    https://github.com/penn0312/bilibiliOffice
// @version      ${version}
// @description  用企业微信、钉钉或飞书的聊天界面浏览 B 站，支持内联播放与搜索。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://bilibili.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// @connect      api.bilibili.com
// ==/UserScript==`;

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  loader: { ".css": "text" },
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  define: { __BILIOFFICE_VERSION__: JSON.stringify(version) },
  outfile: "dist/.bundle.js",
  sourcemap: false,
  minify: false,
  logLevel: "info",
});
const code = await readFile("dist/.bundle.js", "utf8");
const upstreamLicense = await readFile(
  "docs/licenses/linuxdo-idea-ui-MIT.txt",
  "utf8",
);
const userscript = `${banner}\n/*! bilioffice: independent implementation; BiliShu / linuxdo-idea-ui reference credit.\n${upstreamLicense}\n*/\n(() => {\n${code}\n})();\n`;
await Promise.all([
  writeFile("dist/bilioffice.user.js", userscript, "utf8"),
  writeFile(`dist/bilioffice-${version}.user.js`, userscript, "utf8"),
]);
console.log("built dist/bilioffice.user.js");
