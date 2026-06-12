/**
 * History Clipboard — 主窗口
 * @version 1.7
 * @date 2026-06-13
 *
 * 修订记录：
 *   v1.7  2026-06-13  WorkBuddy  新增删除按钮 + 右键上下文菜单（收藏/置顶/删除）
 *   v1.6  2026-06-12  WorkBuddy  CSS 类化重构：inline styles → 语义化 CSS 类 + 暗色主题适配
 *   v1.5  2026-06-12  WorkBuddy  i18n 接入：useTranslation + 所有硬编码中文替换为 t() 调用
 *   v1.4  2026-06-11  WorkBuddy  列表始终显示置顶/收藏图标、selected 同步更新
 *   v1.3  2026-06-11  WorkBuddy  2Tab 剪切板/收藏、置顶始终最上、背景色区分
 *   v1.2  2026-06-11  WorkBuddy  统计从 items 派生、修复滚动条
 *   v1.1  2026-06-11  WorkBuddy  添加 onNewItem 监听
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Typography, Button, Popconfirm, App as AntApp, Tooltip } from 'antd';
import {
  SearchOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled,
  DeleteOutlined, CopyOutlined, ClearOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useClipboardStore } from '../stores/clipboardStore';
import i18n from '../i18n';
import type { ClipboardItem } from '../../shared/types';

const { Text, Paragraph } = Typography;

function fmtTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = +new Date(dateStr.replace(' ', 'T') + (dateStr.includes('+') ? '' : '+08:00'));
  if (isNaN(then)) return dateStr.substring(0, 10);
  const diff = now - then;
  if (diff < 60000) return i18n.t('quickpick.justNow');
  if (diff < 3600000) return Math.floor(diff / 60000) + i18n.t('quickpick.minAgo', { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return Math.floor(diff / 3600000) + i18n.t('quickpick.hourAgo', { n: Math.floor(diff / 3600000) });
  return dateStr.substring(0, 10);
}

function gist(item: ClipboardItem, len = 40): string {
  if (item.content_type === 'image') return i18n.t('quickpick.image');
  return item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, len);
}

/** 返回列表项的附加 CSS 类名（置顶/收藏 → pinned/favorite） */
function itemClass(item: ClipboardItem): string {
  if (item.is_pinned) return 'pinned';
  if (item.is_favorite) return 'favorite';
  return '';
}

const TAB_CLIPBOARD = 'clipboard';
const TAB_FAVORITES = 'favorites';

