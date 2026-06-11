/**
 * History Clipboard — 剪贴板监控模块
 * @version 1.2
 * @date 2026-06-11
 * @description 300ms 定时轮询系统剪贴板，SHA256 哈希去重，自动记录变更
 *
 * 修订记录：
 *   v1.2  2026-06-11  WorkBuddy  前景窗口检测改为异步缓存，修复 execSync 阻塞 IPC
 *   v1.1  2026-06-11  WorkBuddy  修复去重逻辑和窗口空指针
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { clipboard, BrowserWindow } from 'electron';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import {
  getLastHash,
  insertClipboardItem,
  getItemById,
  runCleanup,
} from './database';

const POLL_INTERVAL = 300;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FG_CACHE_MS = 2000; // 前景窗口缓存 2 秒

let timer: ReturnType<typeof setInterval> | null = null;
let lastHash: string | null = null;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

// 前景窗口缓存
let cachedApp: string = 'Unknown';
let cachedAppTime: number = 0;
let fgPending: boolean = false;

// ==================== 剪贴板读取 ====================

interface ClipboardData {
  content: string;
  type: 'text' | 'html' | 'image';
}

function readClipboard(): ClipboardData | null {
  try {
    const img = clipboard.readImage();
    if (!img.isEmpty()) {
      const dataUrl = img.toDataURL();
      if (dataUrl.length > MAX_IMAGE_BYTES) {
        console.warn('[Monitor] Image too large, skipped');
        return null;
      }
      return { content: dataUrl, type: 'image' };
    }

    const html = clipboard.readHTML();
    if (html && html.trim().length > 0) {
      return { content: html, type: 'html' };
    }

    const text = clipboard.readText();
    if (text && text.trim().length > 0) {
      return { content: text, type: 'text' };
    }

    return null;
  } catch (err) {
    console.error('[Monitor] Read error:', err);
    return null;
  }
}

// ==================== 哈希 ====================

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

// ==================== 来源应用（异步 + 缓存） ====================

function getForegroundAppAsync(): string {
  // 缓存未过期直接返回
  if (Date.now() - cachedAppTime < FG_CACHE_MS) return cachedApp;

  // 异步刷新（不阻塞）
  if (!fgPending) {
    fgPending = true;
    const script = [
      'Add-Type @"',
      'using System;using System.Runtime.InteropServices;using System.Text;',
      'public class Win32{',
      '[DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();',
      '[DllImport("user32.dll")]public static extern int GetWindowText(IntPtr hWnd,StringBuilder text,int count);',
      '}',
      '"@',
      '$hwnd=[Win32]::GetForegroundWindow()',
      '$sb=New-Object System.Text.StringBuilder(256)',
      '[Win32]::GetWindowText($hwnd,$sb,256)',
      '$sb.ToString()',
    ].join(';');
    exec(
      `powershell -NoProfile -Command "${script}"`,
      { timeout: 2000 },
      (err, stdout) => {
        fgPending = false;
        if (!err && stdout) {
          cachedApp = stdout.trim() || 'Unknown';
          cachedAppTime = Date.now();
        }
      },
    );
  }
  return cachedApp;
}

// ==================== 广播 ====================

export function broadcast(item: unknown, channel = 'clipboard:newItem'): void {
  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    try {
      if (!win.isDestroyed() && win.webContents) {
        win.webContents.send(channel, item);
      }
    } catch {
      /* window just closed */
    }
  }
}

// ==================== 监控生命周期 ====================

export function startClipboardMonitor(): void {
  console.log(`[Monitor] Started (${POLL_INTERVAL}ms interval)`);

  lastHash = getLastHash() || null;

  timer = setInterval(() => {
    try {
      const data = readClipboard();
      if (!data) return;

      // 哈希去重
      const hash = sha256(data.content);
      if (hash === lastHash || hash === getLastHash()) return;
      lastHash = hash;

      // 插入（前景窗口异步获取不阻塞）
      const sourceApp = getForegroundAppAsync();
      const newId = insertClipboardItem(data.content, data.type, hash, sourceApp);
      const item = getItemById(newId);

      if (item) broadcast(item, 'clipboard:newItem');
    } catch (err) {
      console.error('[Monitor] Interval error:', err);
    }
  }, POLL_INTERVAL);

  // 清理调度
  runCleanup();
  cleanupInterval = setInterval(() => {
    const deleted = runCleanup();
    if (deleted > 0) broadcast({ _type: 'cleanup', deletedCount: deleted });
  }, 60 * 60 * 1000);
}

export function stopClipboardMonitor(): void {
  if (timer) { clearInterval(timer); timer = null; }
  if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; }
  console.log('[Monitor] Stopped');
}
