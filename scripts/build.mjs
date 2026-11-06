import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const banner = `// ==UserScript==
// @name         bilioffice · B站办公聊天界面
// @namespace    https://github.com/bilioffice/bilioffice
// @version      0.1.0
// @description  用企业微信、钉钉或飞书的聊天界面浏览 B 站，支持内联播放与搜索。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://bilibili.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @connect      www.bilibili.com
// @connect      search.bilibili.com
// ==/UserScript==`;

await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/main.ts'], bundle: true, format: 'iife', platform: 'browser', target: ['es2020'], outfile: 'dist/.bundle.js', sourcemap: false, minify: false, logLevel: 'info' });
const code = await readFile('dist/.bundle.js', 'utf8');
await writeFile('dist/bilioffice.user.js', `${banner}\n(() => {\n${code}\n})();\n`, 'utf8');
console.log('built dist/bilioffice.user.js');
