---
name: mistakes-lessons
description: 本项目开发中犯过的错误及教训，避免重复
metadata:
  type: feedback
---

> 版本：v1.0 | 日期：2026-06-11

## 🔴 严重错误（不应再犯）

### 1. 一次性改动太多文件
**何时**：i18n + 紧凑 UI + 3 个 Bug 修复同时上。
**后果**：用户测试时发现"还不如上一个版本"（刷新按钮消失、功能退化）。
**教训**：**一次只改一个模块**，编译 → 构建 → 用户验证 → 通过后再下一个。

### 2. B9 — 同一根因反复试 5 次
**何时**：QuickPick 收藏/置顶图标点击不刷新。
**尝试**：setItems 修复 → setState 函数式 → getState+setState → 乐观更新 → e.target.closest + forceUpdate。
**后果**：全部失败，浪费大量 token。
**教训**：**先诊断后动手**。写一个独立诊断脚本验证假设，比一次次改代码高效得多。5 次失败说明根因不在 Zustand/React，而在 DOM 事件层。

### 3. 不更新版本号和修订记录
**何时**：几乎每次改代码都忘了更新 `@version` 和修订记录表。
**后果**：用户指出 "我不是加了 hook 吗好像没有触发" — revision-check hook 检测到文件被修改但版本头未更新。
**教训**：**每次修改文件立即更新版本头**（`@version x.y` + 修订记录表追加一行）。

### 4. 文档滞后于代码
**何时**：改了大量代码后才想起来更新设计文档。
**后果**：文档与实际实现不一致，后续开发没有可靠参考。
**教训**：**先更新设计文档，再改代码。** [[user-habits]] 明确指出 "修改实现必须同步更新设计文档"。

## 🟡 技术错误（应避免）

### 5. Zustand setItems 不支持函数式更新
**何时**：`setItems((prev) => [item, ...prev])`。
**后果**：`items` 被设为函数对象而非数组，导致渲染崩溃。
**教训**：Zustand 的 **action** 接收具体值，不是更新函数。函数式更新要用 `useStore.setState((state) => ...)`。

### 6. better-sqlite3 `.get({ id })` 错误
**何时**：`db.prepare('... WHERE id=?').get({ id })`。
**后果**：`Too few parameter values` — 对象不能绑定到 `?` 占位符。
**教训**：`?` 占位符必须用位置参数 `.get(id)`，不能用对象 `.get({id})`。对象只用于命名参数 `@id` / `$id`。

### 7. Ant Design Sider 导致 overflow hidden
**何时**：`<Layout.Sider>` 内部默认 `overflow: hidden`，覆盖了我们设置的 `overflow: auto`。
**后果**：列表无法滚动，"清空所有"按钮被遮挡。
**教训**：Ant Design 布局组件有自己的内部样式，列表/侧边栏场景用原生 `<div>` 更可控。

### 8. QuickPick 用了错误的 Zustand API
**何时**：在 `onNewItem` 回调中对 Zustand action 传函数参数。
**后果**：QuickPick 的 `onNewItem` 将 `items` 设为函数对象 → 自动刷新崩溃。
**教训**：区分 Zustand action（`addItem(item)`）和 Zustand setState（`setState(fn)`）的用法。

## 🟢 流程改进（已采用）

- ✅ **诊断脚本优先**：`scripts/diag-full.cjs` 独立验证后端功能
- ✅ **Bug 追踪表**：B1-B11 编号管理
- ✅ **设计文档先行**：改代码前更新 `ui-design.md` / `architecture.md`
- ✅ **start-electron.cjs**：解决 `ELECTRON_RUN_AS_NODE` 环境变量问题
