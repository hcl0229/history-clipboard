# MEMORY.md — 跨会话记忆索引

> 版本：v1.4 | 日期：2026-06-12

## 记忆文件清单

- [用户编码习惯](user-habits.md) — 版本头、计划先行、逐个修复、Bug 表格追踪
- [错误与教训](mistakes-lessons.md) — 一次性改太多、B9 五连败、不更新版本号、文档滞后
- [项目背景与架构决策](architecture-decisions.md) — 技术选型理由和设计原则

## 当前状态

MVP 已完成。所有功能正常工作，CI 全绿（133 tests）。

## 已完成话题

| 话题 | 状态 | 最终方案 |
|------|------|---------|
| QuickPick 重构 (B9+B11) | 🟢 已完成 | v2.4: 原生 div + loadItems() 全量刷新 + 14px 拖拽手柄 |
| 跨窗口同步 | 🟢 已完成 | clipboard:itemUpdated IPC 广播 |
| i18n 国际化接入 | 🟢 已完成 | react-i18next, App/MainWindow/QuickPick/Settings 全覆盖 |
| 暗色主题 | 🟢 已完成 | data-theme CSS + Ant Design darkAlgorithm |
| CI 流水线 | 🟢 已完成 | tsc + eslint + vitest, GitHub Actions |
| 测试覆盖 | 🟢 已完成 | 133 tests (4 files): utils / clipboardStore / settingsStore / i18n |
| 打包 | 🟡 可配置 | electron-builder NSIS 配置完成, 需管理员权限执行 |
| 图标 | 🟢 已完成 | scripts/generate-icon.cjs 生成多尺寸 icon.ico |

## 关键提醒

- **ELECTRON_RUN_AS_NODE 环境变量**：启动前必须在 CMD 执行 `set ELECTRON_RUN_AS_NODE=`
- **先更新设计文档，再改代码** — 见 [[user-habits]]
- **一次只改一个模块** — 见 [[mistakes-lessons]]
- **B9 教训**：4 次失败（乐观更新/await+setState/Zustand 订阅），最终方案是 loadItems() 全量刷新——不要过度设计，复用已验证的代码路径
