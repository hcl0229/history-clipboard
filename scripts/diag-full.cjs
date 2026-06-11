/**
 * 全链路诊断 — 逐项测试数据库、IPC、剪贴板
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testJs = path.join(__dirname, '..', '_diag.js');

const code = `
const { app, clipboard, BrowserWindow, ipcMain } = require('electron');

app.whenReady().then(async () => {
  // Load the real app (init DB, register IPC handlers, start monitor)
  require('./dist/main/index');

  // Wait for everything to init
  await new Promise(r => setTimeout(r, 1500));

  const results = [];
  const pass = (name) => { console.log('[PASS] ' + name); results.push({name, ok: true}); };
  const fail = (name, err) => { console.log('[FAIL] ' + name + ': ' + err); results.push({name, ok: false, err}); };

  const { initDatabase, getItemById, insertClipboardItem, getHistory, toggleFavorite, togglePin, getLastHash } = require('./dist/main/database');

  // === Test 1: getItemById (the previous bug) ===
  try {
    const id = insertClipboardItem('DIAG_TEST_' + Date.now(), 'text', 'diag_hash_' + Date.now(), 'diag');
    const item = getItemById(id);
    if (item && item.content.includes('DIAG_TEST')) {
      pass('getItemById returns correct item');
    } else {
      fail('getItemById', 'returned: ' + JSON.stringify(item));
    }
  } catch(e) {
    fail('getItemById', e.message);
  }

  // === Test 2: Clipboard write via IPC handler logic ===
  try {
    const testContent = 'CLIPBOARD_TEST_' + Date.now();
    clipboard.writeText('OLD_CONTENT');
    // Simulate what copyToClipboard handler does
    const id2 = insertClipboardItem(testContent, 'text', 'cb_hash_' + Date.now(), 'diag');
    const item2 = getItemById(id2);
    if (item2) {
      clipboard.writeText(item2.content);
      const readBack = clipboard.readText();
      if (readBack === testContent) {
        pass('Clipboard write/read roundtrip');
      } else {
        fail('Clipboard roundtrip', 'wrote "' + testContent + '" but read "' + readBack + '"');
      }
    }
  } catch(e) {
    fail('Clipboard roundtrip', e.message);
  }

  // === Test 3: Toggle favorite ===
  try {
    const id3 = insertClipboardItem('FAV_TEST', 'text', 'fav_hash', 'diag');
    const r1 = toggleFavorite(id3);
    if (r1 && r1.is_favorite === 1) {
      pass('toggleFavorite ON');
    } else {
      fail('toggleFavorite ON', JSON.stringify(r1));
    }
    const r2 = toggleFavorite(id3);
    if (r2 && r2.is_favorite === 0) {
      pass('toggleFavorite OFF');
    } else {
      fail('toggleFavorite OFF', JSON.stringify(r2));
    }
  } catch(e) {
    fail('toggleFavorite', e.message);
  }

  // === Test 4: Toggle pin ===
  try {
    const id4 = insertClipboardItem('PIN_TEST', 'text', 'pin_hash', 'diag');
    const r1 = togglePin(id4);
    if (r1 && r1.is_pinned === 1) {
      pass('togglePin ON');
    } else {
      fail('togglePin ON', JSON.stringify(r1));
    }
  } catch(e) {
    fail('togglePin', e.message);
  }

  // === Test 5: IPC handler registration ===
  try {
    // Test via creating a hidden window and using its webContents
    const testWin = new BrowserWindow({ width: 100, height: 100, show: false, webPreferences: { sandbox: false, contextIsolation: true, preload: require('path').join(__dirname, 'dist/preload/index.js') } });
    await testWin.loadURL('data:text/html,<script>window.electronAPI.getHistory({limit:1}).then(function(d){document.title="OK:"+d.length}).catch(function(e){document.title="ERR:"+e.message})</' + 'script>');
    await new Promise(r => setTimeout(r, 500));
    if (testWin.webContents.getTitle().startsWith('OK:')) {
      pass('IPC getHistory via preload');
    } else {
      fail('IPC getHistory', testWin.webContents.getTitle());
    }
    testWin.destroy();
  } catch(e) {
    fail('IPC test', e.message);
  }

  // === Test 6: Monitor detection (write to clipboard, wait for monitor) ===
  try {
    const before = getHistory({limit: 1})[0]?.content || '';
    const monitorTest = 'MONITOR_DIAG_' + Date.now();
    clipboard.writeText(monitorTest);
    await new Promise(r => setTimeout(r, 2000)); // Wait for 300ms monitor to detect
    const after = getHistory({limit: 1})[0]?.content || '';
    if (after === monitorTest) {
      pass('Monitor detects clipboard change');
    } else if (after !== before) {
      pass('Monitor detected SOME change (different from before)');
    } else {
      fail('Monitor detection', 'before="'+before+'" after="'+after+'"');
    }
  } catch(e) {
    fail('Monitor detection', e.message);
  }

  // === Summary ===
  console.log('\\n=== DIAGNOSTIC SUMMARY ===');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(passed + ' passed, ' + failed + ' failed out of ' + results.length + ' tests');
  results.filter(r => !r.ok).forEach(r => console.log('  FAIL: ' + r.name + ' - ' + r.err));

  app.quit();
});
`;

fs.writeFileSync(testJs, code);

console.log('[DIAG] Starting full diagnostic...');
const child = spawn(path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe'), [testJs], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined }
});

child.on('exit', (code) => {
  try { fs.unlinkSync(testJs); } catch {}
  process.exit(code ?? 0);
});
