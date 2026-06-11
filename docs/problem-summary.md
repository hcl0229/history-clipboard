# History Clipboard — 问题全面总结

> 版本：v1.0 | 日期：2026-06-11 | 状态：12 问题全部列出，B9 根因定位待实施

---

## 一、架构级问题

### P1. 双窗口独立 Zustand Store

QuickPick 和 MainWindow 是**两个独立 BrowserWindow** → 各自独立的渲染进程 → **各自独立的 Zustand store**。

当前尝试用 `clipboard:itemUpdated` IPC 广播同步，但本质上是**打补丁**。每多一种操作（收藏/置顶/删除/清理），都要加一条广播。

**理想方案**：Zustand store 只存在于主进程。渲染进程通过 IPC 读写，主进程维护唯一数据源。

### P2. 事件处理脆弱

QuickPick 的 `stopPropagation` + `e.target.closest` 混合方案复杂且不可靠。经过 5 轮修复仍未解决星标点击问题。

**根因**：Ant Design `<List>` + `<Paragraph>` 内部事件机制与自定义 click handler 冲突。

## 二、功能 Bug（已确认）

| # | 描述 | 严重程度 | 复现 |
|---|------|---------|------|
| B9 | QuickPick 点 ⭐/📌 图标无反应 | 高 | 始终 |
| B11 | QuickPick 窗口无法拖拽 | 中 | 始终 |

## 三、已修复 Bug

| # | 描述 |
|---|------|
| B1-B2 | 自动刷新 (monitor.getNewItem 报错) |
| B3-B4 | 统计数 / 滚动条 |
| B5 | 置顶布局 + 背景色 |
| B6-B7 | 主界面图标 + onClick |
| B8 | QuickPick 图标太淡 |
| B10 | 跨窗口同步 (clipboard:itemUpdated) |

## 四、设计欠债

| 项 | 说明 |
|------|------|
| 国际化 | i18next 已安装、翻译文件已写，但 UI 暂未接入 |
| 暗色主题 | CSS 变量仅部分定义，未全量适配 |
| 窗口最小尺寸 | QuickPick 280×280 偏大 |
| 打包 | 未执行过 `npm run build:win` |
| 托盘图标 | `resources/icon.ico` 缺失，托盘空白 |

## 五、B9 专项分析

经过 5 轮尝试：
1. `setItems(items.map())` — 闭包过期
2. `setState(fn)` — 通知未触发
3. `getState() + setState({})` — 同上
4. 乐观更新 — 同上
5. `e.target.closest` + `forceUpdate` — click handler 仍未执行

**结论**：问题不在 Zustand，不在 React 渲染。是 **DOM 事件没有到达 QuickPick 的 onClick handler**。最可能的原因是 Ant Design `<List>` 或其子组件（`<Paragraph>`）内部劫持了点击事件。

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-06-11 | 12 问题系统性总结 + B9 5 轮尝试分析 + 重构方案建议 | WorkBuddy |
