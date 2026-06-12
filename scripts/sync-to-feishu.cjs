/**
 * sync-to-feishu.cjs — 将项目管理数据同步到飞书多维表格
 * 用法：node scripts/sync-to-feishu.cjs
 */
const { execSync } = require('child_process');

const LARK = 'C:/Users/HE/.workbuddy/binaries/node/cli-connector-packages/lark-cli.cmd';
const B = 'Hecgb5YepaVKNCsoJOncW6a5nHc';
const T = {
  req: 'tblAY5i90pLLkqyR',
  bugs: 'tblqiZFEk0yHJH7S',
  risk: 'tblJ0BFNZoobxTK2',
  ver: 'tblM1el8oSD9LAu7',
};

function batch(tableId, fields, rows) {
  const tmp = './.feishu_tmp.json';
  require('fs').writeFileSync(tmp, JSON.stringify({ fields, rows }));
  console.log(`  Inserting ${rows.length} records...`);
  try {
    const r = execSync(
      `"${LARK}" base +record-batch-create --base-token ${B} --table-id ${tableId} --json @${tmp} --as user`,
      { encoding: 'utf-8', maxBuffer: 20*1024*1024 }
    );
    require('fs').unlinkSync(tmp);
    const p = JSON.parse(r);
    if (p.ok) { console.log(`  ✅ ${rows.length} inserted`); return true; }
    console.error(`  ❌ ${JSON.stringify(p.error).substring(0,300)}`);
  } catch(e) { require('fs').unlinkSync(tmp); console.error(`  ❌ ${e.message.substring(0,200)}`); }
  return false;
}

// Data (same as before — kept in sync script for self-containment)
const FB = ['ID','类型','标题','优先级','提出日期','修复日期','状态','根因','修复方案'];
const bugs = [
  ['B1','Bug','复制后 QuickPick 不自动刷新','P0','06-11','06-11','✅ 已修复','setItems不支持函数式更新','改用 addItem'],
  ['B2','Bug','复制后 MainWindow 不自动刷新','P0','06-11','06-11','✅ 已修复','缺少 onNewItem 监听','新增 useEffect'],
  ['B3','Bug','统计数据与列表对不上','P0','06-11','06-11','✅ 已修复','stats 独立状态不同步','useMemo 从 items 派生'],
  ['B4','Bug','左侧列表无滚动条','P0','06-11','06-11','✅ 已修复','AD Sider overflow:hidden','替换为原生 div'],
  ['B5','优化','置顶不应独立 Tab','P1','06-11','06-11','✅ 已修复','设计问题','2Tab+背景色区分'],
  ['B6','Bug','主界面不显示收藏/置顶图标','P0','06-11','06-11','✅ 已修复','图标条件渲染隐藏','始终显示图标'],
  ['B7','Bug','主界面图标不可点击','P0','06-11','06-11','✅ 已修复','缺少 onClick','图标加 onClick'],
  ['B8','优化','快速入口图标太淡','P2','06-11','06-11','✅ 已修复','颜色太浅','#bfbfbf->#999'],
  ['B9','Bug','QuickPick收藏/置顶不刷新','P0','06-11','06-12','✅ 已修复','AD List拦截+竞态','v2.0原生div+v2.3 loadItems()'],
  ['B10','Bug','快速入口与主界面不同步','P0','06-11','06-11','✅ 已修复','独立Zustand store','IPC广播clipboard:itemUpdated'],
  ['B11','Bug','QuickPick无法拖拽窗口','P1','06-11','06-12','✅ 已修复','缺少drag CSS','14px拖拽手柄'],
  ['CI-01','CI','tsc --noEmit 8 errors','P1','06-12','06-12','✅ 已修复','ElectronAPI接口缺失','补全类型声明'],
  ['CI-02','CI','ESLint require() error','P1','06-12','06-12','✅ 已修复','循环依赖','导入hotkey-manager'],
  ['CI-03','CI','coverage-v8版本不兼容','P2','06-12','06-12','✅ 已修复','v4要求vitest v4','移除coverage'],
  ['AUDIT-01','审计','托盘图标不可见','P0','06-12','','🔴 未修复','tray-manager.ts未导入','导入tray-manager'],
  ['AUDIT-02','审计','10个i18n key未使用','P1','06-12','','🔴 未修复','托盘菜单未接入','接入i18n'],
  ['AUDIT-03','审计','托盘菜单硬编码中文','P1','06-12','','🔴 未修复','主进程硬编码','主进程接入i18n'],
  ['AUDIT-04','审计','主窗口标题硬编码','P1','06-12','','🔴 未修复','title写死','使用app.title key'],
  ['AUDIT-05','审计','PowerShell引号嵌套','P2','06-12','','🟡 待处理','双引号嵌套','重构引号'],
  ['AUDIT-06','审计','saveWindowState死代码','P2','06-12','','🟡 待处理','定义了未调用','清理或接入'],
  ['AUDIT-07','审计','15处console.log散布','P2','06-12','','🟡 待处理','未通过DEBUG门控','添加环境变量检查'],
  ['AUDIT-08','审计','memory文件过时','P2','06-12','','🟡 待处理','停留在06-09','更新或归档'],
];

