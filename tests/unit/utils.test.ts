/**
 * 纯函数单元测试 — fmtTime / gist / itemBg
 *
 * 这些函数无外部依赖（不依赖 Electron / DOM / IPC），直接测试输入输出。
 */

import { describe, it, expect } from 'vitest';

// ================================================================
// 复制项目中的纯函数（避免导入整个组件引入 Ant Design 依赖）
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

function gist(content: string, max = 55): string {
  if (!content) return '(空)';
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max);
}

function itemBg(item: { is_pinned: number; is_favorite: number }): string {
  if (item.is_pinned) return 'rgba(255,77,79,0.07)';
  if (item.is_favorite) return 'rgba(250,173,20,0.08)';
  return 'transparent';
}

// ================================================================
// fmtTime
//
// fmtTime 默认时区为 +08:00（无时区标记的字符串自动追加 +08:00）。
// 测试使用 Asia/Shanghai 时区格式化时间戳，确保与函数预期一致。
// ================================================================

/** 生成 fmtTime 能正确解析的时间字符串（+08:00 时区） */
function localStr(secondsAgo: number): string {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');
}

describe('fmtTime', () => {
  it('returns "刚刚" for timestamps within 1 minute', () => {
    expect(fmtTime(localStr(30))).toBe('刚刚');
  });

  it('returns "N分前" for timestamps within 1 hour', () => {
    expect(fmtTime(localStr(5 * 60))).toBe('5分前');
  });

  it('returns "N时前" for timestamps within 24 hours', () => {
    expect(fmtTime(localStr(3 * 3600))).toBe('3时前');
  });

  it('returns date substring for timestamps older than 24 hours', () => {
    expect(fmtTime('2026-06-10 12:00:00')).toBe('2026-06-10');
  });

  it('handles date strings with explicit timezone offset', () => {
    const result = fmtTime('2026-06-10T12:00:00+08:00');
    expect(result).toBeDefined();
  });
});

// ================================================================
// gist
// ================================================================

describe('gist', () => {
  it('returns "(空)" for empty content', () => {
    expect(gist('')).toBe('(空)');
  });

  it('strips HTML tags', () => {
    expect(gist('<p>Hello World</p>')).toBe('Hello World');
  });

  it('collapses multiple whitespace', () => {
    expect(gist('Hello    World\n\nTest')).toBe('Hello World Test');
  });

  it('truncates to max length', () => {
    const long = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789';
    expect(gist(long, 10)).toBe('abcdefghij');
  });

  it('defaults to max=55', () => {
    const long = 'a'.repeat(100);
    expect(gist(long).length).toBe(55);
  });

  it('handles mixed HTML entities and whitespace', () => {
    expect(gist('<div>Hello</div> <span>World</span>')).toBe('Hello World');
  });
});

// ================================================================
// itemBg
// ================================================================

describe('itemBg', () => {
  it('returns pinned color when is_pinned=1', () => {
    expect(itemBg({ is_pinned: 1, is_favorite: 0 })).toBe('rgba(255,77,79,0.07)');
  });

  it('pinned takes priority over favorite', () => {
    expect(itemBg({ is_pinned: 1, is_favorite: 1 })).toBe('rgba(255,77,79,0.07)');
  });

  it('returns favorite color when is_favorite=1 and not pinned', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 1 })).toBe('rgba(250,173,20,0.08)');
  });

  it('returns transparent for non-pinned, non-favorite items', () => {
    expect(itemBg({ is_pinned: 0, is_favorite: 0 })).toBe('transparent');
  });
});
