/**
 * History Clipboard — Electron 主进程入口
 * @version 1.1
 * @date 2026-06-13
 * @description 应用生命周期管理，创建窗口、注册模块
 *
 * 修订记录：
 *   v1.1  2026-06-13  WorkBuddy  修复托盘图标加载 icon.ico + 托盘菜单/窗口标题 i18n
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getSetting } from './database';
import { startClipboardMonitor, stopClipboardMonitor } from './clipboard-monitor';
import { registerIpcHandlers } from './ipc-handlers';
import { registerHotkeys, unregisterHotkeys, updateHotkey } from './hotkey-manager';

// ==================== 全局引用 ====================
let mainWindow: BrowserWindow | null = null;
let quickPickWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ==================== i18n 主进程翻译 ====================
// 主进程无法使用 react-i18next，直接从 JSON 文件加载翻译

let localeData: Record<string, string> = {};

function loadLocale(lang: string): void {
  try {
    const localePath = path.join(__dirname, '../renderer/locales', `${lang}.json`);
    if (fs.existsSync(localePath)) {
      const raw = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
      // 扁平化嵌套 key：{ tray: { show: 'X' } } → { 'tray.show': 'X' }
      localeData = flattenKeys(raw);
      return;
    }
  } catch (e) {
    console.warn('[i18n] Failed to load locale:', lang, e);
  }
  // 回退到硬编码中文
  localeData = {};
}

function t(key: string): string {
  return localeData[key] || key;
}

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      result[fullKey] = v;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(result, flattenKeys(v as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

// 确保单实例
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ==================== 窗口创建 ====================

function createMainWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(680, Math.round(sw * 0.7)),
    height: Math.min(500, Math.round(sh * 0.72)),
    minWidth: 500,
    minHeight: 380,
    title: t('app.title') || 'History Clipboard',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

function createQuickPickWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(340, Math.round(sw * 0.18)),
    height: Math.min(420, Math.round(sh * 0.4)),
    minWidth: 280,
    minHeight: 280,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    win.loadURL('http://localhost:5173/#/quickpick');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: '/quickpick' });
  }

  win.on('blur', () => {
    win.hide();
  });

  return win;
}

// ==================== 托盘 ====================

function createTray(): void {
  // 加载真实图标，失败则回退空图标
  const iconPath = path.join(__dirname, '../../resources/icon.ico');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    if (icon.isEmpty()) throw new Error('Icon loaded but empty');
  } catch {
    console.warn('[Tray] Failed to load icon.ico, using empty icon');
    icon = nativeImage.createEmpty();
  }
  tray = new Tray(icon);

  // 加载 i18n 翻译
  const lang = getSetting('language') || 'zh';
  loadLocale(lang);

  tray.setToolTip(t('app.title'));

  const menu = Menu.buildFromTemplate([
    {
      label: t('tray.show'),
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: t('tray.quick'),
      click: () => toggleQuickPick(),
    },
    { type: 'separator' },
    {
      label: t('tray.quit'),
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => toggleQuickPick());
}

// ==================== 快捷键 ====================

/** 从 DB 读取快捷鍵并注册（首次启动），默认 Ctrl+Shift+V */
function initHotkey(): void {
  const saved = getSetting('hotkey') || 'Ctrl+Shift+V';
  if (quickPickWindow) {
    registerHotkeys(quickPickWindow, saved);
  }
}

/** 运行时更新快捷键（用户在设置中修改后调用） */
export function applyHotkeyChange(oldKey: string, newKey: string): boolean {
  if (!quickPickWindow) return false;
  return updateHotkey(oldKey, newKey, quickPickWindow);
}

function toggleQuickPick(): void {
  if (!quickPickWindow) return;
  if (quickPickWindow.isVisible()) {
    quickPickWindow.hide();
  } else {
    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    const { x, y, width, height } = display.workArea;
    const [ww, wh] = quickPickWindow.getSize();
    quickPickWindow.setPosition(
      Math.round(x + (width - ww) / 2),
      Math.round(y + (height - wh) / 3),
    );
    quickPickWindow.show();
    quickPickWindow.focus();
    quickPickWindow.webContents.send('quickpick:opened');
  }
}

// ==================== 生命周期 ====================

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  initDatabase();
  // 加载 i18n 翻译（必须在创建窗口/托盘前）
  const lang = getSetting('language') || 'zh';
  loadLocale(lang);
  registerIpcHandlers();
  mainWindow = createMainWindow();
  quickPickWindow = createQuickPickWindow();
  createTray();
  initHotkey();
  startClipboardMonitor();

  import('./auto-launch').then((m) => m.initAutoLaunch());
});

app.on('before-quit', () => {
  isQuitting = true;
  stopClipboardMonitor();
  globalShortcut.unregisterAll();
  tray?.destroy();
  closeDatabase();
});

app.on('window-all-closed', () => {
  // Windows: 不退出，保持托盘运行
});
