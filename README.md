# bilioffice

把 B 站网页整理成办公聊天界面：一个用户脚本内置企业微信、钉钉、飞书三种主题，默认企业微信。首页推荐、搜索结果和视频详情共享消息卡片、播放器、评论与设置逻辑。

## 首版能力

- 推荐流、热门入口、搜索结果、普通视频详情与分 P URL。
- 封面预览使用独立的 16:9 容器，播放按钮在当前消息气泡中加载 B 站同源视频页 iframe。
- 放大/还原、Esc 和“视频页”入口复用同一 iframe，不重置播放会话；同时只保留一个播放实例。
- 评论及楼中楼的展示模型、异步加载状态与失败重试；未适配的互动回到 B 站原版。
- 设置保存在 `bilioffice.settings` 命名空间：主题、浅色/深色/跟随系统、头像/会话名伪装、隐藏媒体。伪装只改变本地界面，不隐藏网络访问记录。
- 搜索支持 Enter、清空后重新搜索、排序选择和翻页；关键词渲染经过 HTML 转义。

## 安装与升级

1. 安装 Tampermonkey、Violentmonkey 等用户脚本管理器。
2. 打开 `dist/bilioffice.user.js`，复制全部内容新建脚本并保存。
3. 刷新 `www.bilibili.com` 或 `search.bilibili.com`。在“设置”中切换主题；“原版”会停用界面并刷新页面。
4. 升级时用新构建产物替换脚本内容即可。不要同时启用旧 BiliShu，避免两个脚本共同改写 DOM。

## 权限与兼容性

脚本只匹配 B 站主站与搜索子域，使用 `GM_getValue`/`GM_setValue`（当前版本优先使用 localStorage 以便本地测试）和 `GM_openInTab` 兼容入口；不需要跨站请求权限。iframe 只指向 B 站自身来源，并设置 `allow="autoplay; fullscreen; picture-in-picture"`。登录、清晰度、付费、地区限制与风控仍由 B 站决定。

当前验证环境是 Chromium + Tampermonkey 风格脚本注入。Safari、Firefox、移动端以及登录后真实评论发布尚未逐一验证。

## 开发

```sh
npm install
npm run build       # 生成 dist/bilioffice.user.js
npm run check       # 语法检查最终用户脚本
npm run test:unit   # 纯 Node 检查
npm test            # Playwright 模拟页面回归并生成 docs/qa-home.png
```

模拟回归使用真实尺寸 SVG 图片路由来检查 16:9 封面布局、气泡播放器节点稳定性、放大/还原、主题切换和空搜索。它不声称验证真实 B 站播放成功。真实站点可能受登录、网络、CSP 或风控影响；当前版本把真实视频页交给 B 站原生 iframe，不绕过这些限制。

## 已知限制

- 首版以共享数据模型和可运行的兼容回退为主；当 B 站 DOM 或接口变化时，推荐/搜索数据会退回内置状态提示，需后续适配原站 API。
- 评论展示首版提供已加载主评论和楼中楼模型，未自动发送评论、点赞、关注、收藏。
- 这是本地用户脚本，不会自动创建远程仓库、推送或发布。

## 架构

`src/types.ts` 定义共享类型；`src/core/settings.ts` 管理设置；`src/adapters/bilibili.ts` 负责路由、数据和原版回退；`src/player.ts` 管理单一 iframe 播放会话；`src/themes.ts` 与 `src/styles.ts` 提供主题 tokens 和作用域样式；`src/main.ts` 组装 Shell、消息、搜索和评论。`scripts/build.mjs` 用 esbuild 将其打包成一个可安装用户脚本。
