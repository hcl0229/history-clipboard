/**
 * History Clipboard — QuickPick 浮窗
 * @version 2.5
 * @date 2026-06-13
 * @description 原生 div 列表渲染；新增删除按钮 + 右键菜单（收藏/置顶/删除）
 *
 * 修订记录：
 *   v2.5  2026-06-13  WorkBuddy  新增删除按钮 + 右键上下文菜单
 *   v2.4  2026-06-12  WorkBuddy  i18n 接入：useTranslation + 所有硬编码中文替换为 t() 调用
 *   v2.3  2026-06-12  WorkBuddy  B9 最终修复：放弃所有局部状态更新，直接 loadItems() 全量 DB 刷新
 *   v2.2  2026-06-11  WorkBuddy  尝试 await IPC 返回值 + setRenderItems（失败：不触发重渲染）
 *   v2.1  2026-06-11  WorkBuddy  尝试 useState 渲染源 + 乐观更新（失败：广播竞态）
 *   v2.0  2026-06-11  WorkBuddy  重构：弃用 AD List/Paragraph，原生 div + CSS line-clamp
 *   v1.2  2026-06-11  WorkBuddy  乐观更新、forceUpdate 刷新、事件代理修复
 *   v1.1  2026-06-11  WorkBuddy  修复 Zustand setItems 函数式更新问题
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Tag } from 'antd';
import type { InputRef } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import i18n from '../i18n';
import type { ClipboardItem } from '../../shared/types';

function fmtTime(dateStr: string): string {
  const now = Date.now();
  const then = +new Date(dateStr.replace(' ', 'T') + (dateStr.includes('+') ? '' : '+08:00'));
  const diff = now - then;
  if (diff < 60000) return i18n.t('quickpick.justNow');
  if (diff < 3600000) return Math.floor(diff / 60000) + i18n.t('quickpick.minAgo', { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return Math.floor(diff / 3600000) + i18n.t('quickpick.hourAgo', { n: Math.floor(diff / 3600000) });
  return dateStr.substring(0, 10);
}

function gist(item: ClipboardItem, max = 55): string {
  if (item.content_type === 'image') return i18n.t('quickpick.image');
  return item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max);
}

function itemBg(item: ClipboardItem): string {
  if (item.is_pinned) return 'rgba(255,77,79,0.07)';
  if (item.is_favorite) return 'rgba(250,173,20,0.08)';
  return 'transparent';
}

const QuickPick: React.FC = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<InputRef>(null);

  // 渲染状态
  const [renderItems, setRenderItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean; x: number; y: number; item: ClipboardItem | null;
  }>({ visible: false, x: 0, y: 0, item: null });

  const loadItems = useCallback(async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getHistory({ limit: 50 });
      setRenderItems((data as ClipboardItem[]) ?? []);
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

  const handleDelete = async (item: ClipboardItem) => {
    await window.electronAPI?.deleteItem(item.id);
    setRenderItems((prev) => prev.filter((it) => it.id !== item.id));
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, item: ClipboardItem) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, item: null });

  // 全局点击关闭右键菜单
  useEffect(() => {
    if (!contextMenu.visible) return;
    const close = () => setContextMenu({ visible: false, x: 0, y: 0, item: null });
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu.visible]);

  /**
   * 收藏切换
   *
   * 设计决策（v2.3）：放弃所有局部状态更新方案（乐观更新、setRenderItems、Zustand setState），
   * 直接调用 loadItems() 从 DB 全量重新加载。这是已验证可工作的唯一路径（刷新按钮即用此逻辑）。
   *
   * 备选架构：若后续需要优化性能，可考虑 QuickPick 复用 MainWindow 的 Zustand store 订阅模式，
   * 通过 IPC 同步 store 而非各自维护独立状态。当前方案优先保证功能正确性。
   */
  const handleFav = async (item: ClipboardItem) => {
    await window.electronAPI?.toggleFavorite(item.id);
    await loadItems();
  };

  /**
   * 置顶切换 — 同 handleFav 策略
   */
  const handlePin = async (item: ClipboardItem) => {
    await window.electronAPI?.togglePin(item.id);
    await loadItems();
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
          placeholder={t('quickpick.search')}
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
          <span style={{ fontSize: 10, color: '#999' }}>{t('quickpick.stats', { count: filtered.length })}</span>
          <ReloadOutlined
            style={{ fontSize: 11, color: '#999', cursor: 'pointer' }}
            onClick={() => loadItems()}
          />
        </div>
      </div>

      <div className="quickpick-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>
            {t('quickpick.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>
            {t('quickpick.noRecords')}
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
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                {/* 点击内容区 → 复制；点击图标区 → 收藏/置顶；互不干扰 */}
                <div className="item-content" onClick={() => handleCopy(item)}>
                  <div className="item-text">{gist(item) || i18n.t('quickpick.empty')}</div>
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
                  <span onClick={() => handleFav(item)} title={item.is_favorite ? t('quickpick.unfavorite') : t('quickpick.favorite')} style={{ cursor: 'pointer' }}>
                    {item.is_favorite
                      ? <StarFilled style={{ fontSize: 14, color: '#faad14' }} />
                      : <StarOutlined style={{ fontSize: 14, color: '#999' }} />}
                  </span>
                  <span onClick={() => handlePin(item)} title={item.is_pinned ? t('quickpick.unpin') : t('quickpick.pin')} style={{ cursor: 'pointer' }}>
                    {item.is_pinned
                      ? <PushpinFilled style={{ fontSize: 14, color: '#ff4d4f' }} />
                      : <PushpinOutlined style={{ fontSize: 14, color: '#999' }} />}
                  </span>
                  <span onClick={() => handleDelete(item)} title={t('main.delete')} style={{ cursor: 'pointer' }}>
                    <DeleteOutlined style={{ fontSize: 14, color: '#999' }} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.item && (
        <div
          className="context-menu-overlay"
          onClick={closeContextMenu}
        >
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="context-menu-item" onClick={() => { handleFav(contextMenu.item!); closeContextMenu(); }}>
              {contextMenu.item.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              <span>{contextMenu.item.is_favorite ? t('quickpick.unfavorite') : t('quickpick.favorite')}</span>
            </div>
            <div className="context-menu-item" onClick={() => { handlePin(contextMenu.item!); closeContextMenu(); }}>
              {contextMenu.item.is_pinned ? <PushpinFilled style={{ color: '#ff4d4f' }} /> : <PushpinOutlined />}
              <span>{contextMenu.item.is_pinned ? t('quickpick.unpin') : t('quickpick.pin')}</span>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item danger" onClick={() => { handleDelete(contextMenu.item!); closeContextMenu(); }}>
              <DeleteOutlined />
              <span>{t('main.delete')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickPick;
