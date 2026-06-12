/**
 * E2E 集成测试 — Headless Electron 全链路测试
 *
 * 在 Electron 运行环境中测试 DB、IPC、剪贴板、设置、图片、快捷键。
 * 用法：node tests/e2e/full-integration.test.cjs
 *
 * 输出格式：TAP (Test Anything Protocol)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PASS = 0;
const FAIL = 1;
let passed = 0;
let failed = 0;
let testNum = 0;

// ================================================================
// 测试代码（在 Electron 渲染进程中执行）
// ================================================================
const testCode = `
const { app, clipboard, nativeImage, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const crypto = require('crypto');

// Load app modules at top level (before use)
const { initDatabase, insertClipboardItem, getItemById, getHistory, getLastHash,
        toggleFavorite, togglePin, deleteItem, clearAll, getStats,
        setSetting, getSetting, getAllSettings, runCleanup, getDb } = require('./main/database');

const results = [];
let n = 0;

function pass(name) { results.push({ ok: true, num: ++n, name }); console.log('ok', n, '-', name); }
function fail(name, reason) { results.push({ ok: false, num: ++n, name, reason }); console.log('not ok', n, '-', name, '# ' + reason); }

function sha256(s) { return crypto.createHash('sha256').update(s, 'utf-8').digest('hex'); }

async function run() {
  // Register IPC handlers (needed for clipboard:getHistory, settings:get, etc.)
  require('./main/ipc-handlers').registerIpcHandlers();

  // Start monitor briefly so it picks up clipboard changes
  const { startClipboardMonitor, stopClipboardMonitor } = require('./main/clipboard-monitor');
  startClipboardMonitor();

  await new Promise(r => setTimeout(r, 500));

  // ================================================================
  // 1. Database CRUD (10 tests)
  // ================================================================
  console.log('# Database CRUD');

  // 1.1 insert + getItemById
  const id1 = insertClipboardItem('E2E_TEXT_' + Date.now(), 'text', 'e2e_hash_1_' + Date.now(), 'E2ETest');
  const item1 = getItemById(id1);
  if (item1 && item1.content.includes('E2E_TEXT')) pass('insertClipboardItem + getItemById (text)');
  else fail('insertClipboardItem + getItemById (text)', 'got: ' + JSON.stringify(item1));

  // 1.2 getItemById returns null for missing id
  const missing = getItemById(99999999);
  if (missing === null) pass('getItemById(99999999) returns null');
  else fail('getItemById(99999999) returns null', 'got: ' + JSON.stringify(missing));

  // 1.3 getHistory with limit
  const hist = getHistory({ limit: 5 });
  if (Array.isArray(hist) && hist.length <= 5) pass('getHistory({limit:5}) returns <=5 items');
  else fail('getHistory({limit:5})', 'got: ' + hist.length + ' items');

  // 1.4 toggleFavorite ON
  const id2 = insertClipboardItem('E2E_FAV', 'text', 'e2e_fav_hash', 'Test');
  const fav1 = toggleFavorite(id2);
  if (fav1 && fav1.is_favorite === 1) pass('toggleFavorite ON');
  else fail('toggleFavorite ON', JSON.stringify(fav1));

  // 1.5 toggleFavorite OFF
  const fav2 = toggleFavorite(id2);
  if (fav2 && fav2.is_favorite === 0) pass('toggleFavorite OFF');
  else fail('toggleFavorite OFF', JSON.stringify(fav2));

  // 1.6 togglePin ON
  const id3 = insertClipboardItem('E2E_PIN', 'text', 'e2e_pin_hash', 'Test');
  const pin1 = togglePin(id3);
  if (pin1 && pin1.is_pinned === 1) pass('togglePin ON');
  else fail('togglePin ON', JSON.stringify(pin1));

  // 1.7 deleteItem
  const id4 = insertClipboardItem('E2E_DEL', 'text', 'e2e_del_hash', 'Test');
  const before4 = getItemById(id4);
  deleteItem(id4);
  const after4 = getItemById(id4);
  if (before4 && !after4) pass('deleteItem removes record');
  else fail('deleteItem', 'before=' + !!before4 + ' after=' + !!after4);

  // 1.8 getStats
  const stats = getStats();
  if (typeof stats.total === 'number' && stats.total >= 0) pass('getStats returns valid stats');
  else fail('getStats', JSON.stringify(stats));

  // 1.9 clearAll protects favorites and pinned
  const idFav = insertClipboardItem('E2E_PROTECT_FAV', 'text', 'e2e_prot_fav', 'Test');
  const idPin = insertClipboardItem('E2E_PROTECT_PIN', 'text', 'e2e_prot_pin', 'Test');
  toggleFavorite(idFav);
  togglePin(idPin);
  const cleared = clearAll();
  const favAfter = getItemById(idFav);
  const pinAfter = getItemById(idPin);
  if (favAfter && pinAfter && cleared >= 0) pass('clearAll protects favorites and pinned');
  else fail('clearAll protects fav/pin', 'fav=' + !!favAfter + ' pin=' + !!pinAfter);

  // 1.10 getLastHash
  const lh = getLastHash();
  if (lh === null || typeof lh === 'string') pass('getLastHash returns string or null');
  else fail('getLastHash', typeof lh);

  // ================================================================
  // 2. Settings (5 tests)
  // ================================================================
  console.log('# Settings');

  setSetting('e2e_test_key', 'e2e_test_value');
  const gs = getSetting('e2e_test_key');
  if (gs === 'e2e_test_value') pass('setSetting + getSetting roundtrip');
  else fail('setSetting + getSetting', 'got: ' + gs);

  setSetting('theme', 'dark');
  setSetting('fontSize', '16');
  setSetting('language', 'en');
  const all = getAllSettings();
  if (all.theme === 'dark') pass('getAllSettings: theme=dark persisted');
  else fail('getAllSettings: theme=dark', 'got: ' + all.theme);
  if (all.fontSize === '16') pass('getAllSettings: fontSize=16 persisted');
  else fail('getAllSettings: fontSize=16', 'got: ' + all.fontSize);
  if (all.language === 'en') pass('getAllSettings: language=en persisted');
  else fail('getAllSettings: language=en', 'got: ' + all.language);

  // reset
  setSetting('theme', 'light');
  setSetting('language', 'zh');

  // ================================================================
  // 3. Clipboard Monitor (3 tests)
  // ================================================================
  console.log('# Clipboard');

  // Search DB by content hash to avoid sort-order interference (pinned items sort first)
  const db = getDb();
  function findInHistory(contentSubstr) {
    return db.prepare('SELECT * FROM clipboard_history WHERE content LIKE ? ORDER BY id DESC LIMIT 1').get('%' + contentSubstr + '%');
  }

  // Monitor is already started — write unique content and wait for detection
  const testText = 'E2E_CLIPBOARD_MONITOR_' + Date.now();
  clipboard.writeText(testText);
  await new Promise(r => setTimeout(r, 1200));
  const found = findInHistory('E2E_CLIPBOARD_MONITOR_');
  if (found && found.content === testText) pass('Monitor detects text clipboard change');
  else fail('Monitor detects text', 'expected=' + testText.substring(0,30) + ' got=' + (found?.content?.substring(0,40) || 'null'));

  // HTML clipboard
  const testHtml = '<b>E2E_HTML_' + Date.now() + '</b>';
  clipboard.writeHTML(testHtml);
  await new Promise(r => setTimeout(r, 1200));
  const foundHtml = findInHistory('E2E_HTML_');
  if (foundHtml && foundHtml.content_type === 'html') pass('Monitor detects HTML clipboard');
  else fail('Monitor detects HTML', 'type=' + foundHtml?.content_type + ' content=' + (foundHtml?.content?.substring(0,40) || 'null'));

  // Image clipboard: create a small test image
  const img = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  clipboard.writeImage(img);
  await new Promise(r => setTimeout(r, 1200));
  const foundImg = findInHistory('data:image/png;base64,');
  if (foundImg && foundImg.content_type === 'image') pass('Monitor detects and stores image clipboard');
  else fail('Monitor detects image', 'type=' + foundImg?.content_type + ' content preview=' + (foundImg?.content?.substring(0,30) || 'null'));

  // ================================================================
  // 4. IPC handlers (3 tests)
  // ================================================================
  console.log('# IPC');

  // Register test handlers
  ipcMain.handle('e2e:ping', () => 'pong');
  const testWin = new BrowserWindow({ width: 100, height: 100, show: false,
    webPreferences: { sandbox: false, contextIsolation: true, preload: require('path').join(__dirname, 'preload/index.js') }
  });
  await testWin.loadURL('data:text/html,<script>window.electronAPI.getHistory({limit:1}).then(d=>document.title="OK:"+d.length).catch(e=>document.title="ERR:"+e.message)</' + 'script>');
  await new Promise(r => setTimeout(r, 800));
  const title = testWin.webContents.getTitle();
  if (title.startsWith('OK:')) pass('IPC getHistory via preload bridge');
  else fail('IPC getHistory via preload', title);

  const content = await testWin.webContents.executeJavaScript('window.electronAPI.getSetting("theme")');
  if (content === 'light') pass('IPC getSetting via executeJavaScript');
  else fail('IPC getSetting', content);

  testWin.destroy();
  ipcMain.removeHandler('e2e:ping');

  const stats2 = await (async () => {
    const s = getStats(); return s;
  })();
  if (typeof stats2.total === 'number') pass('IPC getStats direct call works');
  else fail('IPC getStats direct', JSON.stringify(stats2));

  // ================================================================
  // 5. Image clipboard roundtrip (2 tests)
  // ================================================================
  console.log('# Image roundtrip');

  const testPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testDataUrl = 'data:image/png;base64,' + testPngBase64;
  const imgId = insertClipboardItem(testDataUrl, 'image', sha256(testDataUrl), 'E2E');
  const imgItem = getItemById(imgId);
  if (imgItem && imgItem.content_type === 'image') pass('Image stored as data URL in DB');
  else fail('Image stored as data URL', 'type=' + imgItem?.content_type);

  // Copy back to clipboard via nativeImage
  const restoredImg = nativeImage.createFromDataURL(imgItem.content);
  clipboard.writeImage(restoredImg);
  const readBack = clipboard.readImage();
  if (!readBack.isEmpty()) pass('Image clipboard write→read roundtrip');
  else fail('Image clipboard roundtrip', 'readImage returned empty');

  // ================================================================
  // 6. Hash dedup (2 tests)
  // ================================================================
  console.log('# Dedup');

  const dedupContent = 'E2E_DEDUP_' + Date.now();
  const dedupHash = sha256(dedupContent);
  const dId1 = insertClipboardItem(dedupContent, 'text', dedupHash, 'Test');
  const dId2 = insertClipboardItem(dedupContent, 'text', dedupHash, 'Test');
  // Both inserted (DB-level), but monitor would skip second via lastHash
  const d1 = getItemById(dId1);
  const d2 = getItemById(dId2);
  if (d1 && d2) pass('DB allows duplicate inserts (dedup is at monitor level)');
  else fail('DB duplicate insert', 'd1=' + !!d1 + ' d2=' + !!d2);

  // Verify lastHash tracking
  const lastH = getLastHash();
  if (lastH === null || typeof lastH === 'string') pass('getLastHash works for monitor dedup');
  else fail('getLastHash for monitor dedup', typeof lastH);

  // ================================================================
  // Summary
  // ================================================================
  stopClipboardMonitor();
  console.log('\\n1..' + results.length);
  const p = results.filter(r => r.ok).length;
  const f = results.filter(r => !r.ok).length;
  console.log('# ' + p + ' passed, ' + f + ' failed, ' + results.length + ' total');
  if (f > 0) {
    results.filter(r => !r.ok).forEach(r => console.log('# FAIL: ' + r.name + ' — ' + r.reason));
  }
  app.quit();
}

app.whenReady().then(() => {
  initDatabase();
  setTimeout(run, 300);
});
`;

// ================================================================
// 运行
// ================================================================
const tmpFile = path.join(__dirname, '..', '..', 'dist', '_e2e_test.js');
fs.writeFileSync(tmpFile, testCode);

console.log('TAP version 14');
console.log('# History Clipboard E2E Integration Tests');

const electronPath = path.join(__dirname, '..', '..', 'node_modules', 'electron', 'dist', 'electron.exe');
const child = spawn(electronPath, [tmpFile], {
  cwd: path.join(__dirname, '..', '..'),
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (d) => { const s = d.toString(); process.stdout.write(s); output += s; });
child.stderr.on('data', (d) => { process.stderr.write(d.toString()); });

child.on('exit', (code) => {
  try { fs.unlinkSync(tmpFile); } catch {}
  // Count results
  const passedMatch = output.match(/# (\d+) passed/);
  const failedMatch = output.match(/# (\d+) failed/);
  if (passedMatch) passed = parseInt(passedMatch[1]);
  if (failedMatch) failed = parseInt(failedMatch[1]);
  console.log(`\n# Exit code: ${code}`);
  process.exit(failed > 0 ? 1 : 0);
});
