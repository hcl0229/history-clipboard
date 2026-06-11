# History Clipboard — 架构设计

## 1. 整体架构

```
┌────────────────────────────────────────────────────────────────┐
│                        Main Process (Node.js)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Clipboard    │  │ Hotkey       │  │ Tray Manager         │  │
│  │ Monitor      │  │ Manager      │  │ • 托盘图标            │  │
│  │ • 300ms 轮询 │  │ • 注册快捷键  │  │ • 右键菜单            │  │
│  │ • SHA256 去重│  │ • 冲突检测    │  │ • 最小化到托盘        │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────┘  │
│         │                 │                       │              │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────────┴──────────┐  │
│  │ Database     │  │ Auto Launch  │  │ Window Manager       │  │
│  │ • CRUD       │  │ • 注册表操作 │  │ • 主窗口/浮窗生命周期  │  │
│  │ • 清理调度    │  │ • 启用/禁用  │  │ • 窗口位置记忆         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    IPC Handlers                           │  │
│  │  clipboard:getHistory  clipboard:toggleFavorite           │  │
│  │  clipboard:search      clipboard:togglePin               │  │
│  │  clipboard:delete      clipboard:clearAll (排除收藏/置顶) │  │
│  │  settings:get          settings:set                      │  │
│  │  window:minimize       window:showQuickPick              │  │
│  └──────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                  contextBridge (preload.ts)                       │
│                window.electronAPI 暴露给渲染进程                  │
├──────────────────────────────────────────────────────────────────┤
│                     Renderer Process (Chromium)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    React Application                        │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ QuickPick   │  │ MainWindow   │  │ Settings         │  │ │
│  │  │ (浮窗页面)  │  │ (主窗口页面) │  │ (设置页面)       │  │ │
│  │  │             │  │              │  │                  │  │ │
│  │  │ • 搜索框    │  │ • 搜索框     │  │ • 主题切换      │  │ │
│  │  │ • 历史列表  │  │ • 历史列表   │  │ • 强调色选择    │  │ │
│  │  │ • 收藏/置顶 │  │ • 详情面板   │  │ • 快捷键配置    │  │ │
│  │  │ • 失焦隐藏  │  │ • 批量操作   │  │ • 开机自启开关  │  │ │
│  │  └─────────────┘  └──────────────┘  └──────────────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              Zustand Store                           │  │ │
│  │  │  clipboardStore: items[], searchQuery, filter...     │  │ │
│  │  │  settingsStore: theme, accentColor, fontSize...      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 2. 进程间通信（IPC）协议

### 2.1 通信通道定义

所有 IPC 通过 `contextBridge` 暴露的 `window.electronAPI` 调用，使用 `ipcRenderer.invoke` / `ipcMain.handle` 模式（Promise 风格）。

### 2.2 剪贴板相关通道

| 通道名 | 方向 | 参数 | 返回值 | 描述 |
|--------|------|------|--------|------|
| `clipboard:getHistory` | Renderer→Main | `{ limit?, offset?, filter? }` | `ClipboardItem[]` | 获取历史列表 |
| `clipboard:search` | Renderer→Main | `{ query: string }` | `ClipboardItem[]` | 全文搜索 |
| `clipboard:getById` | Renderer→Main | `{ id: number }` | `ClipboardItem` | 获取单条详情 |
| `clipboard:toggleFavorite` | Renderer→Main | `{ id: number }` | `ClipboardItem` | 切换收藏 |
| `clipboard:togglePin` | Renderer→Main | `{ id: number }` | `ClipboardItem` | 切换置顶 |
| `clipboard:delete` | Renderer→Main | `{ id: number }` | `void` | 单条删除 |
| `clipboard:deleteMultiple` | Renderer→Main | `{ ids: number[] }` | `void` | 批量删除 |
| `clipboard:clearAll` | Renderer→Main | `{}` | `number` (删除数) | 清除非收藏+非置顶 |
| `clipboard:copyToClipboard` | Renderer→Main | `{ id: number }` | `void` | 复制到系统剪贴板 |
| `clipboard:getStats` | Renderer→Main | `{}` | `Stats` | 统计信息 |

### 2.3 设置相关通道

| 通道名 | 方向 | 参数 | 返回值 | 描述 |
|--------|------|------|--------|------|
| `settings:get` | Renderer→Main | `{ key: string }` | `string` | 读取单项设置 |
| `settings:getAll` | Renderer→Main | `{}` | `Record<string,string>` | 读取全部设置 |
| `settings:set` | Renderer→Main | `{ key, value }` | `void` | 写入设置 |

### 2.4 窗口控制通道

| 通道名 | 方向 | 参数 | 返回值 | 描述 |
|--------|------|------|--------|------|
| `window:minimize` | Renderer→Main | `{}` | `void` | 最小化到托盘 |
| `window:showQuickPick` | Renderer→Main | `{}` | `void` | 显示浮窗 |
| `window:hideQuickPick` | Renderer→Main | `{}` | `void` | 隐藏浮窗 |

### 2.5 主进程→渲染进程推送

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `clipboard:newItem` | 新内容被监控到 | `ClipboardItem` |
| `clipboard:itemsCleared` | 自动/手动清理完成 | `{ deletedCount: number }` |
| `settings:changed` | 设置被修改 | `{ key, value }` |

## 3. 数据流详解

### 3.1 剪贴板监控流程

```
定时器触发 (每 300ms)
    │
    ▼