const FR = ['模块','功能','描述','优先级','状态','实现文件','备注'];
const req = [
  ['剪贴板监控','剪贴板轮询','300ms定时轮询系统剪贴板','P0','✅ 已完成','clipboard-monitor.ts','SHA256哈希去重'],
  ['剪贴板监控','前景应用检测','异步PowerShell获取前台窗口标题','P0','✅ 已完成','clipboard-monitor.ts','2s缓存'],
  ['数据库','SQLite存储','WAL模式自动建表迁移','P0','✅ 已完成','database.ts','3表'],
  ['数据库','CRUD操作','插入/查询/更新/删除','P0','✅ 已完成','database.ts',''],
  ['数据库','智能清理','自动清理非收藏非置顶记录','P0','✅ 已完成','database.ts','每小时一次'],
  ['收藏/置顶','toggle切换','状态切换DB持久化','P0','✅ 已完成','database.ts','CASE WHEN'],
  ['QuickPick','浮窗唤起','Ctrl+Shift+V全局快捷键','P0','✅ 已完成','index.ts','可自定义快捷键'],
  ['QuickPick','列表渲染','原生div+CSS line-clamp','P0','✅ 已完成','QuickPick.tsx v2.4','弃用AD List'],
  ['QuickPick','搜索过滤','实时搜索过滤剪贴板记录','P0','✅ 已完成','QuickPick.tsx',''],
  ['QuickPick','键盘导航','上下选择/Enter粘贴/Esc关闭','P0','✅ 已完成','QuickPick.tsx',''],
  ['QuickPick','收藏/置顶操作','点击星标图钉','P0','✅ 已完成','QuickPick.tsx','B9 v2.3 loadItems修复'],
  ['QuickPick','窗口拖拽','14px拖拽手柄','P0','✅ 已完成','global.css','B11已修复'],
  ['主窗口','2Tab布局','剪切板+收藏Tab','P0','✅ 已完成','MainWindow.tsx v1.6','CSS类化完成'],
  ['主窗口','详情面板','选中条目显示完整内容','P0','✅ 已完成','MainWindow.tsx',''],
  ['主窗口','搜索清空','搜索过滤+清空操作','P0','✅ 已完成','MainWindow.tsx',''],
  ['设置面板','外观设置','主题/强调色/字号/语言','P0','✅ 已完成','Settings.tsx v1.3',''],
  ['设置面板','数据设置','保留天数/最大记录/开机自启','P0','✅ 已完成','Settings.tsx',''],
  ['设置面板','快捷键自定义','录制按键动态更新','P2','✅ 已完成','Settings.tsx','P9已完成'],
  ['系统托盘','托盘图标+菜单','系统托盘','P0','✅ 已完成','index.ts','审计C1:图标不可见'],
  ['开机自启','Windows注册表','可配置开机自启','P0','✅ 已完成','auto-launch.ts',''],
  ['跨窗口同步','IPC广播','clipboard:itemUpdated','P0','✅ 已完成','ipc-handlers.ts',''],
  ['国际化','i18n中英切换','全部组件覆盖','P1','✅ 已完成','i18n.ts+locales/','审计C2/C3:托盘未i18n'],
  ['暗色主题','亮/暗双主题','data-theme+Ant Design','P1','✅ 已完成','global.css+App.tsx',''],
  ['应用图标','多尺寸ICO','generate-icon.cjs','P1','✅ 已完成','resources/icon.ico',''],
  ['打包','NSIS安装包','electron-builder','P1','✅ 已完成','package.json','npm run build:win'],
  ['测试','单元测试','133 tests 4 files','P1','✅ 已完成','tests/unit/',''],
  ['测试','E2E集成测试','24 tests','P2','✅ 已完成','tests/e2e/',''],
  ['CI/CD','本地预检','pre-push hook','P2','✅ 已完成','.git/hooks/pre-push','GitHub Actions已暂停'],
];

