# History Clipboard — 项目总览

> 版本：v2.0 | 日期：2026-06-12
> 状态：MVP 完成 ✅ | CI 全绿 | 133 tests

[![CI](https://github.com/hcl0229/history-clipboard/actions/workflows/ci.yml/badge.svg)](https://github.com/hcl0229/history-clipboard/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Tests](https://img.shields.io/badge/tests-133%2F133%20passed-brightgreen)](#)

## 愿景

一款符合个人使用习惯的 Windows 历史剪贴板管理工具。轻量、快速、可控——日常通过快捷键浮窗快速调用，需要整理时打开主窗口进行管理。

---

## 安装与使用

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | 18+ |
| npm | 9+ |
| 操作系统 | Windows 10/11 |

### 从源码运行

```bash
# 1. 克隆仓库
git clone https://github.com/hcl0229/history-clipboard.git
cd history-clipboard

# 2. 安装依赖
npm install

# 3. 启动应用（自动构建 + 启动）
npm start
```

### 开发模式

```bash
# 终端 1：启动 Vite 开发服务器（热重载）
npm run dev

# 终端 2：启动 Electron
npm run dev:electron
```

### 打包为 Windows 安装包

```bash
npm run build:win
# 输出：release/History Clipboard Setup x.x.x.exe
```

> ⚠️ **注意**：确保环境变量 `ELECTRON_RUN_AS_NODE` 未设置。
> CMD 中执行 `set ELECTRON_RUN_AS_NODE=` 可清除。

---

## 使用指南

### 基本操作

| 操作 | 方式 | 说明 |
|------|------|------|
| 唤出浮窗 | `Ctrl+Shift+V` | 弹出 QuickPick 快速选择历史记录 |
| 粘贴内容 | `Enter` | 选中条目后回车，自动粘贴到当前应用 |
| 关闭浮窗 | `Esc` | 或点击浮窗外部区域 |
| 打开主窗口 | 系统托盘右键 → 打开主窗口 | 查看/管理完整历史 |
| 退出应用 | 系统托盘右键 → 退出 | 完全退出程序 |

### QuickPick 浮窗（Ctrl+Shift+V）

```
┌─────────────────────────────────┐
│ ▬▬▬ 可拖拽区域                  │
│ 🔍 搜索...                      │
│ 15 条 · ↑↓ Enter Esc       ↻   │
├─────────────────────────────────┤
│ 复制的内容预览...        ⭐ 📌  │  ← 淡红=置顶 浅黄=收藏
│ 刚刚                           │
│ 另一条内容...            ☆ 📍  │  ← 点击⭐收藏 点击📌置顶
│ 3分前                          │
│ ...（滚动查看更多）             │
└─────────────────────────────────┘
```

- **↑↓ 键** 选择条目
- **Enter** 复制并粘贴
- **Esc** 关闭浮窗  
- 点击 **⭐** 收藏/取消收藏
- 点击 **📌** 置顶/取消置顶
- 点击条目正文 → 立即复制

### 主窗口

- **剪切板** 标签：所有历史记录，置顶项排在最前
- **收藏** 标签：只看收藏的内容
- 选中条目后右侧显示**完整内容**，可执行复制/收藏/置顶/删除

### 设置

系统托盘右键 → 设置，或主窗口按 hash 路由跳转 `/settings`：

- 主题：浅色 / 深色
- 语言：中文 / English
- 字号：12-18px
- 强调色：7 种颜色可选
- 保留天数：1/3/7/14/30 天
- 最大记录数：100-5000
- 开机自启：启动时自动运行

---

## 核心功能一览

| 功能 | 状态 | 说明 |
|------|------|------|
| 🔍 剪贴板监控 | ✅ | 300ms 轮询 + SHA256 去重 + 异步前景检测 |
| 📌 置顶 | ✅ | 置顶项始终在列表最上方，淡红背景 |
| ⭐ 收藏 | ✅ | 收藏内容永久保留，不受自动清理影响 |
| 🧹 智能清理 | ✅ | 非收藏+非置顶内容按保留天数自动清理 |
| ⌨️ 快捷键 | ✅ | `Ctrl+Shift+V` 浮窗，↑↓ Enter Esc 导航 |
| 🖥️ 系统托盘 | ✅ | 最小化到托盘，关闭窗口不退出 |
| 🌐 国际化 | ✅ | 中文 / English，设置面板即时切换 |
| 🎨 暗色主题 | ✅ | 亮/暗双主题 + 7 种强调色 |
| 🚀 开机自启 | ✅ | Windows 注册表管理 |
| 🔄 跨窗口同步 | ✅ | 浮窗 ↔ 主窗口实时同步 |
| 📦 打包 | ⚠️ | electron-builder 配置完成，需管理员权限构建 |

---

## 技术栈

| 层级 | 选型 | 版本 |
|------|------|------|
| 框架 | Electron | 28.x |
| 前端 | React + TypeScript | 18.x / 5.x |
| UI 组件库 | Ant Design | 5.x |
| 状态管理 | Zustand | 5.x |
| 数据库 | better-sqlite3 | 11.x |
| 构建 | Vite | 5.x |
| 测试 | Vitest | 2.x |
| 打包 | electron-builder | 25.x |
| 国际化 | i18next + react-i18next | — |
| Lint | ESLint + Prettier | — |
| CI/CD | GitHub Actions | — |

---

## 项目结构

```
history-clipboard/
├── docs/                          # 设计文档
│   ├── README.md                  # 本文档（项目总览 + 安装使用）
│   ├── architecture.md            # 架构设计 + IPC 通道 + 设计决策
│   ├── feature-spec.md            # 功能规格（实现状态标记）
│   ├── ui-design.md               # 界面设计 + 色彩系统 + 重构方案
│   ├── implementation-plan.md     # 执行计划 + B1-B11 Bug 追踪表
│   └── problem-summary.md         # 问题全面总结 + 架构分析
├── src/
│   ├── main/                      # Electron 主进程（7 模块）
│   │   ├── index.ts               #   应用入口 + 生命周期
│   │   ├── database.ts            #   SQLite CRUD + 迁移 + 清理
│   │   ├── clipboard-monitor.ts   #   剪贴板监控（300ms 轮询）
│   │   ├── hotkey-manager.ts      #   全局快捷键注册
│   │   ├── tray-manager.ts        #   系统托盘 + 右键菜单
│   │   ├── auto-launch.ts         #   开机自启
│   │   └── ipc-handlers.ts        #   IPC 处理器
│   ├── preload/index.ts           # contextBridge 安全桥接
│   ├── renderer/                  # React 渲染进程
│   │   ├── App.tsx                #   路由 + 主题注入 + i18n 同步
│   │   ├── i18n.ts                #   i18next 配置
│   │   ├── pages/
│   │   │   ├── QuickPick.tsx      #   浮窗 v2.4（原生 div 渲染）
│   │   │   ├── MainWindow.tsx     #   主窗口 v1.5（2Tab + 详情）
│   │   │   └── Settings.tsx       #   设置面板 v1.2
│   │   ├── stores/
│   │   │   ├── clipboardStore.ts  #   剪贴板状态
│   │   │   └── settingsStore.ts   #   设置状态
│   │   ├── locales/               #   zh.json / en.json 翻译文件
│   │   └── styles/global.css      #   全局样式 + 暗色主题
│   └── shared/types.ts            # 共享类型定义 + ElectronAPI 接口
├── tests/                         # 测试（133 tests, 4 files）
│   ├── unit/
│   │   ├── utils.test.ts          #   38 tests · fmtTime/gist/itemBg
│   │   ├── clipboardStore.test.ts #   36 tests · setItems/addItem/filter
│   │   ├── settingsStore.test.ts  #   43 tests · 8 模块全覆盖
│   │   └── i18n.test.ts           #   16 tests · key 对称/插值/有效性
│   └── setup.ts
├── resources/icon.ico             # 应用图标（16/32/48/256px）
├── scripts/                       # 工具脚本
│   ├── generate-icon.cjs          #   图标生成（纯 Node.js）
│   ├── diag-full.cjs              #   全链路诊断
│   └── start-electron.cjs         #   Electron 启动包装器
├── memory/                        # 跨会话记忆
├── archive/                       # 每日工程报告
├── .github/workflows/ci.yml       # CI 流水线
└── package.json
```

---

## 命令速查

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm start` | 生产模式（构建 + 启动） |
| `npm run dev` | Vite 开发服务器 |
| `npm run dev:electron` | Electron 开发模式 |
| `npm run build` | tsc + vite 构建 |
| `npm run build:win` | 构建 + 打包 Windows 安装包 |
| `npm test` | 运行 133 个单元测试 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `node scripts/generate-icon.cjs` | 重新生成图标 |

---

## 常见问题

### Q: 启动报错 `ELECTRON_RUN_AS_NODE`
在 CMD 中执行 `set ELECTRON_RUN_AS_NODE=` 清除环境变量后重试。

### Q: `npm install` 失败（better-sqlite3 编译错误）
确保安装了 Windows 构建工具：
```bash
npm install --global windows-build-tools
```
或安装 Visual Studio 2022 with "Desktop development with C++"。

### Q: 托盘图标不显示
检查 `resources/icon.ico` 是否存在。可运行 `node scripts/generate-icon.cjs` 重新生成。

---

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
| v2.0 | 2026-06-12 | 全面更新：安装使用指南、CI badge、命令速查、常见问题、当前状态 | WorkBuddy |
| v1.2 | 2026-06-11 | 文档体系重构：新导航表、链接记忆文件、习惯/错误总结 | WorkBuddy |
| v1.1 | 2026-06-11 | MVP 实现完成：i18n、紧凑 UI、Bug 修复 | WorkBuddy |
| v1.0 | 2026-06-09 | 初始版本，项目总览 | WorkBuddy |
