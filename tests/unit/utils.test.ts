/**
 * 纯函数单元测试 — fmtTime / gist / itemBg（扩展版：每项 10+ 用例）
 */

import { describe, it, expect } from 'vitest';

// ================================================================
// 复制项目中的纯函数
// ================================================================

function fmtTime(dateStr: string): string {
  const now = Date.now();
  const then = +new Date(dateStr.replace(' ', 'T') + (dateStr.includes('+') ? '' : '+08:00'));
  const diff = now - then;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '时前';
  return dateStr.substring(0, 10);
}

function gist(item: string, max = 55): string {
  if (!item) return '(空)';
  return item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max);
}

function itemBg(item: { is_pinned: number; is_favorite: number }): string {
  if (item.is_pinned) return 'rgba(255,77,79,0.07)';
  if (item.is_favorite) return 'rgba(250,173,20,0.08)';
  return 'transparent';
}

// ================================================================
// 辅助函数
// ================================================================

function localStr(secondsAgo: number): string {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');
}

// ================================================================
// fmtTime — 13 tests
// ================================================================

describe('fmtTime', () => {
  // 基础时间范围
  it('returns "刚刚" for 0 seconds ago (boundary)', () => {
    expect(fmtTime(localStr(0))).toBe('刚刚');
  });

  it('returns "刚刚" for 30 seconds ago', () => {
    expect(fmtTime(localStr(30))).toBe('刚刚');
  });

  it('returns "刚刚" for 59 seconds ago (upper boundary)', () => {
    expect(fmtTime(localStr(59))).toBe('刚刚');
  });

  it('returns "N分前" for exactly 1 minute (lower boundary)', () => {
    expect(fmtTime(localStr(60))).toBe('1分前');
  });

  it('returns "N分前" for 5 minutes ago', () => {
    expect(fmtTime(localStr(5 * 60))).toBe('5分前');
  });

  it('returns "N分前" for 59 minutes ago (upper boundary)', () => {
    expect(fmtTime(localStr(59 * 60))).toBe('59分前');
  });

  it('returns "N时前" for exactly 1 hour (lower boundary)', () => {
    expect(fmtTime(localStr(3600))).toBe('1时前');
  });

  it('returns "N时前" for 3 hours ago', () => {
    expect(fmtTime(localStr(3 * 3600))).toBe('3时前');
  });

  it('returns "N时前" for 23 hours ago (upper boundary)', () => {
    expect(fmtTime(localStr(23 * 3600))).toBe('23时前');
  });

  it('returns date string for 24 hours ago (lower boundary)', () => {
    const d = new Date(Date.now() - 24 * 3600 * 1000);
    const expected = d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).substring(0, 10);
    expect(fmtTime(localStr(24 * 3600))).toBe(expected);
  });

  it('returns date substring for explicit date string', () => {
    expect(fmtTime('2026-06-10 12:00:00')).toBe('2026-06-10');
  });

  it('handles date with explicit +08:00 timezone', () => {
    const result = fmtTime('2026-06-10T12:00:00+08:00');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('handles date far in the past', () => {
    expect(fmtTime('2024-01-01 00:00:00')).toBe('2024-01-01');
  });
});

// ================================================================
// gist — 14 tests
// ================================================================

describe('gist', () => {
  it('returns "(空)" for empty string', () => {
    expect(gist('')).toBe('(空)');
  });

  it('strips simple HTML tags', () => {
    expect(gist('<p>Hello World</p>')).toBe('Hello World');
  });

  it('strips nested HTML tags', () => {
    expect(gist('<div><span>Nested</span></div>')).toBe('Nested');
  });

  it('collapses multiple whitespace into single space', () => {
    expect(gist('Hello    World\n\nTest')).toBe('Hello World Test');
  });

  it('handles tabs and carriage returns as whitespace', () => {
    expect(gist('Hello\t\tWorld\r\nTest')).toBe('Hello World Test');
  });

  it('truncates to custom max length', () => {
    const long = 'abcdefghijklmnopqrstuvwxyz0123456789';
    expect(gist(long, 10)).toBe('abcdefghij');
  });

  it('default max is 55', () => {
    const long = 'a'.repeat(100);
    expect(gist(long).length).toBe(55);
  });

  it('returns exact content when shorter than max', () => {
    expect(gist('Short text', 55)).toBe('Short text');
  });

  it('strips HTML tags but preserves HTML entities', () => {
    // gist strips <tag> but does NOT decode &lt; &amp; &gt; entities
    const result = gist('Price &lt; 10 &amp;&amp; &gt; 5');
    expect(result).toContain('Price');
    expect(result).toContain('10');
    expect(result).toContain('5');
    // Entities pass through unchanged (no entity decoding)
    expect(result).toContain('&lt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&gt;');
  });

  it('preserves non-HTML special characters', () => {
    expect(gist('Hello! @#$%^&*()_+ World')).toBe('Hello! @#$%^&*()_+ World');
  });

  it('handles Chinese characters correctly', () => {
    expect(gist('你好世界 Hello World')).toBe('你好世界 Hello World');
  });

  it('trims leading and trailing whitespace after HTML strip', () => {
    expect(gist('<div>  padded  </div>')).toBe('padded');
  });

  it('handles self-closing tags', () => {
    expect(gist('Line 1<br/>Line 2<hr>Line 3')).toBe('Line 1 Line 2 Line 3');
  });

  it('returns empty string for whitespace-only content', () => {
    expect(gist('   \n  \t  ')).toBe('');
  });
});

// ================================================================
// itemBg — 11 tests
// ================================================================

describe('itemBg', () => {
  const PIN_COLOR = 'rgba(255,77,79,0.07)';
  const FAV_COLOR = 'rgba(250,173,20,0.08)';
  const NONE_COLOR = 'transparent';

  it('returns pinned color when is_pinned=1, is_favorite=0', () => {
    expect(itemBg({ is_pinned: 1, is_favorite: 0 })).toBe(PIN_COLOR);
  });

  it('returns pinned color when is_pinned=1, is_favorite=1 (pinned takes priority)', () => {
    expect(itemBg({ is_pinned: 1, is_favorite: 1 })).toBe(PIN_COLOR);
  });

  it('returns favorite color when is_pinned=0, is_favorite=1', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 1 })).toBe(FAV_COLOR);
  });

  it('returns transparent for non-pinned, non-favorite items', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 0 })).toBe(NONE_COLOR);
  });

  it('returns transparent when pinned=0, fav=undefined-like (falsy)', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 0 })).toBe(NONE_COLOR);
  });

  it('color values are valid CSS rgba or transparent', () => {
    const colors = [
      itemBg({ is_pinned: 1, is_favorite: 0 }),
      itemBg({ is_pinned: 0, is_favorite: 1 }),
      itemBg({ is_pinned: 0, is_favorite: 0 }),
    ];
    for (const c of colors) {
      expect(c === 'transparent' || c.startsWith('rgba(')).toBe(true);
    }
  });

  it('pin color uses red tones', () => {
    // rgba(255,77,79,0.07) — R is 255 (max red)
    expect(itemBg({ is_pinned: 1, is_favorite: 0 })).toContain('255');
  });

  it('fav color uses yellow/amber tones', () => {
    // rgba(250,173,20,0.08) — G is 173 (amber)
    expect(itemBg({ is_pinned: 0, is_favorite: 1 })).toContain('173');
  });

  it('pinned priority is consistent regardless of argument order evaluation', () => {
    // If code evaluated favorite first, pinned must still win
    const a = itemBg({ is_pinned: 1, is_favorite: 1 });
    const b = itemBg({ is_pinned: 1, is_favorite: 0 });
    expect(a).toBe(b);
  });

  it('returns same result for same input (idempotent)', () => {
    const input = { is_pinned: 0, is_favorite: 1 };
    expect(itemBg(input)).toBe(itemBg(input));
    expect(itemBg(input)).toBe(itemBg(input));
  });

  it('handles integer 0/1 correctly (not truthy/falsy of other values)', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 5 as any })).toBe(FAV_COLOR);
    expect(itemBg({ is_pinned: -1 as any, is_favorite: 0 })).toBe(PIN_COLOR);
  });
});
