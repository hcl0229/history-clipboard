/**
 * History Clipboard — 共享类型定义
 * @version 1.0
 * @date 2026-06-10
 * @description 主进程与渲染进程共用的 TypeScript 类型
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

// ==================== 剪贴板条目 ====================

export type ContentType = 'text' | 'html' | 'image';

export interface ClipboardItem {
  id: number;
  content: string;
  content_type: ContentType;
  content_hash: string;
  source_app: string | null;
  is_favorite: 0 | 1;
  is_pinned: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface HistoryQueryParams {
  limit?: number;
  offset?: number;
  filter?: {
    type?: ContentType;
    favorite?: boolean;
    pinned?: boolean;
  };
}

// ==================== 设置 ====================

export type Theme = 'light' | 'dark';
export type FontSize = '12' | '14' | '16';
export type AccentColor = '#1677FF' | '#52C41A' | '#FA8C16' | '#722ED1' | '#EB2F96' | '#13C2C2' | '#595959';
export type RetentionDays = '1' | '3' | '7' | '14' | '30';

export interface AppSettings {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  retentionDays: RetentionDays;
  maxRecords: number;
  autoLaunch: boolean;
  hotkey: string;
}

// ==================== 统计 ====================

export interface ClipboardStats {
  total: number;
  favorites: number;
  pinned: number;
}

// ==================== 窗口状态 ====================

export interface WindowState {
  windowName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

// ==================== ElectronAPI 接口 ====================

export interface ElectronAPI {
  getHistory: (params?: HistoryQueryParams) => Promise<ClipboardItem[]>;
  search: (query: string) => Promise<ClipboardItem[]>;
  getById: (id: number) => Promise<ClipboardItem | null>;
  toggleFavorite: (id: number) => Promise<ClipboardItem>;
  togglePin: (id: number) => Promise<ClipboardItem>;
  deleteItem: (id: number) => Promise<void>;
  deleteMultiple: (ids: number[]) => Promise<void>;
  clearAll: () => Promise<number>;
  copyToClipboard: (id: number) => Promise<void>;
  getStats: () => Promise<ClipboardStats>;
  getSetting: (key: string) => Promise<string | null>;
  getAllSettings: () => Promise<Record<string, string>>;
  setSetting: (key: string, value: string) => Promise<void>;
  getAutoLaunch: () => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  onNewItem: (callback: (item: ClipboardItem) => void) => () => void;
  onItemsCleared: (callback: (data: { deletedCount: number }) => void) => () => void;
  onSettingChanged: (callback: (data: { key: string; value: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
