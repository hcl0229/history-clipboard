/**
 * History Clipboard — Electron 主进程入口
 * @version 1.0
 * @date 2026-06-10
 * @description 应用生命周期管理，创建窗口、注册模块
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, screen } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './database';
import { startClipboardMonitor, stopClipboardMonitor } from './clipboard-monitor';
import { registerIpcHandlers } from './ipc-handlers';

// ==================== 全局引用 ====================
let mainWindow: BrowserWindow | null = null;
let quickPickWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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
    title: 'History Clipboard',
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
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('History Clipboard — Ctrl+Shift+V');

  const menu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: '快速粘贴 (Ctrl+Shift+V)',
      click: () => toggleQuickPick(),
    },
    { type: 'separator' },
    {
      label: '退出',
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

function registerHotkey(): void {
  const ok = globalShortcut.register('Ctrl+Shift+V', () => {
    toggleQuickPick();
  });
  if (!ok) {
    console.warn('[Hotkey] Ctrl+Shift+V registration failed');
  }
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
  registerIpcHandlers();
  mainWindow = createMainWindow();
  quickPickWindow = createQuickPickWindow();
  createTray();
  registerHotkey();
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
