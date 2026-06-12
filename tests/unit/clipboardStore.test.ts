/**
 * Zustand clipboardStore 单元测试（扩展版：每项 10+ 用例）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useClipboardStore } from '../../src/renderer/stores/clipboardStore';
import type { ClipboardItem } from '../../src/shared/types';

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

function makeItem(overrides: Partial<ClipboardItem> = {}): ClipboardItem {
  return {
    id: 1,
    content: 'test content',
    content_type: 'text',
    content_hash: 'abc123',
    source_app: 'TestApp',
    is_favorite: 0,
    is_pinned: 0,
    created_at: '2026-06-10 12:00:00',
    updated_at: '2026-06-10 12:00:00',
    ...overrides,
  };
}

beforeEach(() => {
  useClipboardStore.setState({
    items: [],
    searchQuery: '',
    typeFilter: 'all',
    stats: { total: 0, favorites: 0, pinned: 0 },
    loading: false,
  });
});

// ================================================================
// setItems — 12 tests
// ================================================================

describe('setItems', () => {
  it('replaces the items array with given items', () => {
    useClipboardStore.getState().setItems([makeItem({ id: 1 }), makeItem({ id: 2 })]);
    expect(useClipboardStore.getState().items).toHaveLength(2);
  });

  it('overwrites existing items completely', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 }), makeItem({ id: 2 }), makeItem({ id: 3 })]);
    store.setItems([makeItem({ id: 99 })]);
    expect(useClipboardStore.getState().items).toHaveLength(1);
    expect(useClipboardStore.getState().items[0].id).toBe(99);
  });

  it('accepts an empty array', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    store.setItems([]);
    expect(useClipboardStore.getState().items).toHaveLength(0);
  });

  it('does not mutate the original array passed in', () => {
    const original = [makeItem({ id: 1 }), makeItem({ id: 2 })];
    const copy = [...original];
    useClipboardStore.getState().setItems(original);
    // Original array should still be intact
    expect(original).toEqual(copy);
  });

  it('preserves item properties exactly', () => {
    const item = makeItem({ id: 42, content: 'exact content', is_favorite: 1, is_pinned: 1 });
    useClipboardStore.getState().setItems([item]);
    const stored = useClipboardStore.getState().items[0];
    expect(stored.id).toBe(42);
    expect(stored.content).toBe('exact content');
    expect(stored.is_favorite).toBe(1);
    expect(stored.is_pinned).toBe(1);
  });

  it('supports large arrays (1000 items)', () => {
    const items = Array.from({ length: 1000 }, (_, i) => makeItem({ id: i + 1 }));
    useClipboardStore.getState().setItems(items);
    expect(useClipboardStore.getState().items).toHaveLength(1000);
    expect(useClipboardStore.getState().items[0].id).toBe(1);
    expect(useClipboardStore.getState().items[999].id).toBe(1000);
  });

  it('does not change stats when replacing items', () => {
    useClipboardStore.getState().setItems([makeItem({ id: 1 }), makeItem({ id: 2 })]);
    // setItems does NOT update stats — stats are maintained separately
    expect(useClipboardStore.getState().stats.total).toBe(0);
  });

  it('handles items with different content types', () => {
    useClipboardStore.getState().setItems([
      makeItem({ id: 1, content_type: 'text' }),
      makeItem({ id: 2, content_type: 'html' }),
      makeItem({ id: 3, content_type: 'image' }),
    ]);
    const types = useClipboardStore.getState().items.map((i) => i.content_type);
    expect(types).toEqual(['text', 'html', 'image']);
  });

  it('items are stored in the order they are given', () => {
    useClipboardStore.getState().setItems([
      makeItem({ id: 3 }),
      makeItem({ id: 1 }),
      makeItem({ id: 2 }),
    ]);
    const ids = useClipboardStore.getState().items.map((i) => i.id);
    expect(ids).toEqual([3, 1, 2]);
  });

  it('can be called multiple times with different sizes', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    expect(useClipboardStore.getState().items).toHaveLength(1);
    store.setItems([makeItem({ id: 1 }), makeItem({ id: 2 })]);
    expect(useClipboardStore.getState().items).toHaveLength(2);
    store.setItems([]);
    expect(useClipboardStore.getState().items).toHaveLength(0);
    store.setItems(Array.from({ length: 50 }, (_, i) => makeItem({ id: i + 1 })));
    expect(useClipboardStore.getState().items).toHaveLength(50);
  });

  it('does not affect other store properties', () => {
    const store = useClipboardStore.getState();
    store.setSearchQuery('test query');
    store.setTypeFilter('image');
    store.setItems([makeItem({ id: 1 })]);
    expect(useClipboardStore.getState().searchQuery).toBe('test query');
    expect(useClipboardStore.getState().typeFilter).toBe('image');
  });

  it('returns undefined (void action)', () => {
    const result = useClipboardStore.getState().setItems([makeItem()]);
    expect(result).toBeUndefined();
  });
});

// ================================================================
// addItem — 12 tests
// ================================================================

describe('addItem', () => {
  it('prepends new item to the front of the array', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    store.addItem(makeItem({ id: 2 }));
    const items = useClipboardStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe(2);
    expect(items[1].id).toBe(1);
  });

  it('increments total stat by 1', () => {
    const store = useClipboardStore.getState();
    store.addItem(makeItem({ id: 1 }));
    expect(useClipboardStore.getState().stats.total).toBe(1);
    store.addItem(makeItem({ id: 2 }));
    expect(useClipboardStore.getState().stats.total).toBe(2);
  });

  it('adds to empty items array', () => {
    useClipboardStore.getState().addItem(makeItem({ id: 1 }));
    expect(useClipboardStore.getState().items).toHaveLength(1);
    expect(useClipboardStore.getState().items[0].id).toBe(1);
  });

  it('preserves all item properties when adding', () => {
    useClipboardStore.getState().addItem(
      makeItem({ id: 10, content: 'special', content_type: 'html', source_app: 'Chrome' }),
    );
    const item = useClipboardStore.getState().items[0];
    expect(item.id).toBe(10);
    expect(item.content).toBe('special');
    expect(item.content_type).toBe('html');
    expect(item.source_app).toBe('Chrome');
  });

  it('accumulates total across many additions', () => {
    const store = useClipboardStore.getState();
    for (let i = 1; i <= 20; i++) {
      store.addItem(makeItem({ id: i }));
    }
    expect(useClipboardStore.getState().stats.total).toBe(20);
    expect(useClipboardStore.getState().items).toHaveLength(20);
  });

  it('newest item is always at index 0', () => {
    const store = useClipboardStore.getState();
    store.addItem(makeItem({ id: 1 }));
    store.addItem(makeItem({ id: 2 }));
    store.addItem(makeItem({ id: 3 }));
    expect(useClipboardStore.getState().items[0].id).toBe(3);
  });

  it('allows items with favorite/pinned flags', () => {
    useClipboardStore.getState().addItem(makeItem({ id: 1, is_favorite: 1, is_pinned: 1 }));
    const item = useClipboardStore.getState().items[0];
    expect(item.is_favorite).toBe(1);
    expect(item.is_pinned).toBe(1);
  });

  it('stats.total matches items.length when only using addItem', () => {
    const store = useClipboardStore.getState();
    for (let i = 0; i < 15; i++) store.addItem(makeItem({ id: i + 1 }));
    expect(useClipboardStore.getState().stats.total).toBe(15);
    expect(useClipboardStore.getState().items).toHaveLength(15);
  });

  it('does not change searchQuery or typeFilter', () => {
    const store = useClipboardStore.getState();
    store.setSearchQuery('hello');
    store.setTypeFilter('html');
    store.addItem(makeItem({ id: 1 }));
    expect(useClipboardStore.getState().searchQuery).toBe('hello');
    expect(useClipboardStore.getState().typeFilter).toBe('html');
  });

  it('handles rapid sequential additions', () => {
    const store = useClipboardStore.getState();
    for (let i = 0; i < 100; i++) store.addItem(makeItem({ id: i + 1 }));
    expect(useClipboardStore.getState().items).toHaveLength(100);
    expect(useClipboardStore.getState().stats.total).toBe(100);
  });

  it('does not affect other stats (favorites/pinned)', () => {
    useClipboardStore.getState().addItem(makeItem({ id: 1, is_favorite: 0, is_pinned: 0 }));
    expect(useClipboardStore.getState().stats.favorites).toBe(0);
    expect(useClipboardStore.getState().stats.pinned).toBe(0);
  });

  it('returns undefined (void action)', () => {
    const result = useClipboardStore.getState().addItem(makeItem());
    expect(result).toBeUndefined();
  });
});

// ================================================================
// searchQuery / typeFilter / loading / combined — 12 tests
// ================================================================

describe('search, filter & loading', () => {
  it('setSearchQuery updates the search query', () => {
    useClipboardStore.getState().setSearchQuery('hello');
    expect(useClipboardStore.getState().searchQuery).toBe('hello');
  });

  it('setSearchQuery accepts empty string', () => {
    useClipboardStore.getState().setSearchQuery('not empty');
    useClipboardStore.getState().setSearchQuery('');
    expect(useClipboardStore.getState().searchQuery).toBe('');
  });

  it('setSearchQuery accepts Chinese characters', () => {
    useClipboardStore.getState().setSearchQuery('你好世界');
    expect(useClipboardStore.getState().searchQuery).toBe('你好世界');
  });

  it('setTypeFilter updates the type filter', () => {
    useClipboardStore.getState().setTypeFilter('image');
    expect(useClipboardStore.getState().typeFilter).toBe('image');
  });

  it('setTypeFilter supports all valid types', () => {
    const types = ['text', 'html', 'image', 'all'] as const;
    for (const t of types) {
      useClipboardStore.getState().setTypeFilter(t);
      expect(useClipboardStore.getState().typeFilter).toBe(t);
    }
  });

  it('setLoading toggles between true and false', () => {
    useClipboardStore.getState().setLoading(true);
    expect(useClipboardStore.getState().loading).toBe(true);
    useClipboardStore.getState().setLoading(false);
    expect(useClipboardStore.getState().loading).toBe(false);
  });

  it('setLoading(false) when already false is a no-op result', () => {
    useClipboardStore.getState().setLoading(false);
    expect(useClipboardStore.getState().loading).toBe(false);
    useClipboardStore.getState().setLoading(false);
    expect(useClipboardStore.getState().loading).toBe(false);
  });

  it('search and filter can be set independently', () => {
    const store = useClipboardStore.getState();
    store.setSearchQuery('test');
    store.setTypeFilter('html');
    store.setLoading(true);
    expect(useClipboardStore.getState().searchQuery).toBe('test');
    expect(useClipboardStore.getState().typeFilter).toBe('html');
    expect(useClipboardStore.getState().loading).toBe(true);
  });

  it('items remain unchanged when updating search/filter/loading', () => {
    useClipboardStore.getState().setItems([makeItem({ id: 1 })]);
    useClipboardStore.getState().setSearchQuery('something');
    useClipboardStore.getState().setTypeFilter('image');
    useClipboardStore.getState().setLoading(true);
    expect(useClipboardStore.getState().items).toHaveLength(1);
  });

  it('default initial values are correct', () => {
    // beforeEach resets, verify initial state
    expect(useClipboardStore.getState().items).toEqual([]);
    expect(useClipboardStore.getState().searchQuery).toBe('');
    expect(useClipboardStore.getState().typeFilter).toBe('all');
    expect(useClipboardStore.getState().loading).toBe(false);
    expect(useClipboardStore.getState().stats).toEqual({ total: 0, favorites: 0, pinned: 0 });
  });

  it('setStats updates all stat fields at once', () => {
    useClipboardStore.getState().setStats({ total: 10, favorites: 3, pinned: 2 });
    expect(useClipboardStore.getState().stats).toEqual({ total: 10, favorites: 3, pinned: 2 });
  });

  it('setStats with partial object overwrites all fields', () => {
    useClipboardStore.getState().setStats({ total: 5, favorites: 2, pinned: 1 });
    useClipboardStore.getState().setStats({ total: 0, favorites: 0, pinned: 0 });
    expect(useClipboardStore.getState().stats).toEqual({ total: 0, favorites: 0, pinned: 0 });
  });
});
