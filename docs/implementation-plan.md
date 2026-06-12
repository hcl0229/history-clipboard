# History Clipboard — 执行计划

> 版本：v9 | 日期：2026-06-12 | 状态：MVP 全部完成 ✅ · B1-B11 · i18n · 暗色主题 · CI · 133 tests

---

## 当前阶段：✅ MVP 完成

**目标**：解决 B9（图标点击无反应）+ B11（窗口拖拽）。

**已完成**（详见 [ui-design.md](./ui-design.md) v2.1）：
1. ✅ QuickPick 列表从 `<List>` + `<Paragraph>` 改为原生 `<div>` + `.map()`
2. ✅ 事件直接 `onClick` 分离：`.item-content` → copy，`.item-actions span` → fav/pin
3. ✅ 标题栏 `-webkit-app-region: drag`，输入框 `no-drag`
4. ✅ CSS `-webkit-line-clamp: 2` 替代 `<Paragraph ellipsis>`
5. ✅ 移除 `useReducer` / `forceUpdate` hack

**涉及文件**：
- `src/renderer/pages/QuickPick.tsx` v2.0 — 列表渲染重写
- `src/renderer/styles/global.css` — `.item-text` / `.item-meta` / `-webkit-line-clamp`

---

## 🐛 Bug 追踪表

| # | 类型 | 描述 | 提出时间 | 优先级 | 状态 | 修复方案 |
|---|------|------|---------|--------|------|---------|
| B1 | Bug | 复制后不自动刷新 (QuickPick) | 06-11 | P0 | ✅ | `setItems` 不支持函数式更新，改用 `addItem` |
| B2 | Bug | 复制后不自动刷新 (MainWindow) | 06-11 | P0 | ✅ | MainWindow 缺少 `onNewItem` 监听 |
| B3 | Bug | 统计数与列表对不上 | 06-11 | P0 | ✅ | stats 改为从 items useMemo 派生 |
| B4 | Bug | 左侧列表无滚动条 | 06-11 | P0 | ✅ | 替换 Ant Sider 为 div，加 minHeight:0 |
| B5 | 优化 | 置顶不应独立 Tab | 06-11 | P1 | ✅ | 2Tab 剪切板/收藏、淡红/浅黄背景色区分 |
| B6 | Bug | 主界面不显示收藏/置顶图标 + 置顶取消不掉 | 06-11 | P0 | ✅ | 列表始终显图标、selected 同步更新 |
| B7 | Bug | 主界面列表图标不可点击 | 06-11 | P0 | ✅ | 图标加 onClick → handleFav/handlePin |
| B8 | 优化 | 快速入口图标太淡 | 06-11 | P2 | ✅ | 颜色 #bfbfbf→#999，尺寸 13→14px |
| B9 | Bug | 快速入口收藏/置顶后不刷新 | 06-11 | P0 | ✅ | **v2.1: useState 本地渲染 + setRenderItems(prev=>...) 保证重渲染** |
| B10 | Bug | 快速入口收藏/置顶后主界面不同步 | 06-11 | P0 | ✅ | 新增 clipboard:itemUpdated 广播，preload 加 onItemUpdated |
| B11 | Bug | 快速入口无法拖拽移动窗口 | 06-11 | P1 | ✅ | 新增 14px `.quickpick-drag-handle` 纯拖拽区 + header 辅助 |

---

## B9 分析（v2.1 最终修复）

**现象**：QuickPick 点 ⭐/📌 → IPC 调用成功 → 但图标不变。

**v2.0 根因**：Ant Design `<List>` + `<Paragraph>` 内部劫持点击事件 → 已通过原生 div 重构解决。

**v2.0 遗留问题**：原生 div 后点击事件到达 handler，但 `useClipboardStore.setState()` 不触发 React 重渲染。
**v2.1 根因**：`onItemUpdated` IPC 回调极快（主进程同进程广播），在 React 渲染乐观更新之前即覆盖 state。

