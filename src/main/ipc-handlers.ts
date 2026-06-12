/**
 * History Clipboard — IPC 处理器
 * @version 1.0
 * @date 2026-06-10
 * @description 注册所有 IPC handle，桥接渲染进程与数据库/系统操作
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { ipcMain, clipboard, nativeImage, BrowserWindow } from 'electron';
import {
  getHistory,
  searchHistory,
  getItemById,
  toggleFavorite,
  togglePin,
  deleteItem,
  deleteMultiple,
  clearAll,
  getStats,
  getSetting,
  getAllSettings,
  setSetting,
  getDb,
} from './database';
import { enableAutoLaunch, disableAutoLaunch, isAutoLaunchEnabled } from './auto-launch';
import { broadcast } from './clipboard-monitor';

export function registerIpcHandlers(): void {
  // ==================== 剪贴板 ====================

  ipcMain.handle('clipboard:getHistory', (_e, params?: {
    limit?: number; offset?: number; type?: string; favorite?: boolean; pinned?: boolean;
  }) => {
    return getHistory(params ?? {});
  });

  ipcMain.handle('clipboard:search', (_e, params: { query: string }) => {
    return searchHistory(params.query);
  });

  ipcMain.handle('clipboard:getById', (_e, params: { id: number }) => {
    return getItemById(params.id);
  });

  ipcMain.handle('clipboard:toggleFavorite', (_e, params: { id: number }) => {
    const result = toggleFavorite(params.id);
    if (result) broadcast(result, 'clipboard:itemUpdated');
    return result;
  });

  ipcMain.handle('clipboard:togglePin', (_e, params: { id: number }) => {
    const result = togglePin(params.id);
    if (result) broadcast(result, 'clipboard:itemUpdated');
    return result;
  });

  ipcMain.handle('clipboard:delete', (_e, params: { id: number }) => {
    deleteItem(params.id);
  });

  ipcMain.handle('clipboard:deleteMultiple', (_e, params: { ids: number[] }) => {
    deleteMultiple(params.ids);
  });

  ipcMain.handle('clipboard:clearAll', () => {
    return clearAll();
  });

  ipcMain.handle('clipboard:copyToClipboard', (_e, params: { id: number }) => {
    const item = getItemById(params.id) as {
      content: string; content_type: string;
    } | null;
    if (!item) return;

    if (item.content_type === 'image') {
      clipboard.writeImage(nativeImage.createFromDataURL(item.content));
    } else if (item.content_type === 'html') {
      clipboard.writeHTML(item.content);
    } else {
      clipboard.writeText(item.content);
    }
    // 更新 updated_at
    getDb()
      .prepare("UPDATE clipboard_history SET updated_at=datetime('now','localtime') WHERE id=?")
      .run(params.id);
  });

  ipcMain.handle('clipboard:getStats', () => {
    return getStats();
  });

  // ==================== 设置 ====================

  ipcMain.handle('settings:get', (_e, params: { key: string }) => {
    return getSetting(params.key);
  });

  ipcMain.handle('settings:getAll', () => {
    return getAllSettings();
  });

  ipcMain.handle('settings:set', (_e, params: { key: string; value: string }) => {
    setSetting(params.key, params.value);
  });

  ipcMain.handle('settings:updateHotkey', (_e, params: { oldKey: string; newKey: string }) => {
    const { applyHotkeyChange } = require('./index');
    const ok = applyHotkeyChange(params.oldKey, params.newKey);
    if (ok) setSetting('hotkey', params.newKey);
    return ok;
  });

  // ==================== 开机自启 ====================

  ipcMain.handle('autoLaunch:get', async () => {
    return isAutoLaunchEnabled();
  });

  ipcMain.handle('autoLaunch:set', async (_e, params: { enabled: boolean }) => {
    if (params.enabled) {
      await enableAutoLaunch();
    } else {
      await disableAutoLaunch();
    }
  });

  // ==================== 窗口控制 ====================

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle('window:hide', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide();
  });
}