const MainWindow: React.FC = () => {
  const { t } = useTranslation();
  const { items, setItems, addItem, loading, setLoading } = useClipboardStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(TAB_CLIPBOARD);
  const [selected, setSelected] = useState<ClipboardItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean; x: number; y: number; item: ClipboardItem | null;
  }>({ visible: false, x: 0, y: 0, item: null });

  const load = useCallback(async (silent = false) => {
    if (!window.electronAPI) {
      // API 未就绪，等 200ms 重试一次
      setTimeout(() => load(silent), 200);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await window.electronAPI.getHistory({ limit: 500 });
      if (data) setItems(data as ClipboardItem[]);
    } catch (e) {
      console.error('MainWindow load error:', e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

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

  const stats = useMemo(() => ({
    total: items.length,
    favorites: items.filter((i) => i.is_favorite).length,
    pinned: items.filter((i) => i.is_pinned).length,
  }), [items]);

  // 列表：收藏Tab只看收藏；剪切板Tab = 置顶(始终在最上) + 历史
  const listData = useMemo(() => {
    let f = [...items];
    if (tab === TAB_FAVORITES) {
      f = f.filter((it) => it.is_favorite);
    }
    if (search) {
      f = f.filter((it) => gist(it).toLowerCase().includes(search.toLowerCase()));
    }
    // 置顶始终在最上面
    f.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.id - a.id;
    });
    return f;
  }, [items, tab, search]);

  const handleCopy = async (item: ClipboardItem) => {
    try { await window.electronAPI?.copyToClipboard(item.id); } catch (e) { console.error(e); }
  };

  const handleFav = async (item: ClipboardItem) => {
    const updated = await window.electronAPI?.toggleFavorite(item.id);
    if (updated) {
      const cur = useClipboardStore.getState().items;
      useClipboardStore.setState({ items: cur.map((it) => (it.id === item.id ? (updated as ClipboardItem) : it)) });
      if (selected?.id === item.id) setSelected(updated as ClipboardItem);
    }
  };

  const handlePin = async (item: ClipboardItem) => {
    const updated = await window.electronAPI?.togglePin(item.id);
    if (updated) {
      const cur = useClipboardStore.getState().items;
      useClipboardStore.setState({ items: cur.map((it) => (it.id === item.id ? (updated as ClipboardItem) : it)) });
      if (selected?.id === item.id) setSelected(updated as ClipboardItem);
    }
  };

  const handleDelete = async (id: number) => {
    await window.electronAPI?.deleteItem(id);
    setItems(items.filter((it) => it.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, item: ClipboardItem) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item });
  };
  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, item: null });

  const handleClear = async () => {
    await window.electronAPI?.clearAll();
    load();
    setSelected(null);
  };

  const tabs = [
    { key: TAB_CLIPBOARD, label: t('main.tabClipboard'), count: stats.total },
    { key: TAB_FAVORITES, label: t('main.tabFavorites'), count: stats.favorites },
  ];

  return (
    <AntApp>
      <div className="mw-layout">
        {/* 左侧栏 */}
        <div className="mw-sidebar">
          {/* 搜索 + Tab */}
          <div className="mw-sidebar-header">
            <Input
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              placeholder={t('main.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small" allowClear
            />
            <div className="mw-tab-bar">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`mw-tab-btn${tab === t.key ? ' active' : ''}`}
                  onClick={() => { setTab(t.key); setSelected(null); }}
                >
                  {t.label} <span className="mw-tab-count">{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 列表 */}
          <div className="mw-list">
            {listData.length === 0 ? (
              <div className="mw-list-empty">
                {tab === TAB_FAVORITES ? t('main.noFavorites') : t('main.noData')}
              </div>
            ) : (
              listData.map((item) => {
                const sel = selected?.id === item.id;
                const cls = ['mw-list-item', sel ? 'active' : '', itemClass(item)]
                  .filter(Boolean).join(' ');
                return (
                  <div key={item.id} className={cls} onClick={() => setSelected(item)} onContextMenu={(e) => handleContextMenu(e, item)}>
                    <div className="mw-item-text">
                      {gist(item, 35) || i18n.t('quickpick.empty')}
                    </div>
                    <div className="mw-item-meta">
                      <span className="mw-item-time">{fmtTime(item.created_at)}</span>
                      <span className="mw-item-actions" onClick={(e) => e.stopPropagation()}>
                        <span onClick={() => handlePin(item)}>
                          {item.is_pinned
                            ? <PushpinFilled style={{ color: '#ff4d4f', fontSize: 12 }} />
                            : <PushpinOutlined style={{ color: '#bbb', fontSize: 12 }} />}
                        </span>
                        <span onClick={() => handleFav(item)}>
                          {item.is_favorite
                            ? <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                            : <StarOutlined style={{ color: '#bbb', fontSize: 12 }} />}
                        </span>
                        <span onClick={() => handleDelete(item.id)}>
                          <DeleteOutlined style={{ color: '#bbb', fontSize: 12, cursor: 'pointer' }} />
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 底部按钮 */}
          <div className="mw-footer">
            <Popconfirm title={t('main.clearConfirm')} onConfirm={handleClear}>
              <Button size="small" icon={<ClearOutlined />} danger block>{t('main.clearAll')}</Button>
            </Popconfirm>
            <Button size="small" icon={<ReloadOutlined />} loading={refreshing} onClick={() => { setRefreshing(true); load(); }} />
          </div>
        </div>

        {/* 右侧详情 */}
        <div className="mw-detail">
          {selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="mw-detail-header">
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {selected.created_at} | {selected.source_app || 'Unknown'}
                </Text>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Tooltip title={selected.is_favorite ? t('main.unfavorite') : t('main.favorite')}>
                    <Button size="small" type="text" icon={selected.is_favorite ? <StarFilled style={{ color: '#faad14', fontSize: 14 }} /> : <StarOutlined style={{ fontSize: 14 }} />} onClick={() => handleFav(selected)} />
                  </Tooltip>
                  <Tooltip title={selected.is_pinned ? t('main.unpin') : t('main.pin')}>
                    <Button size="small" type="text" icon={selected.is_pinned ? <PushpinFilled style={{ color: '#ff4d4f', fontSize: 14 }} /> : <PushpinOutlined style={{ fontSize: 14 }} />} onClick={() => handlePin(selected)} />
                  </Tooltip>
                  <Tooltip title={t('main.copy')}>
                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(selected)} />
                  </Tooltip>
                  <Popconfirm title={t('main.deleteConfirm')} onConfirm={() => handleDelete(selected.id)}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
              <div className="mw-detail-body">
                <Paragraph copyable ellipsis={{ rows: 20, expandable: true }} style={{ fontSize: 13 }}>
                  {selected.content_type === 'image' ? i18n.t('quickpick.image') : selected.content.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ')}
                </Paragraph>
              </div>
            </div>
          ) : (
            <div className="mw-detail-empty">
              <div style={{ textAlign: 'center' }}>
                <div className="mw-empty-icon">📋</div>
                <div className="mw-empty-hint">{t('main.selectHint')}</div>
                <div className="mw-empty-stats">
                  {t('main.stats.total')} {stats.total} · {t('main.stats.pin')} {stats.pinned} · {t('main.stats.fav')} {stats.favorites}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.item && (
        <div className="context-menu-overlay" onClick={closeContextMenu}>
          <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <div className="context-menu-item" onClick={() => { handleFav(contextMenu.item!); closeContextMenu(); }}>
              {contextMenu.item.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              <span>{contextMenu.item.is_favorite ? t('main.unfavorite') : t('main.favorite')}</span>
            </div>
            <div className="context-menu-item" onClick={() => { handlePin(contextMenu.item!); closeContextMenu(); }}>
              {contextMenu.item.is_pinned ? <PushpinFilled style={{ color: '#ff4d4f' }} /> : <PushpinOutlined />}
              <span>{contextMenu.item.is_pinned ? t('main.unpin') : t('main.pin')}</span>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item danger" onClick={() => { handleDelete(contextMenu.item!.id); closeContextMenu(); }}>
              <DeleteOutlined />
              <span>{t('main.delete')}</span>
            </div>
          </div>
        </div>
      )}
    </AntApp>
  );
};

export default MainWindow;
