/**
 * History Clipboard — Preload 安全桥接
 * @version 1.1
 * @date 2026-06-11
 * @description contextBridge 向渲染进程暴露有限的 Electron API
 *
 * 修订记录：
 *   v1.1  2026-06-11  WorkBuddy  新增 onItemUpdated 跨窗口同步监听
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // --- 剪贴板 ---
  getHistory: (params?: Record<string, unknown>) =>
    ipcRenderer.invoke('clipboard:getHistory', params ?? {}),
  search: (query: string) =>
    ipcRenderer.invoke('clipboard:search', { query }),
  getById: (id: number) =>
    ipcRenderer.invoke('clipboard:getById', { id }),
  toggleFavorite: (id: number) =>
    ipcRenderer.invoke('clipboard:toggleFavorite', { id }),
  togglePin: (id: number) =>
    ipcRenderer.invoke('clipboard:togglePin', { id }),
  deleteItem: (id: number) =>
    ipcRenderer.invoke('clipboard:delete', { id }),
  deleteMultiple: (ids: number[]) =>
    ipcRenderer.invoke('clipboard:deleteMultiple', { ids }),
  clearAll: () =>
    ipcRenderer.invoke('clipboard:clearAll'),
  copyToClipboard: (id: number) =>
    ipcRenderer.invoke('clipboard:copyToClipboard', { id }),
  getStats: () =>
    ipcRenderer.invoke('clipboard:getStats'),

  // --- 设置 ---
  getSetting: (key: string) =>
    ipcRenderer.invoke('settings:get', { key }),
  getAllSettings: () =>
    ipcRenderer.invoke('settings:getAll'),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', { key, value }),

  // --- 开机自启 ---
  getAutoLaunch: () =>
    ipcRenderer.invoke('autoLaunch:get'),
  setAutoLaunch: (enabled: boolean) =>
    ipcRenderer.invoke('autoLaunch:set', { enabled }),

  // --- 窗口 ---
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),

  // --- 事件监听 ---
  onNewItem: (cb: (item: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, item: unknown) => cb(item);
    ipcRenderer.on('clipboard:newItem', handler);
    return () => ipcRenderer.removeListener('clipboard:newItem', handler);
  },
  onItemUpdated: (cb: (item: unknown) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, item: unknown) => cb(item);
    ipcRenderer.on('clipboard:itemUpdated', handler);
    return () => ipcRenderer.removeListener('clipboard:itemUpdated', handler);
  },
  onItemsCleared: (cb: (data: { deletedCount: number }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { deletedCount: number }) => cb(data);
    ipcRenderer.on('clipboard:itemsCleared', handler);
    return () => ipcRenderer.removeListener('clipboard:itemsCleared', handler);
  },
  onSettingChanged: (cb: (data: { key: string; value: string }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { key: string; value: string }) => cb(data);
    ipcRenderer.on('settings:changed', handler);
    return () => ipcRenderer.removeListener('settings:changed', handler);
  },
  onQuickPickOpened: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('quickpick:opened', handler);
    return () => ipcRenderer.removeListener('quickpick:opened', handler);
  },
});