const FK = ['ID','类别','风险问题','严重度','影响','当前状态','建议措施'];
const risk = [
  ['RSK-01','功能缺陷','托盘图标不可见','🔴 高','用户无法识别应用','未修复','导入tray-manager模块'],
  ['RSK-02','国际化','托盘菜单未i18n','🟡 中','英文菜单显示中文','未修复','主进程接入i18n'],
  ['RSK-03','国际化','主窗口标题硬编码','🟡 中','英文标题仍为中文','未修复','使用app.title key'],
  ['RSK-04','技术债务','PowerShell引号嵌套','🟡 中','检测可能静默失败','未修复','重构引号'],
  ['RSK-05','技术债务','console.log散布','🟢 低','生产含调试日志','未修复','添加DEBUG检查'],
  ['RSK-06','代码质量','saveWindowState死代码','🟢 低','表从未使用','未修复','清理或实现'],
  ['RSK-07','打包部署','打包未经验证','🟡 中','可能无法安装','已配置未执行','管理员终端build:win'],
  ['RSK-08','测试','无测试覆盖率','🟢 低','无法量化质量','版本不兼容','升级vitest'],
  ['RSK-09','性能','图片10MB限制','🟢 低','大图片被跳过','已实现','按需调整'],
  ['RSK-10','依赖','Node20Actions弃用','🟢 低','Actions将强制Node24','CI已暂停','恢复CI后更新'],
];

const FV = ['模块','文件','当前版本','日期','修订记录','状态'];
const ver = [
  ['主进程入口','index.ts','v1.0','06-10','有','✅'],
  ['数据库','database.ts','v1.0','06-10','有','✅'],
  ['剪贴板监控','clipboard-monitor.ts','v1.2','06-11','有','✅'],
  ['快捷键管理','hotkey-manager.ts','v1.1','06-12','有','✅'],
  ['托盘管理','tray-manager.ts','v1.0','06-09','有','⚠未引用'],
  ['开机自启','auto-launch.ts','v1.0','06-10','有','✅'],
  ['IPC处理器','ipc-handlers.ts','v1.0','06-10','有','✅'],
  ['Preload桥接','preload/index.ts','v1.1','06-11','有','✅'],
  ['共享类型','shared/types.ts','v1.1','06-12','有','✅'],
  ['类型声明','electron.d.ts','v1.0','06-10','无','✅'],
  ['根组件','App.tsx','v1.1','06-12','有','✅'],
  ['渲染入口','main.tsx','v1.0','06-10','有','✅'],
  ['i18n配置','i18n.ts','v1.0','06-11','有','✅'],
  ['QuickPick','QuickPick.tsx','v2.4','06-12','有','✅'],
  ['主窗口','MainWindow.tsx','v1.6','06-12','有','✅'],
  ['设置面板','Settings.tsx','v1.3','06-12','有','✅'],
  ['剪贴板Store','clipboardStore.ts','v1.0','06-10','有','✅'],
  ['设置Store','settingsStore.ts','v1.2','06-12','有','✅'],
  ['架构设计','architecture.md','v1.4','06-12','有','✅'],
  ['功能规格','feature-spec.md','v2.2','06-12','有','✅'],
  ['界面设计','ui-design.md','v2.2','06-11','有','✅'],
  ['执行计划','implementation-plan.md','v9','06-12','有','✅'],
  ['问题总结','problem-summary.md','v1.1','06-12','有','✅'],
  ['项目总览','README.md','v2.0','06-12','有','✅'],
  ['CI配置','ci.yml','—','06-12','—','⏸已暂停'],
];

console.log('Syncing to Feishu...');
console.log('[1/4] Bugs');    batch(T.bugs, FB, bugs);
console.log('[2/4] Risks');   batch(T.risk, FK, risk);
console.log('[3/4] Reqs');    batch(T.req, FR, req);
console.log('[4/4] Versions');batch(T.ver, FV, ver);
console.log(`\nDone! https://pqxx1rtix0q.feishu.cn/base/${B}`);