**v2.1 最终修复**：
- 渲染源从 `useClipboardStore()` 订阅改为 `useState(renderItems)` 本地状态
- 乐观更新直接走 `setRenderItems(prev => prev.map(...))` — React 原生 setState 100% 触发重渲染
- Zustand store 仅用于跨模块读取 + 跨窗口同步

---

## B10 分析：跨窗口状态不同步

**现象**：QuickPick 收藏后 → 主界面列表仍显示未收藏状态 → 需手动刷新。

**根因**：QuickPick 和 MainWindow 是**独立 BrowserWindow** → 各自独立的 Zustand store。DB 更新了但另一窗口不知情。

**方案**：新增 `clipboard:itemUpdated` IPC 广播通道。toggle 后主进程 `broadcast` 给所有窗口。渲染进程监听此事件更新本地 store。

**设计变更**：需更新 `docs/architecture.md` 的 IPC 通道表。

---

## Issue B3: 统计数与列表对不上

**现象**：右侧面板 "总 0 · 收藏 0 · 置顶 0" 始终显示 0，但左侧实际有数据。

**根因**：`stats` 是独立状态字段，只在 `addItem` 时 +1。`load` 用 `setItems` 直接替换整个数组，不更新 `stats`。两个数据源不同步。

**修复方案**：不维护独立 `stats` 字段，直接从 `items` 数组派生：
```
total     = items.length
favorites = items.filter(it => it.is_favorite).length  
pinned    = items.filter(it => it.is_pinned).length
```

**涉及文件**：`src/renderer/pages/MainWindow.tsx`

---

## Issue B4: 左侧列表无滚动条

**现象**：条目多了以后，"清空所有"按钮被推到屏幕外面，列表区域不出现滚动条。

**根因**：`Sider` 容器内部布局没有给列表区域设置 `overflow: auto` 和固定高度。Ant Design `Layout.Sider` 的默认行为导致内容溢出。

**修复方案**：
- 列表区域容器加 `flex: 1; overflow-y: auto; min-height: 0;`
- 确保 Sider 使用 `display: flex; flex-direction: column; height: 100vh;`
- 底部按钮栏设置 `flex-shrink: 0;`

**涉及文件**：`src/renderer/pages/MainWindow.tsx`

---

## 修复顺序

```
B3 (统计数对不上) → B4 (滚动条) → B5 (置顶布局) → B6 (00 + 空白)
```

每修一个，构建 + 你验证，通过后进入下一个。

---

## 已完成

| # | 描述 | 修复内容 |
|---|------|---------|
| B1-B11 | 全部 Bug | 见 B1-B11 追踪表 |
| P4 | 国际化 (i18n) | useTranslation 全部组件 + Settings 语言切换 |
| P5 | 暗色主题 | data-theme CSS + Ant Design darkAlgorithm |
| P6 | 文档同步 | docs/ 全面更新至 v2.0 |
| P7 | 图标 + 打包 | generate-icon.cjs + electron-builder NSIS 配置 |

## 后续可选

| # | 内容 |
|---|------|
| P8 | E2E 测试 (Playwright + Electron) |
| P9 | 快捷键自定义（设置中捕获按键） |
| P10 | 图片剪贴板端到端验证 |
| P11 | 主窗口 CSS 类化重构（替换 inline styles） |

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v9 | 2026-06-12 | MVP 完成：全部 P1 实现，CI 修复，133 tests，文档同步 | WorkBuddy |
| v8 | 2026-06-11 | B9 v2.1 修复：useState 渲染 + setRenderItems；B11 14px 拖拽手柄 | WorkBuddy |
| v7 | 2026-06-11 | QuickPick 重构完成：原生 div + CSS line-clamp + onClick 分离 | WorkBuddy |
| v6 | 2026-06-11 | B1-B11 追踪表、QuickPick 重构阶段、B9/B10 根因分析 | WorkBuddy |
