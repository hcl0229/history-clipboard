/**
 * History Clipboard — 开机自启模块
 * @version 1.0
 * @date 2026-06-10
 * @description Windows 注册表开机自启管理
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import AutoLaunch from 'auto-launch';
import { app } from 'electron';

let launcher: AutoLaunch | null = null;

export function initAutoLaunch(): void {
  launcher = new AutoLaunch({ name: 'History Clipboard', path: app.getPath('exe') });
  launcher.isEnabled().then((on: boolean) => {
    console.log('[AutoLaunch] Status:', on ? 'ON' : 'OFF');
  });
}

export async function enableAutoLaunch(): Promise<void> {
  if (!launcher) return;
  await launcher.enable();
}

export async function disableAutoLaunch(): Promise<void> {
  if (!launcher) return;
  await launcher.disable();
}

export async function isAutoLaunchEnabled(): Promise<boolean> {
  if (!launcher) return false;
  return launcher.isEnabled();
}
