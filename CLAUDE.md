# CLAUDE.md — History Clipboard

> 版本：v1.2 | 日期：2026-06-11
> 状态：MVP 实现阶段，QuickPick B9+B11 双向修复完成

## 项目定位

Windows 桌面端历史剪贴板管理工具。轻量、快速、可控——日常通过快捷键浮窗快速调用，需要整理时打开主窗口进行管理。

## 技术栈

| 层级 | 选型 | 版本 |
|------|------|------|
| 框架 | Electron | ^28.3.x |
| 前端 | React + TypeScript | ^18.3 / ^5.6 |
| UI 组件库 | Ant Design | ^5.22 |
| 状态管理 | Zustand | ^5.0 |
| 数据库 | better-sqlite3 | ^11.7 |
| 构建 | Vite | ^5.4 |
| 打包 | electron-builder | ^25.1 |
| 测试 | Vitest | ^2.1 |
| Lint | ESLint + Prettier | ^8.57 / ^3.4 |

## 架构概览

```
history-clipboard/
├── docs/                        # 设计文档
│   ├── README.md
│   ├── architecture.md
│   ├── feature-spec.md
│   └── ui-design.md
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             #   应用入口 + 生命周期
│   │   ├── database.ts          #   SQLite 初始化 + 迁移
│   │   ├── clipboard-monitor.ts #   剪贴板监控
│   │   ├── hotkey-manager.ts    #   全局快捷键
│   │   ├── tray-manager.ts      #   系统托盘
│   │   ├── auto-launch.ts       #   开机自启
│   │   └── ipc-handlers.ts      #   IPC 处理器
│   ├── preload/index.ts         # contextBridge 安全桥接
│   ├── renderer/                # React 渲染进程
│   │   ├── App.tsx
│   │   ├── stores/
│   │   │   ├── clipboardStore.ts
│   │   │   └── settingsStore.ts
│   │   └── styles/global.css
│   └── shared/types.ts          # 共享类型定义
├── tests/                       # 单元 + E2E 测试
├── resources/                   # 图标等静态资源
├── memory/                      # 跨会话记忆
├── data/                        # 测试夹具 / 种子数据
├── scripts/                     # 构建 / 迁移 / 工具脚本
└── .github/workflows/           # CI

## IPC 通道

| 通道 | 方向 | 说明 |
|------|------|------|
| `clipboard:getHistory` | Renderer→Main | 获取历史列表 |
| `clipboard:search` | Renderer→Main | 全文搜索 |
| `clipboard:toggleFavorite` | Renderer→Main | 切换收藏 |
| `clipboard:togglePin` | Renderer→Main | 切换置顶 |
| `clipboard:delete` | Renderer→Main | 单条删除 |
| `clipboard:clearAll` | Renderer→Main | 清除非收藏+非置顶 |
| `settings:*` | Renderer→Main | 设置读写 |
| `clipboard:newItem` | Main→Renderer | 新条目推送 |

## 开发约定

### 代码风格
- 所有 TypeScript 文件必须有文件头部注释（`@version` + 修订记录）
- 使用 Prettier 格式化，ESLint 检查
- IPC 通道命名：`模块:动作`（如 `clipboard:getHistory`）
- 状态管理用 Zustand，不引入 Redux

### 提交规范
- 提交信息：`<type>: <简短描述>`
- 类型：`feat` / `fix` / `docs` / `refactor` / `test` / `chore`
- 示例：`feat: 新增剪贴板图片支持`

### 文件命名
- 组件：PascalCase（`QuickPick.tsx`）
- 模块：kebab-case（`clipboard-monitor.ts`）
- Store：camelCase + Store 后缀（`clipboardStore.ts`）

### 文档版本
- 所有 .md 文件必须包含版本 header 和修订记录表
- 版本号：主版本.次版本（v1.0）
- 修订记录在文件末尾

## 当前状态

- [x] 设计文档完成（4 份）
- [x] 工程骨架搭建
- [x] src/ 模块实现（MVP）
- [x] 浮窗 UI 实现（QuickPick v2.0 — 原生 div 重构完成）
- [x] 主窗口 UI 实现（MainWindow，2Tab 布局）
- [x] 设置面板实现
- [ ] 测试编写
- [ ] 打包配置调通

## 关键设计决策

1. **为什么选 Electron？** — 企业级验证（VS Code、Slack）、剪贴板 API 成熟、外观定制灵活
2. **为什么用 better-sqlite3？** — 同步 API 更简单、性能好、无额外依赖
3. **为什么不用 Redux？** — 应用状态简单，Zustand 足够且样板代码少
4. **为什么关闭按钮隐藏到托盘？** — 剪贴板管理工具需后台常驻
5. **清理策略为什么保护收藏/置顶？** — 用户核心需求：重要内容永不被自动删除

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.2 | 2026-06-11 | QuickPick 原生 div 重构完成，B1-B11 全部解决 | WorkBuddy |
| v1.1 | 2026-06-11 | 更新为 MVP 实现状态，新增跨窗口同步、QuickPick 重构方案 | WorkBuddy |
| v1.0 | 2026-06-09 | 初始版本，工程骨架搭建完成 | WorkBuddy |
