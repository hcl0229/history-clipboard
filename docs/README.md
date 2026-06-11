# History Clipboard — 项目总览

## 愿景

一款符合个人使用习惯的 Windows 历史剪贴板管理工具。轻量、快速、可控——日常通过快捷键浮窗快速调用，需要整理时打开主窗口进行管理。

## 核心功能一览

| 功能 | 说明 |
|------|------|
| 🔍 剪贴板监控 | 自动记录文本、HTML、图片内容，300ms 轮询 + 哈希去重 |
| 📌 置顶 | 常用内容固定在列表顶部，随时可取 |
| ⭐ 收藏 | 重要内容永久保留，不受自动清理影响 |
| 🧹 智能清理 | 非收藏+非置顶内容默认保留近 3 天，一键清除也仅针对这些内容 |
| ⌨️ 快捷键 | `Ctrl+Shift+V` 唤出浮窗，快速选择后自动复制并隐藏 |
| 🖥️ 系统托盘 | 最小化到托盘，后台静默运行 |
| 🎨 外观定制 | 亮/暗主题、强调色、字体大小可调 |
| 🚀 开机自启 | 可配置开机自动启动 |

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
├── design/                   ← 你在这里
│   ├── README.md             # 本文档
│   ├── architecture.md       # 架构设计
│   ├── feature-spec.md       # 功能规格
│   └── ui-design.md          # 界面设计
├── src/                      # 源码（待实现）
├── resources/                # 图标等静态资源
└── electron-builder.yml      # 打包配置
```

## 设计文档导航

| 想了解什么 | 看哪个文档 |
|-----------|-----------|
| 功能有哪些、怎么用 | [feature-spec.md](./feature-spec.md) |
| 系统怎么架构的、数据怎么流转 | [architecture.md](./architecture.md) |
| 界面长什么样、怎么交互 | [ui-design.md](./ui-design.md) |
| 怎么开始开发 | 本文档末尾的「快速开始」 |

## 快速开始（开发阶段）

```bash
# 环境要求：Node.js 18+, npm 9+

# 克隆后进入项目
cd history-clipboard

# 安装依赖
npm install

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
