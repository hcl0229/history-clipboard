/**
 * History Clipboard — QuickPick 浮窗
 * @version 1.2
 * @date 2026-06-11
 *
 * 修订记录：
 *   v1.2  2026-06-11  WorkBuddy  乐观更新、forceUpdate 刷新、事件代理修复
 *   v1.1  2026-06-11  WorkBuddy  修复 Zustand setItems 函数式更新问题
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useRef, useState, useCallback, useReducer } from 'react';
import { Input, List, Typography, Tag } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled, ReloadOutlined } from '@ant-design/icons';
import { useClipboardStore } from '../stores/clipboardStore';
import type { ClipboardItem } from '../../shared/types';

const { Paragraph } = Typography;

function fmtTime(dateStr: string): string {
  const now = Date.now();
  const then = +new Date(dateStr.replace(' ', 'T') + (dateStr.includes('+') ? '' : '+08:00'));
  const diff = now - then;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '时前';
  return dateStr.substring(0, 10);
}

function gist(item: ClipboardItem, max = 55): string {
  if (item.content_type === 'image') return '[图片]';
  return item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max);
}

function itemBg(item: ClipboardItem): string {
  if (item.is_pinned) return 'rgba(255,77,79,0.07)';
  if (item.is_favorite) return 'rgba(250,173,20,0.08)';
  return 'transparent';
}

const QuickPick: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<any>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const { items, setItems, addItem, loading, setLoading } = useClipboardStore();

  const loadItems = useCallback(async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getHistory({ limit: 50 });
      setItems(data as ClipboardItem[]);
    } catch (e) {
      console.error('loadItems:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 挂载 + quickpick:opened 事件
  useEffect(() => {
    loadItems();
    const unsub = window.electronAPI?.onQuickPickOpened(() => loadItems());
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => unsub?.();
  }, []);

  // 新条目
  useEffect(() => {
    const unsub = window.electronAPI?.onNewItem((item: unknown) => {
      addItem(item as ClipboardItem);
    });
    return () => unsub?.();
  }, []);

  // 跨窗口同步：监听 toggle 事件
  useEffect(() => {
    const unsub = window.electronAPI?.onItemUpdated((item: unknown) => {
      const updated = item as ClipboardItem;
      const cur = useClipboardStore.getState().items;
      useClipboardStore.setState({ items: cur.map((it) => (it.id === updated.id ? updated : it)) });
    });
    return () => unsub?.();
  }, []);

  const filtered = searchText
    ? items.filter((it) => {
        const t = it.content_type === 'image' ? '' : it.content.replace(/<[^>]+>/g, ' ');
        return t.toLowerCase().includes(searchText.toLowerCase());
      })
    : items;

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); break;
        case 'ArrowUp': e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIdx]) handleCopy(filtered[selectedIdx]);
          break;
        case 'Escape': window.electronAPI?.hideWindow(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, selectedIdx]);

  const handleCopy = async (item: ClipboardItem) => {
    try {
      await window.electronAPI?.copyToClipboard(item.id);
    } catch (e) {
      console.error('copyToClipboard:', e);
    }
    window.electronAPI?.hideWindow();
  };

  const handleFav = (item: ClipboardItem) => {
    const optimistic = { ...item, is_favorite: item.is_favorite ? 0 : 1 } as ClipboardItem;
    const cur = useClipboardStore.getState().items;
    useClipboardStore.setState({ items: cur.map((it) => (it.id === item.id ? optimistic : it)) });
    forceUpdate();
    window.electronAPI?.toggleFavorite(item.id);
  };

  const handlePin = (item: ClipboardItem) => {
    const optimistic = { ...item, is_pinned: item.is_pinned ? 0 : 1 } as ClipboardItem;
    const cur = useClipboardStore.getState().items;
    useClipboardStore.setState({ items: cur.map((it) => (it.id === item.id ? optimistic : it)) });
    forceUpdate();
    window.electronAPI?.togglePin(item.id);
  };

  return (
    <div className="quickpick-container">
      <div className="quickpick-header">
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: '#999', fontSize: 12 }} />}
          placeholder="搜索..."
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setSelectedIdx(0); }}
          variant="borderless"
          size="small"
          style={{ fontSize: 13 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 10px 4px' }}>
          <span style={{ fontSize: 10, color: '#999' }}>
            {filtered.length} 条 · ↑↓ Enter Esc
          </span>
          <ReloadOutlined
            style={{ fontSize: 11, color: '#999', cursor: 'pointer' }}
            onClick={() => loadItems()}
          />
        </div>
      </div>

      <div className="quickpick-list">
        <List
          loading={loading}
          dataSource={filtered}
          renderItem={(item, idx) => {
            const sel = idx === selectedIdx;
            return (
              <div
                className={`quickpick-item ${sel ? 'selected' : ''}`}
                style={{ background: sel ? undefined : itemBg(item) }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.item-actions')) return;
                  handleCopy(item);
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <div className="item-content">
                  <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12, lineHeight: '18px' }}>
                    {gist(item) || '(空)'}
                  </Paragraph>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#999' }}>{fmtTime(item.created_at)}</span>
                    {item.source_app && item.source_app !== 'Unknown' && (
                      <Tag style={{ fontSize: 9, lineHeight: '14px', padding: '0 3px', margin: 0 }}>{item.source_app.substring(0, 10)}</Tag>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  <span onClick={() => handleFav(item)} title={item.is_favorite ? '取消收藏' : '收藏'} style={{ cursor: 'pointer' }}>
                    {item.is_favorite
                      ? <StarFilled style={{ fontSize: 14, color: '#faad14' }} />
                      : <StarOutlined style={{ fontSize: 14, color: '#999' }} />}
                  </span>
                  <span onClick={() => handlePin(item)} title={item.is_pinned ? '取消置顶' : '置顶'} style={{ cursor: 'pointer' }}>
                    {item.is_pinned
                      ? <PushpinFilled style={{ fontSize: 14, color: '#ff4d4f' }} />
                      : <PushpinOutlined style={{ fontSize: 14, color: '#999' }} />}
                  </span>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default QuickPick;
