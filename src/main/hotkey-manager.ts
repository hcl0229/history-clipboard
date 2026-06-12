/**
 * History Clipboard — 快捷键管理模块
 * @version 1.1
 * @date 2026-06-12
 * @description 注册/注销/更新全局快捷键，支持运行时动态切换
 *
 * 修订记录：
 *   v1.1  2026-06-12  WorkBuddy  支持可配置快捷键，registerHotkeys 接受 hotkey 参数
 *   v1.0  2026-06-09  WorkBuddy  初始版本
 */

import { globalShortcut, BrowserWindow } from 'electron';

let quickPickWindow: BrowserWindow | null = null;
let registeredKeys: string[] = [];

function toggleQuickPick() {
  if (!quickPickWindow) return;
  if (quickPickWindow.isVisible()) {
    quickPickWindow.hide();
  } else {
    quickPickWindow.show();
    quickPickWindow.focus();
  }
}

/**
 * 注册全局快捷键
 */
export function registerHotkeys(win: BrowserWindow, hotkey = 'Ctrl+Shift+V'): void {
  quickPickWindow = win;

  const success = globalShortcut.register(hotkey, toggleQuickPick);

  if (success) {
    registeredKeys.push(hotkey);
    console.log('[HotkeyManager] Registered:', hotkey);
  } else {
    console.warn('[HotkeyManager] Failed to register:', hotkey);
  }
}

/**
 * 注销所有已注册的快捷键
 */
export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll();
  registeredKeys = [];
  console.log('[HotkeyManager] All hotkeys unregistered');
}

/**
 * 运行时更新快捷键绑定
 * @param oldKey 旧的快捷键（用于注销）
 * @param newKey 新的快捷键（用于注册）
 * @param win QuickPick 窗口引用（用于 toggle 回调）
 */
export function updateHotkey(oldKey: string, newKey: string, win?: BrowserWindow): boolean {
  if (win) quickPickWindow = win;
  if (oldKey) globalShortcut.unregister(oldKey);

  const success = globalShortcut.register(newKey, toggleQuickPick);

  if (success) {
    registeredKeys = registeredKeys.filter((k) => k !== oldKey);
    registeredKeys.push(newKey);
    console.log('[HotkeyManager] Updated:', oldKey, '→', newKey);
  } else {
    console.warn('[HotkeyManager] Failed to register new hotkey:', newKey);
  }

  return success;
}