读取系统剪贴板内容
    │  electron.clipboard.readText() / readHTML() / readImage()
    ▼
计算 SHA256 哈希
    │
    ▼
查询 SQLite: 最近一条记录的 content_hash 是否相同？
    │
    ├── 相同 → 跳过（去重）
    │
    └── 不同 → 
        │
        ├── 获取当前前台窗口标题（source_app）
        │
        ├── INSERT INTO clipboard_history (...)
        │
        └── webContents.send('clipboard:newItem', item)
            │
            └── Renderer: store.addItem(item) → UI 自动刷新
```

### 3.2 清理调度流程

```
应用启动时  +  每 1 小时间隔
    │
    ▼
计算截止时间 = now() - retentionDays (默认 3 天)
    │
    ▼
DELETE FROM clipboard_history 
WHERE created_at < 截止时间
  AND is_favorite = 0 
  AND is_pinned = 0
    │
    ▼
检查是否超出最大记录数 (默认 1000)
    │
    ├── 未超出 → 结束
    │
    └── 超出 →
        │
        DELETE 最旧的 非收藏+非置顶 记录，直到满足上限
        │
        └── webContents.send('clipboard:itemsCleared', { deletedCount })
```

### 3.3 列表排序规则

```
ORDER BY 
    is_pinned DESC,      -- 置顶优先
    is_favorite DESC,    -- 其次收藏
    created_at DESC      -- 各组内按时间倒序
```

## 4. 窗口管理策略

### 4.1 浮窗（QuickPick Window）

```typescript
// 浮窗配置
{
  width: 420,
  height: 520,
  frame: false,           // 无边框
  resizable: true,        // 可调整大小
  alwaysOnTop: true,      // 置顶
  skipTaskbar: true,      // 不显示在任务栏
  show: false,            // 默认隐藏
  // 失焦自动隐藏
}
```

**生命周期**：
- 快捷键唤起 → `win.show()` + `win.focus()` + 定位到鼠标所在显示器中心
- 失焦 → `win.hide()`（保留内容和滚动位置）
- 按 Esc → `win.hide()`
- 选中条目 → 复制到剪贴板 → `win.hide()`

### 4.2 主窗口（Main Window）

```typescript
// 主窗口配置
{
  width: 800,
  height: 600,
  minWidth: 500,
  minHeight: 400,
  frame: true,           // 有边框（标准窗口）
  // 关闭行为：隐藏到托盘而非退出
}
```

**生命周期**：
- 首次启动 → 自动打开主窗口
- 关闭按钮 → 最小化到托盘
- 托盘菜单「打开主窗口」→ 恢复并聚焦
- 托盘菜单「退出」→ 真正退出应用

### 4.3 窗口记忆

主窗口关闭时保存位置和尺寸到 SQLite settings 表：
- `window.main.x`, `window.main.y`
- `window.main.width`, `window.main.height`
- `window.main.maximized`

## 5. 数据安全设计

### 5.1 数据存储位置

```
%APPDATA%/history-clipboard/
├── clipboard.db          # SQLite 数据库
├── settings.json         # 运行时设置缓存（可选）
└── logs/                 # 日志文件
```

### 5.2 安全考量

| 维度 | 策略 |
|------|------|
| 数据隔离 | 数据存储在用户 AppData 目录，其他用户不可访问 |
| 敏感内容 | 提供应用白名单（可选功能），来自特定应用的内容不记录 |
| 内存安全 | 图片内容超过 1MB 时仅存储文件路径而非 Base64 |
| 进程隔离 | 渲染进程无 Node.js 权限，所有系统级操作通过 IPC |

## 6. 依赖关系

### 6.1 核心 npm 依赖

```json
{
  "dependencies": {
    "electron-clipboard-extended": "^1.x",
    "better-sqlite3": "^9.x",
    "electron-auto-launch": "^1.x"
  },
  "devDependencies": {
    "electron": "^28.x",
    "electron-builder": "^24.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "antd": "^5.x",
    "zustand": "^4.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/better-sqlite3": "^7.x"
  }
}
```

### 6.2 模块依赖图

```
index.ts
├── database.ts          (初始化 SQLite + 迁移)
├── clipboard-monitor.ts (依赖 database.ts)
├── hotkey-manager.ts    (依赖 clipboard-monitor 的状态)
├── tray-manager.ts      (依赖 window 实例)
├── auto-launch.ts       (独立)
└── ipc-handlers.ts      (依赖 database.ts, clipboard-monitor.ts)
```

## 7. 错误处理策略

| 场景 | 处理方式 |
|------|----------|
| SQLite 写入失败 | 日志记录，静默跳过该条，不阻塞监控循环 |
| 剪贴板读取异常 | 重试 3 次（间隔 1s），失败后跳过本轮 |
| 快捷键注册冲突 | 弹出提示引导用户更换快捷键 |
| 数据库损坏 | 自动备份旧文件，创建新数据库 |
| 图片过大（>10MB） | 跳过不记录，写入日志 |
