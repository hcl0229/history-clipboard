/**
 * History Clipboard — 快捷键管理模块
 * @version 1.0
 * @date 2026-06-09
 * @description 注册/注销全局快捷键，处理冲突检测
 *
 * 修订记录：
 *   v1.0  2026-06-09  WorkBuddy  初始版本
 */

import { globalShortcut, BrowserWindow } from 'electron';

let quickPickWindow: BrowserWindow | null = null;
let registeredKeys: string[] = [];

/**
 * 注册全局快捷键
 */
export function registerHotkeys(win: BrowserWindow): void {
  quickPickWindow = win;

  const hotkey = 'Ctrl+Shift+V';

  const success = globalShortcut.register(hotkey, () => {
    if (quickPickWindow?.isVisible()) {
      quickPickWindow.hide();
    } else {
      quickPickWindow?.show();
      quickPickWindow?.focus();
    }
  });

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
 * 更新快捷键绑定
 */
export function updateHotkey(oldKey: string, newKey: string): boolean {
  globalShortcut.unregister(oldKey);
  const success = globalShortcut.register(newKey, () => {
    if (quickPickWindow?.isVisible()) {
      quickPickWindow.hide();
    } else {
      quickPickWindow?.show();
      quickPickWindow?.focus();
    }
  });

  if (success) {
    registeredKeys = registeredKeys.filter((k) => k !== oldKey);
    registeredKeys.push(newKey);
  }

  return success;
}
