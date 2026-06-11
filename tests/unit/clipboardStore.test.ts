/**
 * Zustand clipboardStore 单元测试
 *
 * 测试 store actions（addItem / setItems / setSearchQuery / setTypeFilter / setLoading），
 * 不涉及 IPC / Electron。
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

// ------------------------------------------------------------------
// 每个测试前重置 store
// ------------------------------------------------------------------

beforeEach(() => {
  useClipboardStore.setState({
    items: [],
    searchQuery: '',
    typeFilter: 'all',
    stats: { total: 0, favorites: 0, pinned: 0 },
    loading: false,
  });
});

// ------------------------------------------------------------------
// setItems
// ------------------------------------------------------------------

describe('setItems', () => {
  it('replaces the items array', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 }), makeItem({ id: 2 })]);
    expect(useClipboardStore.getState().items).toHaveLength(2);
  });

  it('overwrites existing items', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    store.setItems([makeItem({ id: 2 })]);
    expect(useClipboardStore.getState().items).toHaveLength(1);
  });

  it('accepts an empty array', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    store.setItems([]);
    expect(useClipboardStore.getState().items).toHaveLength(0);
  });
});

// ------------------------------------------------------------------
// addItem
// ------------------------------------------------------------------

describe('addItem', () => {
  it('prepends item to the front of the array', () => {
    const store = useClipboardStore.getState();
    store.setItems([makeItem({ id: 1 })]);
    store.addItem(makeItem({ id: 2 }));
    const items = useClipboardStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe(2); // new item first
    expect(items[1].id).toBe(1);
  });

  it('increments total stat', () => {
    const store = useClipboardStore.getState();
    store.addItem(makeItem({ id: 1 }));
    expect(useClipboardStore.getState().stats.total).toBe(1);
    store.addItem(makeItem({ id: 2 }));
    expect(useClipboardStore.getState().stats.total).toBe(2);
  });
});

// ------------------------------------------------------------------
// setSearchQuery / setTypeFilter / setLoading
// ------------------------------------------------------------------

describe('search & filter', () => {
  it('setSearchQuery updates the search query', () => {
    useClipboardStore.getState().setSearchQuery('hello');
    expect(useClipboardStore.getState().searchQuery).toBe('hello');
  });

  it('setTypeFilter updates the type filter', () => {
    useClipboardStore.getState().setTypeFilter('image');
    expect(useClipboardStore.getState().typeFilter).toBe('image');
  });

  it('setLoading toggles loading state', () => {
    useClipboardStore.getState().setLoading(true);
    expect(useClipboardStore.getState().loading).toBe(true);
    useClipboardStore.getState().setLoading(false);
    expect(useClipboardStore.getState().loading).toBe(false);
  });
});
