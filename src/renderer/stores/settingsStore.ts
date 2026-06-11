/**
 * History Clipboard — 设置状态管理（Zustand）
 * @version 1.1
 * @date 2026-06-11
 *
 * 修订记录：
 *   v1.1  2026-06-11  WorkBuddy  新增语言设置
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import { create } from 'zustand';
import type { Theme, AccentColor, FontSize, RetentionDays } from '../../shared/types';

interface SettingsStore {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  retentionDays: RetentionDays;
  maxRecords: number;
  autoLaunch: boolean;
  hotkey: string;
  loaded: boolean;

  setTheme: (v: Theme) => void;
  setAccentColor: (v: AccentColor) => void;
  setFontSize: (v: FontSize) => void;
  setRetentionDays: (v: RetentionDays) => void;
  setMaxRecords: (v: number) => void;
  setAutoLaunch: (v: boolean) => void;
  setHotkey: (v: string) => void;
  loadFromElectron: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'light',
  accentColor: '#1677FF',
  fontSize: '13',
  retentionDays: '3',
  maxRecords: 1000,
  autoLaunch: false,
  hotkey: 'Ctrl+Shift+V',
  loaded: false,

  setTheme: (theme) => { set({ theme }); window.electronAPI?.setSetting('theme', theme); },
  setAccentColor: (accentColor) => { set({ accentColor }); window.electronAPI?.setSetting('accentColor', accentColor); },
  setFontSize: (fontSize) => { set({ fontSize }); window.electronAPI?.setSetting('fontSize', fontSize); },
  setRetentionDays: (retentionDays) => { set({ retentionDays }); window.electronAPI?.setSetting('retentionDays', retentionDays); },
  setMaxRecords: (maxRecords) => { set({ maxRecords }); window.electronAPI?.setSetting('maxRecords', String(maxRecords)); },
  setAutoLaunch: (autoLaunch) => { set({ autoLaunch }); window.electronAPI?.setAutoLaunch(autoLaunch); },
  setHotkey: (hotkey) => { set({ hotkey }); window.electronAPI?.setSetting('hotkey', hotkey); },

  loadFromElectron: async () => {
    try {
      const all = await window.electronAPI?.getAllSettings();
      if (!all) return;
      set({
        theme: (all.theme as Theme) || 'light',
        accentColor: (all.accentColor as AccentColor) || '#1677FF',
        fontSize: (all.fontSize as FontSize) || '13',
        retentionDays: (all.retentionDays as RetentionDays) || '3',
        maxRecords: parseInt(all.maxRecords || '1000', 10),
        autoLaunch: all.autoLaunch === 'true',
        hotkey: all.hotkey || 'Ctrl+Shift+V',
        loaded: true,
      });
    } catch {
      console.warn('Settings: electronAPI not available');
    }
  },
}));
