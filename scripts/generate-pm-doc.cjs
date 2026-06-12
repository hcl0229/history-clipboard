/**
 * generate-pm-doc.cjs — 从当前项目状态生成项目管理 Excel
 *
 * 输出：docs/History-Clipboard-PM.xlsx
 *
 * Sheet 1: 修订记录 (Index)
 * Sheet 2: 需求清单 (Requirements)
 * Sheet 3: 问题追踪 (Bug Tracking)
 * Sheet 4: 风险管理 (Risks & Audit)
 * Sheet 5: 版本状态 (Version Status)
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ================================================================
// 样式工具
// ================================================================
function headerStyle(ws, range, cols) {
  for (let c = 0; c < cols; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '1677FF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
        left: { style: 'thin', color: { rgb: 'D9D9D9' } },
        right: { style: 'thin', color: { rgb: 'D9D9D9' } },
      },
    };
  }
}

function dataStyle(ws, startRow, endRow, cols) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = 0; c < cols; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { sz: 10 },
        alignment: { vertical: 'center', wrapText: true },
        border: {
          top: { style: 'hair', color: { rgb: 'E8E8E8' } },
          bottom: { style: 'hair', color: { rgb: 'E8E8E8' } },
          left: { style: 'hair', color: { rgb: 'E8E8E8' } },
          right: { style: 'hair', color: { rgb: 'E8E8E8' } },
        },
      };
    }
  }
}

function colorRows(ws, rows) {
  rows.forEach(([zeroBasedRow, color]) => {
    for (let c = 0; c < 10; c++) {
      const addr = XLSX.utils.encode_cell({ r: zeroBasedRow + 1, c });
      if (ws[addr]) {
        ws[addr].s = { ...ws[addr].s, fill: { fgColor: { rgb: color } } };
      }
    }
  });
}

function autoWidth(ws, cols, data) {
  ws['!cols'] = [];
  for (let c = 0; c < cols.length; c++) {
    let maxLen = cols[c].length;
    for (let r = 0; r < data.length; r++) {
      const val = String(data[r][c] ?? '');
      // Approximate: CJK characters as double width
      let len = 0;
      for (const ch of val) len += ch.charCodeAt(0) > 127 ? 2.2 : 1.1;
      maxLen = Math.max(maxLen, len);
    }
    ws['!cols'][c] = { wch: Math.min(Math.max(maxLen, 8), 60) };
  }
}

// ================================================================
// Sheet 1: 修订记录
// ================================================================
function buildRevisionSheet(wb) {
  const data = [
    ['版本', '日期', '修改内容', '作者'],
    ['v1.0', '2026-06-12', '初始创建：整合 feature-spec / implementation-plan / problem-summary 三文档', 'WorkBuddy'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  headerStyle(ws, 'A1:D1', 4);
  dataStyle(ws, 1, data.length - 1, 4);
  autoWidth(ws, data[0], data.slice(1));
  XLSX.utils.book_append_sheet(wb, ws, '修订记录');
}

// ================================================================
// Sheet 2: 需求清单
// ================================================================
function buildRequirementsSheet(wb) {
  const header = ['ID', '模块', '功能', '描述', '优先级', '状态', '实现文件', '备注'];
  const rows = [
    ['REQ-01', '剪贴板监控', '剪贴板轮询', '300ms 定时轮询系统剪贴板', 'P0', '✅ 已完成', 'src/main/clipboard-monitor.ts', 'SHA256 哈希去重'],
    ['REQ-02', '剪贴板监控', '前景应用检测', '异步 PowerShell 获取前台窗口标题', 'P0', '✅ 已完成', 'src/main/clipboard-monitor.ts', '2s 缓存，避免阻塞事件循环'],
    ['REQ-03', '数据库', 'SQLite 存储', 'WAL 模式，自动建表迁移', 'P0', '✅ 已完成', 'src/main/database.ts', '3 表：clipboard_history / settings / window_state'],
    ['REQ-04', '数据库', 'CRUD 操作', '插入/查询/更新/删除剪贴板记录', 'P0', '✅ 已完成', 'src/main/database.ts', ''],
    ['REQ-05', '数据库', '智能清理', '按保留天数+最大记录数自动清理非收藏非置顶', 'P0', '✅ 已完成', 'src/main/database.ts', '每小时执行一次'],
    ['REQ-06', '收藏/置顶', 'toggle 切换', '收藏/置顶状态切换，DB 持久化', 'P0', '✅ 已完成', 'src/main/database.ts', 'CASE WHEN 原子操作'],
    ['REQ-07', 'QuickPick', '浮窗唤起', 'Ctrl+Shift+V 全局快捷键唤起/关闭', 'P0', '✅ 已完成', 'src/main/index.ts + hotkey-manager.ts', '可自定义快捷键'],
    ['REQ-08', 'QuickPick', '列表渲染', '原生 div + CSS line-clamp 渲染剪贴板列表', 'P0', '✅ 已完成', 'src/renderer/pages/QuickPick.tsx v2.4', '已弃用 Ant Design List/Paragraph'],
    ['REQ-09', 'QuickPick', '搜索过滤', '实时搜索过滤剪贴板记录', 'P0', '✅ 已完成', 'src/renderer/pages/QuickPick.tsx', ''],
    ['REQ-10', 'QuickPick', '键盘导航', '↑↓ 选择 / Enter 粘贴 / Esc 关闭', 'P0', '✅ 已完成', 'src/renderer/pages/QuickPick.tsx', ''],
    ['REQ-11', 'QuickPick', '收藏/置顶操作', '点击⭐📌图标收藏/置顶，loadItems() 全量刷新', 'P0', '✅ 已完成', 'src/renderer/pages/QuickPick.tsx', 'B9 已修复：v2.3 loadItems 模式'],
    ['REQ-12', 'QuickPick', '窗口拖拽', '14px 拖拽手柄 + header 辅助拖拽区', 'P0', '✅ 已完成', 'src/renderer/styles/global.css', 'B11 已修复'],
    ['REQ-13', '主窗口', '2Tab 布局', '剪切板 Tab（置顶优先）+ 收藏 Tab', 'P0', '✅ 已完成', 'src/renderer/pages/MainWindow.tsx v1.6', 'CSS 类化重构完成'],
    ['REQ-14', '主窗口', '详情面板', '选中条目显示完整内容，支持复制/收藏/置顶/删除', 'P0', '✅ 已完成', 'src/renderer/pages/MainWindow.tsx', ''],
    ['REQ-15', '主窗口', '搜索清空', '搜索过滤 + 清空非收藏非置顶记录', 'P0', '✅ 已完成', 'src/renderer/pages/MainWindow.tsx', ''],
    ['REQ-16', '设置面板', '外观设置', '主题/强调色/字号/语言切换', 'P0', '✅ 已完成', 'src/renderer/pages/Settings.tsx v1.3', ''],
    ['REQ-17', '设置面板', '数据设置', '保留天数/最大记录数/开机自启', 'P0', '✅ 已完成', 'src/renderer/pages/Settings.tsx', ''],
    ['REQ-18', '设置面板', '快捷键自定义', '录制按键组合，运行时动态更新全局快捷键', 'P2', '✅ 已完成', 'src/renderer/pages/Settings.tsx', 'P9 已完成'],
    ['REQ-19', '系统托盘', '托盘图标+菜单', '系统托盘图标、右键菜单、左键浮窗', 'P0', '✅ 已完成', 'src/main/index.ts', '⚠️ 审计 C1: 图标用 createEmpty() 不可见'],
    ['REQ-20', '开机自启', 'Windows 注册表', '可配置开机自动启动', 'P0', '✅ 已完成', 'src/main/auto-launch.ts', ''],
    ['REQ-21', '跨窗口同步', 'IPC 广播', 'clipboard:itemUpdated 跨 QuickPick/MainWindow 状态同步', 'P0', '✅ 已完成', 'src/main/ipc-handlers.ts + preload', ''],
    ['REQ-22', '国际化', 'i18n 中英切换', 'i18next + react-i18next，全部组件覆盖', 'P1', '✅ 已完成', 'src/renderer/i18n.ts + locales/', '⚠️ 审计 C2/C3: 托盘菜单未 i18n'],
    ['REQ-23', '暗色主题', '亮/暗双主题', 'data-theme CSS + Ant Design darkAlgorithm', 'P1', '✅ 已完成', 'src/renderer/styles/global.css + App.tsx', ''],
    ['REQ-24', '应用图标', '多尺寸 ICO', 'scripts/generate-icon.cjs 生成 16/32/48/256px', 'P1', '✅ 已完成', 'resources/icon.ico', ''],
    ['REQ-25', '打包', 'NSIS 安装包', 'electron-builder 配置完成', 'P1', '✅ 已完成', 'package.json (build 字段)', 'npm run build:win'],
    ['REQ-26', '测试', '单元测试', '133 tests: utils(38) + clipboardStore(36) + settingsStore(43) + i18n(16)', 'P1', '✅ 已完成', 'tests/unit/', ''],
    ['REQ-27', '测试', 'E2E 集成测试', '24 tests: DB/Settings/Monitor/IPC/Image/Dedup', 'P2', '✅ 已完成', 'tests/e2e/', ''],
    ['REQ-28', 'CI/CD', '本地预检', 'pre-push hook + npm run check: lint→typecheck→build→test→e2e', 'P2', '✅ 已完成', '.git/hooks/pre-push + package.json', 'GitHub Actions 已暂停'],
  ];

  const fullData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  headerStyle(ws, 'A1:H1', 8);
  dataStyle(ws, 1, rows.length, 8);
  autoWidth(ws, header, rows);

  // 颜色：P0 蓝色行、P1 黄色行、P2 灰色行
  const coloredRows = rows
    .map((r, i) => {
      if (r[4] === 'P2') return [i, 'F5F5F5'];
      return null;
    })
    .filter(Boolean);
  colorRows(ws, coloredRows);

  XLSX.utils.book_append_sheet(wb, ws, '需求清单');
}

// ================================================================
// Sheet 3: 问题追踪
// ================================================================
function buildBugTrackingSheet(wb) {
  const header = ['ID', '类型', '标题', '优先级', '提出日期', '修复日期', '状态', '根因', '修复方案'];
  const rows = [
    ['B1', 'Bug', '复制后 QuickPick 不自动刷新', 'P0', '06-11', '06-11', '✅', 'setItems(fn) 不支持函数式更新', '改用 addItem(item)'],
    ['B2', 'Bug', '复制后 MainWindow 不自动刷新', 'P0', '06-11', '06-11', '✅', 'MainWindow 缺少 onNewItem 监听', '新增 onNewItem useEffect'],
    ['B3', 'Bug', '统计数据与列表对不上', 'P0', '06-11', '06-11', '✅', 'stats 独立状态与 items 不同步', '改为 useMemo 从 items 派生'],
    ['B4', 'Bug', '左侧列表无滚动条', 'P0', '06-11', '06-11', '✅', 'Ant Design Sider 内部 overflow:hidden', '替换为原生 div + minHeight:0'],
    ['B5', '优化', '置顶不应独立 Tab', 'P1', '06-11', '06-11', '✅', '设计问题', '2Tab 剪切板/收藏 + 淡红浅黄背景色'],
    ['B6', 'Bug', '主界面不显示收藏/置顶图标', 'P0', '06-11', '06-11', '✅', '图标条件渲染隐藏', '始终显示 + selected 同步更新'],
    ['B7', 'Bug', '主界面图标不可点击', 'P0', '06-11', '06-11', '✅', '缺少 onClick handler', '图标加 onClick → handleFav/handlePin'],
    ['B8', '优化', '快速入口图标太淡', 'P2', '06-11', '06-11', '✅', '颜色太浅', '#bfbfbf→#999, 13→14px'],
    ['B9', 'Bug', 'QuickPick 收藏/置顶不刷新', 'P0', '06-11', '06-12', '✅', 'AD List 拦截点击 + 乐观更新竞态', 'v2.0 原生 div + v2.3 loadItems() 全量刷新'],
    ['B10', 'Bug', '快速入口与主界面不同步', 'P0', '06-11', '06-11', '✅', '独立 BrowserWindow → 独立 Zustand store', 'clipboard:itemUpdated IPC 广播'],
    ['B11', 'Bug', 'QuickPick 无法拖拽窗口', 'P1', '06-11', '06-12', '✅', '缺少 -webkit-app-region:drag', '14px 拖拽手柄 + header CSS'],
    ['CI-01', 'CI', 'tsc --noEmit 8 errors', 'P1', '06-12', '06-12', '✅', 'ElectronAPI 接口缺失 onItemUpdated 等方法', '补全类型声明 + FontSize 扩展'],
    ['CI-02', 'CI', 'ESLint require() error', 'P1', '06-12', '06-12', '✅', 'ipc-handlers.ts 用 require(./index) 循环依赖', '改为导入 hotkey-manager 的 updateHotkey'],
    ['CI-03', 'CI', '@vitest/coverage-v8 版本不兼容', 'P2', '06-12', '06-12', '✅', 'coverage-v8@4 要求 vitest@4，项目用 vitest@2', '移除 coverage 依赖'],
    ['AUDIT-01', '审计', '托盘图标不可见', 'P0', '06-12', '', '🔴 未修复', 'tray-manager.ts 正确但未导入，index.ts 用 createEmpty()', '导入 tray-manager 或改用 createFromPath(icon.ico)'],
    ['AUDIT-02', '审计', '10 个 i18n key 定义了但未使用', 'P1', '06-12', '', '🔴 未修复', '托盘菜单/公共按钮翻译未接入组件', '托盘菜单接入 i18n'],
    ['AUDIT-03', '审计', '托盘菜单硬编码中文', 'P1', '06-12', '', '🔴 未修复', '主进程中硬编码', '主进程 tray 菜单接入 i18n'],
    ['AUDIT-04', '审计', '主窗口标题硬编码', 'P1', '06-12', '', '🔴 未修复', 'title: History Clipboard 写死', '使用 app.title i18n key'],
    ['AUDIT-05', '审计', 'PowerShell 引号嵌套问题', 'P2', '06-12', '', '🟡 待验证', '双引号嵌套可能静默失败', '重构为单引号或转义'],
    ['AUDIT-06', '审计', 'saveWindowState 死代码', 'P2', '06-12', '', '🟡 待清理', '定义了但从未调用', '清理或接入窗口状态保存'],
    ['AUDIT-07', '审计', '15 处 console.log 散布', 'P2', '06-12', '', '🟡 待清理', '信息类日志未通过 DEBUG 门控', '添加 DEBUG 环境变量检查'],
    ['AUDIT-08', '审计', 'memory 文件过时', 'P2', '06-12', '', '🟡 待清理', 'active-topics/dev-log 停留在 06-09', '更新或归档过时文件'],
  ];

  const fullData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  headerStyle(ws, 'A1:I1', 9);
  dataStyle(ws, 1, rows.length, 9);
  autoWidth(ws, header, rows);

  // 颜色：未修复=红色、待处理=黄色
  const coloredRows = rows
    .map((r, i) => {
      if (r[6] === '🔴 未修复') return [i, 'FFF1F0'];
      if (r[6].startsWith('🟡')) return [i, 'FFFBE6'];
      return null;
    })
    .filter(Boolean);
  colorRows(ws, coloredRows);

  XLSX.utils.book_append_sheet(wb, ws, '问题追踪');
}

// ================================================================
// Sheet 4: 风险管理
// ================================================================
function buildRisksSheet(wb) {
  const header = ['ID', '类别', '风险/问题', '严重度', '影响', '当前状态', '建议措施', '负责人', '截止日期'];
  const rows = [
    ['RSK-01', '功能缺陷', '托盘图标不可见', '🔴 高', '用户无法通过托盘识别应用', '未修复', '导入 tray-manager 模块', '', ''],
    ['RSK-02', '国际化', '托盘菜单未 i18n', '🟡 中', '英文环境下托盘菜单仍显示中文', '未修复', '主进程接入 i18n 字典', '', ''],
    ['RSK-03', '国际化', '主窗口标题硬编码', '🟡 中', '英文环境下窗口标题仍为中文', '未修复', '使用 app.title 翻译 key', '', ''],
    ['RSK-04', '技术债务', 'PowerShell 引号嵌套', '🟡 中', '前景应用检测可能静默失败', '未修复', '重构 PowerShell 脚本引号', '', ''],
    ['RSK-05', '技术债务', 'console.log 散布', '🟢 低', '生产构建包含调试日志', '未修复', '添加 process.env.DEBUG 检查', '', ''],
    ['RSK-06', '代码质量', 'saveWindowState 死代码', '🟢 低', 'window_state 表存在但从未使用', '未修复', '清理或实现窗口位置记忆', '', ''],
    ['RSK-07', '打包部署', '打包未经完整验证', '🟡 中', '可能无法在用户机器上正常安装', '已配置未执行', '管理员终端执行 npm run build:win', '', ''],
    ['RSK-08', '测试', '无测试覆盖率数据', '🟢 低', '无法量化测试质量', '依赖版本不兼容', '升级 vitest 或等待 coverage-v8 兼容', '', ''],
    ['RSK-09', '性能', '图片剪贴板 10MB 限制', '🟢 低', '大图片可能被跳过', '已实现', '监控上限，按需调整', '', ''],
    ['RSK-10', '依赖', 'Node.js 20 Actions 即将弃用', '🟢 低', 'GitHub Actions 将强制使用 Node.js 24', 'CI 已暂停', '恢复 CI 后更新 actions 版本', '', '2026-09-16'],
  ];

  const fullData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  headerStyle(ws, 'A1:I1', 9);
  dataStyle(ws, 1, rows.length, 9);
  autoWidth(ws, header, rows);

  const coloredRows = rows
    .map((r, i) => {
      if (r[3] === '🔴 高') return [i, 'FFF1F0'];
      if (r[3] === '🟡 中') return [i, 'FFFBE6'];
      return null;
    })
    .filter(Boolean);
  colorRows(ws, coloredRows);

  XLSX.utils.book_append_sheet(wb, ws, '风险管理');
}

// ================================================================
// Sheet 5: 版本状态
// ================================================================
function buildVersionSheet(wb) {
  const header = ['模块', '文件', '当前版本', '日期', '修订记录', '状态'];
  const rows = [
    ['主进程入口', 'src/main/index.ts', 'v1.0', '2026-06-10', '有', '✅'],
    ['数据库', 'src/main/database.ts', 'v1.0', '2026-06-10', '有', '✅'],
    ['剪贴板监控', 'src/main/clipboard-monitor.ts', 'v1.2', '2026-06-11', '有', '✅'],
    ['快捷键管理', 'src/main/hotkey-manager.ts', 'v1.1', '2026-06-12', '有', '✅'],
    ['托盘管理', 'src/main/tray-manager.ts', 'v1.0', '2026-06-09', '有', '⚠️ 未被引用'],
    ['开机自启', 'src/main/auto-launch.ts', 'v1.0', '2026-06-10', '有', '✅'],
    ['IPC 处理器', 'src/main/ipc-handlers.ts', 'v1.0', '2026-06-10', '有', '✅'],
    ['Preload 桥接', 'src/preload/index.ts', 'v1.1', '2026-06-11', '有', '✅'],
    ['共享类型', 'src/shared/types.ts', 'v1.1', '2026-06-12', '有', '✅'],
    ['类型声明', 'src/shared/electron.d.ts', 'v1.0', '2026-06-10', '无', '✅'],
    ['根组件', 'src/renderer/App.tsx', 'v1.1', '2026-06-12', '有', '✅'],
    ['渲染入口', 'src/renderer/main.tsx', 'v1.0', '2026-06-10', '有', '✅'],
    ['i18n 配置', 'src/renderer/i18n.ts', 'v1.0', '2026-06-11', '有', '✅'],
    ['QuickPick', 'src/renderer/pages/QuickPick.tsx', 'v2.4', '2026-06-12', '有', '✅'],
    ['主窗口', 'src/renderer/pages/MainWindow.tsx', 'v1.6', '2026-06-12', '有', '✅'],
    ['设置面板', 'src/renderer/pages/Settings.tsx', 'v1.3', '2026-06-12', '有', '✅'],
    ['剪贴板 Store', 'src/renderer/stores/clipboardStore.ts', 'v1.0', '2026-06-10', '有', '✅'],
    ['设置 Store', 'src/renderer/stores/settingsStore.ts', 'v1.2', '2026-06-12', '有', '✅'],
    ['架构设计', 'docs/architecture.md', 'v1.4', '2026-06-12', '有', '✅'],
    ['功能规格', 'docs/feature-spec.md', 'v2.2', '2026-06-12', '有', '✅'],
    ['界面设计', 'docs/ui-design.md', 'v2.2', '2026-06-11', '有', '✅'],
    ['执行计划', 'docs/implementation-plan.md', 'v9', '2026-06-12', '有', '✅'],
    ['问题总结', 'docs/problem-summary.md', 'v1.1', '2026-06-12', '有', '✅'],
    ['项目总览', 'docs/README.md', 'v2.0', '2026-06-12', '有', '✅'],
    ['CI 配置', '.github/workflows/ci.yml', '—', '2026-06-12', '—', '⏸️ 已暂停'],
  ];

  const fullData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);
  headerStyle(ws, 'A1:F1', 6);
  dataStyle(ws, 1, rows.length, 6);
  autoWidth(ws, header, rows);

  const coloredRows = rows
    .map((r, i) => {
      if (r[5] === '⚠️ 未被引用') return [i, 'FFFBE6'];
      return null;
    })
    .filter(Boolean);
  colorRows(ws, coloredRows);

  XLSX.utils.book_append_sheet(wb, ws, '版本状态');
}

// ================================================================
// 生成
// ================================================================
const wb = XLSX.utils.book_new();
buildRevisionSheet(wb);
buildRequirementsSheet(wb);
buildBugTrackingSheet(wb);
buildRisksSheet(wb);
buildVersionSheet(wb);

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'History-Clipboard-PM.xlsx');
XLSX.writeFile(wb, outPath);

console.log('✅ PM Excel generated:', outPath);
console.log('   Sheets: 修订记录 | 需求清单(28) | 问题追踪(22) | 风险管理(10) | 版本状态(25)');
