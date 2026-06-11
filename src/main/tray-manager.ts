/**
 * History Clipboard — 托盘管理模块
 * @version 1.0
 * @date 2026-06-09
 * @description 系统托盘图标、右键菜单、事件处理
 *
 * 修订记录：
 *   v1.0  2026-06-09  WorkBuddy  初始版本
 */

import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

/**
 * 创建系统托盘
 */
export function createTray(
  mainWindow: BrowserWindow,
  quickPickWindow: BrowserWindow,
): void {
  // 托盘图标（16x16 像素适配任务栏，使用 icon.ico）
  const iconPath = path.join(__dirname, '../../resources/icon.ico');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  tray.setToolTip('History Clipboard');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: '快速粘贴 (Ctrl+Shift+V)',
      click: () => {
        quickPickWindow.show();
        quickPickWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('navigate', '/settings');
      },
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('navigate', '/about');
      },
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 左键点击托盘图标 → 弹出浮窗
  tray.on('click', () => {
    quickPickWindow.show();
    quickPickWindow.focus();
  });
}

/**
 * 销毁系统托盘
 */
export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
