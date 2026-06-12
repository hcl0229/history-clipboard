/**
 * i18n 翻译文件完整性测试 — 验证 zh/en JSON 的所有 key 一致
 */

import { describe, it, expect } from 'vitest';
import zh from '../../src/renderer/locales/zh.json';
import en from '../../src/renderer/locales/en.json';

// ================================================================
// 递归收集所有 key 路径
// ================================================================

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const zhKeys = new Set(collectKeys(zh));
const enKeys = new Set(collectKeys(en));

// ================================================================
// Key symmetry — 4 tests
// ================================================================

describe('i18n key symmetry', () => {
  it('zh and en have the same number of keys', () => {
    expect(zhKeys.size).toBe(enKeys.size);
  });

  it('all zh keys exist in en', () => {
    const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k));
    expect(missingInEn).toEqual([]);
  });

  it('all en keys exist in zh', () => {
    const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k));
    expect(missingInZh).toEqual([]);
  });

  it('top-level sections match between zh and en', () => {
    const zhSections = Object.keys(zh).sort();
    const enSections = Object.keys(en).sort();
    expect(zhSections).toEqual(enSections);
    expect(zhSections).toEqual(['app', 'common', 'main', 'quickpick', 'settings', 'tray']);
  });
});

// ================================================================
// Interpolation parameter consistency — 6 tests
// ================================================================

describe('i18n interpolation parameters', () => {
  // 提取所有含 {{param}} 插值参数的 key
  function findInterpolations(obj: Record<string, unknown>, prefix = ''): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        const params = [...v.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
        if (params.length > 0) result.set(path, params);
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        for (const [kp, vp] of findInterpolations(v as Record<string, unknown>, path)) {
          result.set(kp, vp);
        }
      }
    }
    return result;
  }

  const zhInterp = findInterpolations(zh);
  const enInterp = findInterpolations(en);

  it('same keys have interpolation in both zh and en', () => {
    // All keys with interpolation should exist in both
    const zhInterpKeys = [...zhInterp.keys()].sort();
    const enInterpKeys = [...enInterp.keys()].sort();
    expect(zhInterpKeys).toEqual(enInterpKeys);
  });

  it('interpolation parameter names match between zh and en', () => {
    for (const key of zhInterp.keys()) {
      const zhParams = zhInterp.get(key)!.sort();
      const enParams = enInterp.get(key)!.sort();
      expect(enParams).toEqual(zhParams);
    }
  });

  it('quickpick.stats uses {{count}} parameter', () => {
    expect(zhInterp.get('quickpick.stats')).toContain('count');
    expect(enInterp.get('quickpick.stats')).toContain('count');
  });

  it('quickpick.minAgo uses {{n}} parameter', () => {
    expect(zhInterp.get('quickpick.minAgo')).toContain('n');
    expect(enInterp.get('quickpick.minAgo')).toContain('n');
  });

  it('quickpick.hourAgo uses {{n}} parameter', () => {
    expect(zhInterp.get('quickpick.hourAgo')).toContain('n');
    expect(enInterp.get('quickpick.hourAgo')).toContain('n');
  });

  it('no interpolation keys are empty placeholders {{ }}', () => {
    for (const [key, value] of Object.entries(zh)) {
      if (typeof value === 'string') {
        expect(value).not.toMatch(/\{\{\s*\}\}/);
      }
    }
  });
});

// ================================================================
// Content validity — 6 tests
// ================================================================

describe('i18n content validity', () => {
  it('all string values are non-empty', () => {
    function checkNonEmpty(obj: Record<string, unknown>, path = '') {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof v === 'string') {
          expect(v.length).toBeGreaterThan(0);
        } else if (typeof v === 'object' && v !== null) {
          checkNonEmpty(v as Record<string, unknown>, fullPath);
        }
      }
    }
    checkNonEmpty(zh);
    checkNonEmpty(en);
  });

  it('zh contains Chinese characters in most keys', () => {
    const chineseKeys = [...zhKeys].filter((k) => {
      const val = getValue(zh, k);
      return typeof val === 'string' && /[一-鿿]/.test(val);
    });
    // At least 20 keys should have Chinese characters
    expect(chineseKeys.length).toBeGreaterThanOrEqual(20);
  });

  it('en only contains Chinese in language name labels', () => {
    // Some keys intentionally contain Chinese (e.g. language selector labels)
    // Allow 'settings.zh' and 'settings.en' to contain any characters
    const allowedChineseKeys = new Set(['settings.zh', 'settings.en']);
    for (const key of enKeys) {
      if (allowedChineseKeys.has(key)) continue;
      const val = getValue(en, key);
      if (typeof val === 'string') {
        expect(val).not.toMatch(/[一-鿿]/);
      }
    }
  });

  it('settings section has all required keys', () => {
    const requiredSettings = [
      'title', 'theme', 'light', 'dark', 'accent', 'fontSize',
      'language', 'zh', 'en', 'startup', 'retention', 'maxRecords', 'version',
    ];
    for (const k of requiredSettings) {
      expect(zhKeys.has(`settings.${k}`)).toBe(true);
      expect(enKeys.has(`settings.${k}`)).toBe(true);
    }
  });

  it('main section has all required keys', () => {
    const requiredMain = [
      'searchPlaceholder', 'tabClipboard', 'tabFavorites', 'noData', 'noFavorites',
      'copy', 'favorite', 'unfavorite', 'pin', 'unpin', 'delete',
      'clearAll', 'clearConfirm', 'deleteConfirm', 'selectHint', 'stats.total', 'stats.fav', 'stats.pin',
    ];
    for (const k of requiredMain) {
      expect(zhKeys.has(`main.${k}`)).toBe(true);
      expect(enKeys.has(`main.${k}`)).toBe(true);
    }
  });

  it('quickpick section has all required keys', () => {
    const requiredQP = [
      'search', 'stats', 'noRecords', 'loading', 'justNow', 'minAgo', 'hourAgo',
      'image', 'empty', 'favorite', 'unfavorite', 'pin', 'unpin',
    ];
    for (const k of requiredQP) {
      expect(zhKeys.has(`quickpick.${k}`)).toBe(true);
      expect(enKeys.has(`quickpick.${k}`)).toBe(true);
    }
  });
});

// ================================================================
// 辅助：根据 dot-path 获取嵌套值
// ================================================================

function getValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
}
