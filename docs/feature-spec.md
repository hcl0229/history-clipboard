# History Clipboard — 功能规格 v2

> 版本：v2.2 | 日期：2026-06-12
> 状态：MVP 全部完成 ✅ · 所有 P0/P1/P2 已实现 · 133 tests · CI 全绿

---

## 功能清单（按实现状态）

### 已实现 (P0)

| 功能 | 描述 | 状态 |
|------|------|------|
| 剪贴板监控 | 300ms 轮询、SHA256 哈希去重、文本/HTML/图片 | ✅ |
| 前景应用检测 | 异步 PowerShell、2 秒缓存 | ✅ |
| 数据库 | SQLite WAL、自动建表迁移、默认设置 | ✅ |
| 收藏/置顶 | toggle 切换、乐观更新 UI、IPC 广播 | ✅ |
| 智能清理 | 每小时清理过期非收藏非置顶记录 | ✅ |
| QuickPick 浮窗 | Ctrl+Shift+V 唤起、搜索过滤、↑↓ Enter Esc | ✅ |
| 主窗口 | 2 Tab 剪切板/收藏、详情面板、搜索、清空 | ✅ |
| 设置面板 | 主题/强调色/字号/保留天数/最大记录/开机自启 | ✅ |
| 系统托盘 | 最小化到托盘、右键菜单 | ✅ |
| 开机自启 | Windows 注册表管理 | ✅ |
| 跨窗口同步 | `clipboard:itemUpdated` IPC 广播 | ✅ |
| 窗口自适应 | 按屏幕百分比计算初始尺寸 | ✅ |

### 已实现 (P1-P2)

| 功能 | 描述 | 状态 |
|------|------|------|
| 国际化 | i18next + react-i18next，全部组件覆盖，Settings 语言切换 | ✅ |
| 暗色主题 | data-theme CSS + Ant Design darkAlgorithm | ✅ |
| 图标 | scripts/generate-icon.cjs 生成 16/32/48/256px 多尺寸 ICO | ✅ |
| 打包 | electron-builder NSIS 配置完成 | ✅ |
| 图片支持 | 端到端读写验证通过（E2E 测试覆盖） | ✅ |
| 快捷键自定义 | 设置面板录制按键，运行时动态更新全局快捷键 | ✅ |
| E2E 测试 | 24 tests：DB/Settings/Monitor/IPC/Image/Dedup | ✅ |
| CSS 重构 | MainWindow inline styles → 40+ 语义化 CSS 类 | ✅ |
| CI 流水线 | GitHub Actions：lint + typecheck + test + build + E2E | ✅ |

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v2.2 | 2026-06-12 | 移除过时 P0 待修复表，P1-P2 全部标记已完成 | WorkBuddy |
| v2.1 | 2026-06-12 | 状态更新：B9 修复、图标生成、打包验证、单元测试 | WorkBuddy |
| v2.0 | 2026-06-11 | 按实际实现状态重新整理功能清单 | WorkBuddy |
| v1.0 | 2026-06-09 | 初始版本，功能规格 | WorkBuddy |
