# 来源与许可证核对

本项目是 TypeScript 独立重写，不分发原项目上万行单文件。参考了 BiliShu 的办公聊天思路，以及本机 0.7.1 已验证归档中的封面、播放节点稳定性、资源清理和评论经验；没有把包含未完成 0.8.0 搜索改造的本机草稿当作成品。

2026-11-06 核对：

- [Jack-Cherish/BiliShu](https://github.com/Jack-Cherish/BiliShu) 的 [bilishu.user.js](https://github.com/Jack-Cherish/BiliShu/blob/main/bilishu.user.js) 头部有 `@license MIT`，文件内包含完整 MIT 声明及 `Copyright (c) 2026 czm15053`；单独的根 `LICENSE` 路径本次返回 404，依据为脚本自身声明。
- 该脚本标注派生自 [czm15053/linuxdo-idea-ui](https://github.com/czm15053/linuxdo-idea-ui)，上游 commit `88653fc24432f6dfc61b26d488afc74f05eb230c`。上游 [LICENSE](https://github.com/czm15053/linuxdo-idea-ui/blob/main/LICENSE) 为 MIT，完整文本随本仓库保存在 [docs/licenses/linuxdo-idea-ui-MIT.txt](docs/licenses/linuxdo-idea-ui-MIT.txt)。
- bilioffice 代码以 MIT 许可提供，见 [LICENSE](LICENSE)。参考来源和完整许可文本保留在仓库，不能从产品界面的办公样式推断与企业微信、钉钉或飞书存在官方关系。

测试封面文件 `tests/fixtures/cover.avif` 来自 B 站页面实际图片，原始尺寸 672×378，用于重现真实图片的封面布局问题，不受本项目代码 MIT 许可覆盖。来源：`https://i0.hdslb.com/bfs/archive/ec2c23593bfb3cd0f46af378b53a9935eeba7bd8.jpg@672w_378h_1c_!web-home-common-cover.avif`。截图中的站点内容和媒体属于各自权利人。
