# MEMORY.md — 跨会话记忆索引

> 版本：v1.3 | 日期：2026-06-11

## 记忆文件清单

- [用户编码习惯](user-habits.md) — 版本头、计划先行、逐个修复、Bug 表格追踪
- [错误与教训](mistakes-lessons.md) — 一次性改太多、B9 五连败、不更新版本号、文档滞后
- [项目背景与架构决策](architecture-decisions.md) — 技术选型理由和设计原则

## 当前状态

MVP 实现阶段。后端全部通过诊断（6/7），前端 QuickPick 待重构（B9: 弃用 Ant Design List 改用原生 div）。所有设计文档已更新至最新状态。

## 活跃话题

| 话题 | 状态 | 涉及文件 |
|------|------|---------|
| QuickPick 重构 (B9+B11) | 🔴 待实施 | QuickPick.tsx, ui-design.md |
| 文档体系整理 | 🟢 已完成 | user-habits.md, mistakes-lessons.md, 所有 docs/ |
| 跨窗口同步机制 | 🟢 已完成 | ipc-handlers.ts, preload/index.ts |
| i18n 国际化接入 | 🟡 P1 排队中 | i18n.ts, locales/ |
| 打包 + 图标 | 🟡 P1 排队中 | resources/, electron-builder |

## 关键提醒

- **ELECTRON_RUN_AS_NODE 环境变量**：启动前必须在 CMD 执行 `set ELECTRON_RUN_AS_NODE=`
- **先更新设计文档，再改代码** — 见 [[user-habits]]
- **一次只改一个模块** — 见 [[mistakes-lessons]]
- **B9 根因已定位**：Ant Design List + Paragraph 拦截点击事件，重构方案见 [[../docs/ui-design]]
