/**
 * History Clipboard — QuickPick 浮窗
 * @version 2.1
 * @date 2026-06-11
 * @description 原生 div 列表渲染，React useState 管理渲染状态，Zustand store 仅做跨窗口同步
 *
 * 修订记录：
 *   v2.1  2026-06-11  WorkBuddy  B9 修复：用 useState 作渲染源替代直接 setState，保证 React 重渲染
 *   v2.0  2026-06-11  WorkBuddy  重构：弃用 AD List/Paragraph，原生 div + CSS line-clamp
 *   v1.2  2026-06-11  WorkBuddy  乐观更新、forceUpdate 刷新、事件代理修复
 *   v1.1  2026-06-11  WorkBuddy  修复 Zustand setItems 函数式更新问题
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input, Tag } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled, ReloadOutlined } from '@ant-design/icons';
import { useClipboardStore } from '../stores/clipboardStore';
import type { ClipboardItem } from '../../shared/types';

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

  // ================================================================
  // 渲染状态：本地 useState 管理，React 原生 setState 保证重渲染
  // Zustand store 仅作为数据源，不直接用于渲染
  // ================================================================
  const [renderItems, setRenderItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 从 store 拉取最新数据并同步到本地渲染状态
  const syncFromStore = useCallback(() => {
    const storeItems = useClipboardStore.getState().items;
    setRenderItems(storeItems);
  }, []);

  const loadItems = useCallback(async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getHistory({ limit: 50 });
      const list = data as ClipboardItem[];
      // 先更新 store（供 MainWindow 等使用）
      useClipboardStore.setState({ items: list, loading: false });
      // 再更新本地渲染状态 → 保证 React 重渲染
      setRenderItems(list);
    } catch (e) {
      console.error('loadItems:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 挂载 + quickpick:opened 事件 → 重新拉取
  useEffect(() => {
    loadItems();
    const unsub = window.electronAPI?.onQuickPickOpened(() => loadItems());
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => unsub?.();
  }, []);

  // 新条目推送 → 追加到本地渲染状态（插入到列表头部）
  useEffect(() => {
    const unsub = window.electronAPI?.onNewItem((item: unknown) => {
      const newItem = item as ClipboardItem;
      setRenderItems((prev) => [newItem, ...prev]);
    });
    return () => unsub?.();
  }, []);

  // 跨窗口同步：其他窗口 toggle 后主进程广播 itemUpdated
  // 这里更新本地渲染状态，保持与 MainWindow 一致
  useEffect(() => {
    const unsub = window.electronAPI?.onItemUpdated((item: unknown) => {
      const updated = item as ClipboardItem;
      setRenderItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    });
    return () => unsub?.();
  }, []);

  // 搜索过滤
  const filtered = searchText
    ? renderItems.filter((it) => {
        const t = it.content_type === 'image' ? '' : it.content.replace(/<[^>]+>/g, ' ');
        return t.toLowerCase().includes(searchText.toLowerCase());
      })
    : renderItems;

  // 键盘导航
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIdx((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIdx]) handleCopy(filtered[selectedIdx]);
          break;
        case 'Escape':
          window.electronAPI?.hideWindow();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, selectedIdx]);

  //
  // ─── 操作处理器 ────────────────────────────────────────────
  //

  const handleCopy = async (item: ClipboardItem) => {
    try {
      await window.electronAPI?.copyToClipboard(item.id);
    } catch (e) {
      console.error('copyToClipboard:', e);
    }
    window.electronAPI?.hideWindow();
  };

  /**
   * 收藏切换（乐观更新）
   *
   * 关键：直接用 setRenderItems(prev => ...) 更新本地渲染状态。
   * React 的 useState setter 100% 触发重渲染，不依赖 Zustand 订阅机制。
   * 同时更新 Zustand store（内存中），供下一次 loadItems 或其他窗口读取。
   */
  const handleFav = (item: ClipboardItem) => {
    const optimistic = { ...item, is_favorite: item.is_favorite ? 0 : 1 } as ClipboardItem;

    // 1. 本地渲染状态立即更新 → React 保证重渲染
    setRenderItems((prev) => prev.map((it) => (it.id === item.id ? optimistic : it)));

    // 2. 同步更新 Zustand store（供其他模块读取最新状态）
    const storeCur = useClipboardStore.getState().items;
    useClipboardStore.setState({ items: storeCur.map((it) => (it.id === item.id ? optimistic : it)) });

    // 3. 异步通知主进程 → DB 写入 → 广播其他窗口
    window.electronAPI?.toggleFavorite(item.id);
  };

  /**
   * 置顶切换（乐观更新）
   * 原理同 handleFav
   */
  const handlePin = (item: ClipboardItem) => {
    const optimistic = { ...item, is_pinned: item.is_pinned ? 0 : 1 } as ClipboardItem;

    setRenderItems((prev) => prev.map((it) => (it.id === item.id ? optimistic : it)));

    const storeCur = useClipboardStore.getState().items;
    useClipboardStore.setState({ items: storeCur.map((it) => (it.id === item.id ? optimistic : it)) });

    window.electronAPI?.togglePin(item.id);
  };

  //
  // ─── 渲染 ──────────────────────────────────────────────────
  //

  return (
    <div className="quickpick-container">
      {/* 拖拽手柄：比 header 更宽的区域方便鼠标抓取 */}
      <div className="quickpick-drag-handle" />

      <div className="quickpick-header">
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: '#999', fontSize: 12 }} />}
          placeholder="搜索..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setSelectedIdx(0);
          }}
          variant="borderless"
          size="small"
          style={{ fontSize: 13 }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2px 10px 4px',
          }}
        >
          <span style={{ fontSize: 10, color: '#999' }}>{filtered.length} 条 · ↑↓ Enter Esc</span>
          <ReloadOutlined
            style={{ fontSize: 11, color: '#999', cursor: 'pointer' }}
            onClick={() => loadItems()}
          />
        </div>
      </div>

      <div className="quickpick-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>
            加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>
            无记录
          </div>
        ) : (
          filtered.map((item, idx) => {
            const sel = idx === selectedIdx;
            return (
              <div
                key={item.id ?? idx}
                className={`quickpick-item ${sel ? 'selected' : ''}`}
                style={{ background: sel ? undefined : itemBg(item) }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                {/* 点击内容区 → 复制；点击图标区 → 收藏/置顶；互不干扰 */}
                <div className="item-content" onClick={() => handleCopy(item)}>
                  <div className="item-text">{gist(item) || '(空)'}</div>
                  <div className="item-meta">
                    <span className="item-time">{fmtTime(item.created_at)}</span>
                    {item.source_app && item.source_app !== 'Unknown' && (
                      <Tag
                        style={{
                          fontSize: 9,
                          lineHeight: '14px',
                          padding: '0 3px',
                          margin: 0,
                        }}
                      >
                        {item.source_app.substring(0, 10)}
                      </Tag>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  <span
                    onClick={() => handleFav(item)}
                    title={item.is_favorite ? '取消收藏' : '收藏'}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.is_favorite ? (
                      <StarFilled style={{ fontSize: 14, color: '#faad14' }} />
                    ) : (
                      <StarOutlined style={{ fontSize: 14, color: '#999' }} />
                    )}
                  </span>
                  <span
                    onClick={() => handlePin(item)}
                    title={item.is_pinned ? '取消置顶' : '置顶'}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.is_pinned ? (
                      <PushpinFilled style={{ fontSize: 14, color: '#ff4d4f' }} />
                    ) : (
                      <PushpinOutlined style={{ fontSize: 14, color: '#999' }} />
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuickPick;
