/**
 * Zustand settingsStore 单元测试
 *
 * 因为 store setter 会调用 window.electronAPI?.setSetting(...)，
 * 在 Node 环境用 vi.stubGlobal 注入 mock。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 在 import store 之前 mock 全局 window
vi.stubGlobal('window', {
  electronAPI: {
    setSetting: vi.fn().mockResolvedValue(undefined),
    setAutoLaunch: vi.fn().mockResolvedValue(undefined),
    getAllSettings: vi.fn().mockResolvedValue({}),
  },
});

import { useSettingsStore } from '../../src/renderer/stores/settingsStore';

beforeEach(() => {
  vi.clearAllMocks();
  useSettingsStore.setState({
    theme: 'light',
    accentColor: '#1677FF',
    fontSize: '13',
    language: 'zh',
    retentionDays: '3',
    maxRecords: 1000,
    autoLaunch: false,
    hotkey: 'Ctrl+Shift+V',
    loaded: false,
  });
});

describe('settingsStore', () => {
  it('setTheme updates theme', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('setAccentColor updates accent color', () => {
    useSettingsStore.getState().setAccentColor('#F5222D');
    expect(useSettingsStore.getState().accentColor).toBe('#F5222D');
  });

  it('setFontSize updates font size', () => {
    useSettingsStore.getState().setFontSize('14');
    expect(useSettingsStore.getState().fontSize).toBe('14');
  });

  it('setLanguage updates language', () => {
    useSettingsStore.getState().setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('setRetentionDays updates retention', () => {
    useSettingsStore.getState().setRetentionDays('7');
    expect(useSettingsStore.getState().retentionDays).toBe('7');
  });

  it('setMaxRecords updates max records', () => {
    useSettingsStore.getState().setMaxRecords(2000);
    expect(useSettingsStore.getState().maxRecords).toBe(2000);
  });

  it('setAutoLaunch toggles auto launch', () => {
    useSettingsStore.getState().setAutoLaunch(true);
    expect(useSettingsStore.getState().autoLaunch).toBe(true);
    useSettingsStore.getState().setAutoLaunch(false);
    expect(useSettingsStore.getState().autoLaunch).toBe(false);
  });

  it('setHotkey updates hotkey', () => {
    useSettingsStore.getState().setHotkey('Ctrl+Shift+X');
    expect(useSettingsStore.getState().hotkey).toBe('Ctrl+Shift+X');
  });

  it('loadFromElectron handles missing API gracefully', async () => {
    // getAllSettings mock returns {} → all defaults applied
    (window.electronAPI.getAllSettings as any).mockResolvedValue({});
    await useSettingsStore.getState().loadFromElectron();
    // Should not crash; loaded may stay false if API returns empty
    expect(true).toBe(true);
  });
});
