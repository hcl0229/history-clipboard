# History Clipboard

> Windows 桌面端历史剪贴板管理工具 — 轻量、快速、可控

[![CI](https://github.com/hcl0229/history-clipboard/actions/workflows/ci.yml/badge.svg)](https://github.com/hcl0229/history-clipboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-133%2F133-brightgreen)](tests/)

日常通过 `Ctrl+Shift+V` 快速调用浮窗，需要整理时打开主窗口管理。支持收藏、置顶、搜索、暗色主题、中英切换。

## 快速开始

```bash
git clone https://github.com/hcl0229/history-clipboard.git
cd history-clipboard
npm install
npm start
```

## 使用

| 操作 | 方式 |
|------|------|
| 唤出浮窗 | `Ctrl+Shift+V` |
| 粘贴 | `Enter`（选中条目） |
| 关闭浮窗 | `Esc` |
| 收藏/置顶 | 点击 ⭐ / 📌 图标 |

## 技术栈

**Electron 28** + **React 18** + **TypeScript 5** + **Ant Design 5** + **Zustand 5** + **better-sqlite3** + **Vite 5**

## 文档

完整文档见 [docs/](./docs/)：

| 文档 | 说明 |
|------|------|
| [docs/README.md](./docs/README.md) | 项目总览、安装使用、常见问题 |
| [docs/architecture.md](./docs/architecture.md) | 架构设计、IPC 通道、关键决策 |
| [docs/feature-spec.md](./docs/feature-spec.md) | 功能规格（实现状态） |
| [docs/ui-design.md](./docs/ui-design.md) | 界面设计、色彩系统 |

## 项目结构

```
src/
├── main/          # Electron 主进程（7 模块）
├── preload/       # contextBridge 安全桥接
├── renderer/      # React 渲染进程（3 页面 + 2 store + i18n）
│   ├── pages/     #   QuickPick / MainWindow / Settings
│   ├── stores/    #   clipboardStore / settingsStore
│   └── locales/   #   zh.json / en.json
└── shared/        # 类型定义
tests/             # 133 单元测试（4 files）
resources/         # 应用图标
scripts/           # 工具脚本
```

## 命令

| 命令 | 说明 |
|------|------|
| `npm start` | 构建 + 启动 |
| `npm run dev` | 开发模式 |
| `npm test` | 运行测试 |
| `npm run build:win` | 打包 .exe |

## 许可

[MIT License](LICENSE)

---

🤖 Built with [Claude Code](https://claude.ai/code)
