# Agentic AI 全栈指南

基于 Guo et al. 的 [The Hitchhiker’s Guide to Agentic AI](https://arxiv.org/abs/2606.24937)
制作的中英双语分层精读站。课程将 636 页、30 章内容重组为 12 个学习单元，并提供六个
交互实验、60 道原创学习题、简化 SM-2 间隔复习、批注、静态搜索和本地进度管理。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

常用校验：

```bash
npm run typecheck
npm run lint
npm test
```

## 路由

- `/`：课程首页与 30 章知识地图
- `/learn/[slug]`：12 个学习单元
- `/review`：到期复习
- `/notes`：批注、Markdown 导出与 JSON 备份/恢复
- `/progress`：完成度、正确率与薄弱主题

学习状态使用版本化 `LearningState` 保存在浏览器 `localStorage`，不需要账号、数据库
或模型 API。

## 内容与许可

原作由 Guo et al. 以
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 发布。本站对原作进行了
重组、双语解释、图表网页化和原创练习，并沿用同一许可。站点代码可在保留本说明的前提下
使用；论文原图的署名与页码见各学习页图注。

参考站仅用于理解学习产品的信息架构；本站未复制其正文、品牌视觉或 SVG 素材。
