/**
 * History Clipboard — 剪贴板状态管理（Zustand）
 * @version 1.0
 * @date 2026-06-10
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本（addItem/setItems/toggle 等 actions）
 */

import { create } from 'zustand';
import type { ClipboardItem, ClipboardStats, ContentType } from '../../shared/types';

interface ClipboardStore {
  items: ClipboardItem[];
  searchQuery: string;
  typeFilter: ContentType | 'all';
  stats: ClipboardStats;
  loading: boolean;

  setItems: (items: ClipboardItem[]) => void;
  addItem: (item: ClipboardItem) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (filter: ContentType | 'all') => void;
  setStats: (stats: ClipboardStats) => void;
  setLoading: (loading: boolean) => void;
}

export const useClipboardStore = create<ClipboardStore>((set) => ({
  items: [],
  searchQuery: '',
  typeFilter: 'all',
  stats: { total: 0, favorites: 0, pinned: 0 },
  loading: false,

  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({
    items: [item, ...s.items],
    stats: { ...s.stats, total: s.stats.total + 1 },
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
}));
