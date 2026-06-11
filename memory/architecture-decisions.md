# 架构决策记录

> 版本：v1.0 | 日期：2026-06-09

## ADR-001：选择 Electron 作为桌面框架

**状态**：已决定
**日期**：2026-06-09

**背景**：需要开发 Windows 桌面端剪贴板管理工具，要求支持系统托盘、全局快捷键、外观定制。

**决策**：选用 Electron 28+

**理由**：
- 企业级验证（VS Code、Slack、飞书均基于 Electron）
- 剪贴板 API 生态成熟，`electron-clipboard-extended` 久经考验
- HTML/CSS 实现外观定制最为灵活
- 一条命令打包 Windows 安装包（NSIS 向导）

**替代方案**：
- Tauri：更轻量但剪贴板 API 不够成熟
- WPF/WinForms：外观定制成本高，开发效率低

---

## ADR-002：选择 better-sqlite3 而非 sql.js

**状态**：已决定
**日期**：2026-06-09

**决策**：使用 better-sqlite3

**理由**：
- 同步 API，不需要 async/await 包装
- 性能优秀（C 扩展，非纯 JS）
- 支持 WAL 模式

---

## ADR-003：选择 Zustand 而非 Redux

**状态**：已决定
**日期**：2026-06-09

**决策**：使用 Zustand 5.x

**理由**：
- 应用状态结构简单（clipboard list + settings）
- Zustand 样板代码少，学习成本低
- 不需要 Redux DevTools 级别的调试能力

---

## 修订记录

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-06-09 | 初始版本，3 条 ADR | WorkBuddy |
