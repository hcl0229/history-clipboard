# History Clipboard — 项目总览

> 版本：v1.2 | 日期：2026-06-11
> 状态：重构中 · 文档已与实现同步

## 愿景

一款符合个人使用习惯的 Windows 历史剪贴板管理工具。轻量、快速、可控——日常通过快捷键浮窗快速调用，需要整理时打开主窗口进行管理。

## 核心功能一览

| 功能 | 说明 |
|------|------|
| 🔍 剪贴板监控 | 自动记录文本、HTML、图片，300ms 轮询 + SHA256 哈希去重 |
| 📌 置顶 | 常用内容固定在列表顶部，随时可取 |
| ⭐ 收藏 | 重要内容永久保留，不受自动清理影响 |
| 🧹 智能清理 | 非收藏+非置顶内容默认保留近 3 天，每小时自动清理 |
| ⌨️ 快捷键 | `Ctrl+Shift+V` 唤出浮窗，↑↓ 选择，Enter 粘贴，Esc 关闭 |
| 🖥️ 系统托盘 | 最小化到托盘，关闭窗口不退出，后台静默运行 |
| 🌐 国际化 | 中文 / English 切换，设置面板即时生效 |
| 🎨 外观定制 | 亮/暗主题、7 种强调色、12-18px 字号可调 |
| 🚀 开机自启 | 可配置开机自动启动（Windows 注册表） |

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Electron 28+ |
| 前端 | React 18 + TypeScript 5 |
| UI 组件库 | Ant Design 5 |
| 状态管理 | Zustand |
| 数据库 | better-sqlite3 |
| 打包 | electron-builder → .exe/.msi |

**为什么选 Electron？**
- 企业级验证（VS Code、Slack、飞书均基于 Electron）
- 剪贴板 API 生态成熟，`electron-clipboard-extended` 久经考验
- HTML/CSS 实现外观定制最为灵活
- 一条命令打包 Windows 安装包（NSIS 向导）

## 项目结构

```
history-clipboard/
├── docs/                     ← 你在这里
│   ├── README.md             # 本文档
│   ├── architecture.md       # 架构设计
│   ├── feature-spec.md       # 功能规格
│   └── ui-design.md          # 界面设计
├── src/                      # 源码
│   ├── main/                 #   Electron 主进程
│   ├── preload/              #   contextBridge 安全桥接
│   ├── renderer/             #   React 渲染进程
│   └── shared/               #   共享类型定义
├── tests/                    # 测试
│   ├── unit/
│   └── e2e/
├── resources/                # 图标等静态资源
├── memory/                   # 跨会话记忆
├── data/                     # 测试数据 / 种子数据
├── scripts/                  # 构建/迁移/工具脚本
├── .github/workflows/        # CI/CD
└── package.json              # 依赖与脚本
```

## 📚 文档导航

### 设计文档

| 文档 | 版本 | 内容 |
|------|------|------|
| [feature-spec.md](./feature-spec.md) | v2.0 | 功能清单（按实现状态分：✅ 已实现 / 🔴 待修复 / P1-P2 待实现） |
| [architecture.md](./architecture.md) | v1.3 | 架构设计、IPC 通道表、关键设计决策（5 条） |
| [ui-design.md](./ui-design.md) | v2.0 | 界面设计、窗口尺寸、色彩系统、QuickPick 重构方案 |

### 项目管理

| 文档 | 内容 |
|------|------|
| [implementation-plan.md](./implementation-plan.md) | 执行计划 v6、B1-B11 Bug 追踪表、当前重构阶段 |
| [problem-summary.md](./problem-summary.md) | 12 个问题系统性总结、架构级问题分析 |

### 记忆文件

| 文件 | 内容 |
|------|------|
| [user-habits.md](../memory/user-habits.md) | 用户编码习惯和偏好（17 条） |
| [mistakes-lessons.md](../memory/mistakes-lessons.md) | 本项目犯过的错误和教训 |
| [MEMORY.md](../memory/MEMORY.md) | 跨会话记忆索引 |

## 快速开始

```bash
# 环境要求：Node.js 18+, npm 9+, Windows 10+

# 克隆后进入项目
cd history-clipboard

# 安装依赖
npm install

# ⚠️ 确保 ELECTRON_RUN_AS_NODE 环境变量未设置
# 在 CMD: set ELECTRON_RUN_AS_NODE=
# 在 PowerShell: $env:ELECTRON_RUN_AS_NODE=""

# 生产模式启动（构建 + 启动）
npm start

# 开发模式启动（热重载）
npm run dev

# 打包为 Windows 安装包
npm run build:win
```

## 参考对标产品

| 产品 | 优势 | 本项目差异点 |
|------|------|------------|
| Ditto | 功能全面、插件系统 | 界面更现代、中文优先、开箱即用 |
| Win+V | 系统内置、零安装 | 支持收藏/置顶/长期历史、外观定制 |
| ClipClip | 文件夹式管理 | 更轻量、专注快速调用而非知识管理 |

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.2 | 2026-06-11 | 文档体系重构：新导航表、链接记忆文件、习惯/错误总结 | WorkBuddy |
| v1.1 | 2026-06-11 | MVP 实现完成：i18n、紧凑 UI、Bug 修复 | WorkBuddy |
| v1.0 | 2026-06-09 | 初始版本，项目总览 | WorkBuddy |
