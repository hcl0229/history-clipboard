/**
 * Zustand settingsStore 单元测试（扩展版：10+ 用例）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

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

// ================================================================
// Theme — 5 tests
// ================================================================

describe('theme', () => {
  it('setTheme to dark updates state', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('setTheme to light updates state', () => {
    useSettingsStore.getState().setTheme('dark');
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('setTheme calls electronAPI.setSetting', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('theme', 'dark');
  });

  it('default theme is light', () => {
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('theme toggles between light and dark', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });
});

// ================================================================
// Accent color — 3 tests
// ================================================================

describe('accentColor', () => {
  it('updates to a different color', () => {
    useSettingsStore.getState().setAccentColor('#F5222D');
    expect(useSettingsStore.getState().accentColor).toBe('#F5222D');
  });

  it('persists via electronAPI', () => {
    useSettingsStore.getState().setAccentColor('#722ED1');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('accentColor', '#722ED1');
  });

  it('default is #1677FF (blue)', () => {
    expect(useSettingsStore.getState().accentColor).toBe('#1677FF');
  });
});

// ================================================================
// Font size — 4 tests
// ================================================================

describe('fontSize', () => {
  it('updates to a different font size', () => {
    useSettingsStore.getState().setFontSize('14');
    expect(useSettingsStore.getState().fontSize).toBe('14');
  });

  it('accepts all valid font sizes', () => {
    const sizes = ['12', '14', '16'] as const;
    for (const s of sizes) {
      useSettingsStore.getState().setFontSize(s);
      expect(useSettingsStore.getState().fontSize).toBe(s);
    }
  });

  it('persists via electronAPI', () => {
    useSettingsStore.getState().setFontSize('16');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('fontSize', '16');
  });

  it('default is 13', () => {
    expect(useSettingsStore.getState().fontSize).toBe('13');
  });
});

// ================================================================
// Language — 4 tests
// ================================================================

describe('language', () => {
  it('updates to English', () => {
    useSettingsStore.getState().setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('switches back from English to Chinese', () => {
    useSettingsStore.getState().setLanguage('en');
    useSettingsStore.getState().setLanguage('zh');
    expect(useSettingsStore.getState().language).toBe('zh');
  });

  it('persists via electronAPI', () => {
    useSettingsStore.getState().setLanguage('en');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('language', 'en');
  });

  it('default is zh', () => {
    expect(useSettingsStore.getState().language).toBe('zh');
  });
});

// ================================================================
// Retention days — 4 tests
// ================================================================

describe('retentionDays', () => {
  it('updates to 7 days', () => {
    useSettingsStore.getState().setRetentionDays('7');
    expect(useSettingsStore.getState().retentionDays).toBe('7');
  });

  it('accepts all valid retention values', () => {
    const values = ['1', '3', '7', '14', '30'] as const;
    for (const v of values) {
      useSettingsStore.getState().setRetentionDays(v);
      expect(useSettingsStore.getState().retentionDays).toBe(v);
    }
  });

  it('persists via electronAPI', () => {
    useSettingsStore.getState().setRetentionDays('14');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('retentionDays', '14');
  });

  it('default is 3 days', () => {
    expect(useSettingsStore.getState().retentionDays).toBe('3');
  });
});

// ================================================================
// Max records — 4 tests
// ================================================================

describe('maxRecords', () => {
  it('updates to 2000', () => {
    useSettingsStore.getState().setMaxRecords(2000);
    expect(useSettingsStore.getState().maxRecords).toBe(2000);
  });

  it('accepts minimum value (100)', () => {
    useSettingsStore.getState().setMaxRecords(100);
    expect(useSettingsStore.getState().maxRecords).toBe(100);
  });

  it('accepts maximum value (5000)', () => {
    useSettingsStore.getState().setMaxRecords(5000);
    expect(useSettingsStore.getState().maxRecords).toBe(5000);
  });

  it('default is 1000', () => {
    expect(useSettingsStore.getState().maxRecords).toBe(1000);
  });
});

// ================================================================
// Auto launch — 5 tests
// ================================================================

describe('autoLaunch', () => {
  it('enables auto launch', () => {
    useSettingsStore.getState().setAutoLaunch(true);
    expect(useSettingsStore.getState().autoLaunch).toBe(true);
  });

  it('disables auto launch', () => {
    useSettingsStore.getState().setAutoLaunch(true);
    useSettingsStore.getState().setAutoLaunch(false);
    expect(useSettingsStore.getState().autoLaunch).toBe(false);
  });

  it('calls electronAPI.setAutoLaunch with correct value', () => {
    useSettingsStore.getState().setAutoLaunch(true);
    expect(window.electronAPI.setAutoLaunch).toHaveBeenCalledWith(true);
  });

  it('default is false', () => {
    expect(useSettingsStore.getState().autoLaunch).toBe(false);
  });

  it('toggle multiple times works correctly', () => {
    const store = useSettingsStore.getState();
    store.setAutoLaunch(true);
    expect(useSettingsStore.getState().autoLaunch).toBe(true);
    store.setAutoLaunch(false);
    expect(useSettingsStore.getState().autoLaunch).toBe(false);
    store.setAutoLaunch(true);
    expect(useSettingsStore.getState().autoLaunch).toBe(true);
  });
});

// ================================================================
// Hotkey — 3 tests
// ================================================================

describe('hotkey', () => {
  it('updates to a custom hotkey', () => {
    useSettingsStore.getState().setHotkey('Ctrl+Shift+X');
    expect(useSettingsStore.getState().hotkey).toBe('Ctrl+Shift+X');
  });

  it('persists via electronAPI', () => {
    useSettingsStore.getState().setHotkey('Alt+V');
    expect(window.electronAPI.setSetting).toHaveBeenCalledWith('hotkey', 'Alt+V');
  });

  it('default is Ctrl+Shift+V', () => {
    expect(useSettingsStore.getState().hotkey).toBe('Ctrl+Shift+V');
  });
});

// ================================================================
// loadFromElectron — 6 tests
// ================================================================

describe('loadFromElectron', () => {
  it('applies all settings from electronAPI response', async () => {
    (window.electronAPI.getAllSettings as any).mockResolvedValue({
      theme: 'dark',
      accentColor: '#F5222D',
      fontSize: '16',
      language: 'en',
      retentionDays: '30',
      maxRecords: '500',
      autoLaunch: 'true',
      hotkey: 'Alt+Shift+V',
    });
    await useSettingsStore.getState().loadFromElectron();
    const s = useSettingsStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.accentColor).toBe('#F5222D');
    expect(s.fontSize).toBe('16');
    expect(s.language).toBe('en');
    expect(s.retentionDays).toBe('30');
    expect(s.maxRecords).toBe(500);
    expect(s.autoLaunch).toBe(true);
    expect(s.hotkey).toBe('Alt+Shift+V');
    expect(s.loaded).toBe(true);
  });

  it('uses defaults when getAllSettings returns empty object', async () => {
    (window.electronAPI.getAllSettings as any).mockResolvedValue({});
    await useSettingsStore.getState().loadFromElectron();
    const s = useSettingsStore.getState();
    expect(s.theme).toBe('light');
    expect(s.accentColor).toBe('#1677FF');
    expect(s.language).toBe('zh');
    expect(s.maxRecords).toBe(1000);
    expect(s.loaded).toBe(true);
  });

  it('handles partial settings (only some keys)', async () => {
    (window.electronAPI.getAllSettings as any).mockResolvedValue({
      theme: 'dark',
      // other keys missing
    });
    await useSettingsStore.getState().loadFromElectron();
    const s = useSettingsStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.fontSize).toBe('13'); // default
    expect(s.loaded).toBe(true);
  });

  it('handles API returning null/undefined gracefully', async () => {
    (window.electronAPI.getAllSettings as any).mockResolvedValue(null);
    await useSettingsStore.getState().loadFromElectron();
    // Should not crash, loaded stays false
    expect(useSettingsStore.getState().loaded).toBe(false);
  });

  it('handles API rejection gracefully', async () => {
    (window.electronAPI.getAllSettings as any).mockRejectedValue(new Error('IPC error'));
    // Should not throw
    await expect(useSettingsStore.getState().loadFromElectron()).resolves.toBeUndefined();
  });

  it('converts autoLaunch string to boolean correctly', async () => {
    (window.electronAPI.getAllSettings as any).mockResolvedValue({ autoLaunch: 'false' });
    await useSettingsStore.getState().loadFromElectron();
    expect(useSettingsStore.getState().autoLaunch).toBe(false);

    (window.electronAPI.getAllSettings as any).mockResolvedValue({ autoLaunch: 'true' });
    await useSettingsStore.getState().loadFromElectron();
    expect(useSettingsStore.getState().autoLaunch).toBe(true);
  });
});

// ================================================================
// Cross-setter interaction — 5 tests
// ================================================================

describe('cross-setter interactions', () => {
  it('multiple setters can be called in sequence without conflict', () => {
    const store = useSettingsStore.getState();
    store.setTheme('dark');
    store.setFontSize('16');
    store.setLanguage('en');
    store.setMaxRecords(500);
    const s = useSettingsStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.fontSize).toBe('16');
    expect(s.language).toBe('en');
    expect(s.maxRecords).toBe(500);
  });

  it('each setter calls the correct API method', () => {
    const mockSetSetting = window.electronAPI.setSetting as any;
    useSettingsStore.getState().setTheme('dark');
    expect(mockSetSetting).toHaveBeenLastCalledWith('theme', 'dark');
    useSettingsStore.getState().setFontSize('14');
    expect(mockSetSetting).toHaveBeenLastCalledWith('fontSize', '14');
    useSettingsStore.getState().setLanguage('en');
    expect(mockSetSetting).toHaveBeenLastCalledWith('language', 'en');
  });

  it('reset to defaults works by calling each setter', () => {
    const store = useSettingsStore.getState();
    store.setTheme('dark');
    store.setFontSize('16');
    store.setLanguage('en');
    store.setMaxRecords(5000);
    // Reset to defaults
    store.setTheme('light');
    store.setFontSize('13');
    store.setLanguage('zh');
    store.setMaxRecords(1000);
    const s = useSettingsStore.getState();
    expect(s.theme).toBe('light');
    expect(s.fontSize).toBe('13');
    expect(s.language).toBe('zh');
    expect(s.maxRecords).toBe(1000);
  });

  it('loaded flag not affected by regular setters', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().loaded).toBe(false);
  });

  it('state consistency after rapid sequential updates', () => {
    const store = useSettingsStore.getState();
    for (let i = 0; i < 10; i++) {
      store.setTheme(i % 2 === 0 ? 'light' : 'dark');
      store.setMaxRecords((i + 1) * 100);
    }
    // Last iteration: i=9 → theme='dark', maxRecords=1000
    expect(useSettingsStore.getState().theme).toBe('dark');
    expect(useSettingsStore.getState().maxRecords).toBe(1000);
  });
});
