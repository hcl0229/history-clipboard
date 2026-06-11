/**
 * History Clipboard — 主窗口
 * @version 1.4
 * @date 2026-06-11
 *
 * 修订记录：
 *   v1.4  2026-06-11  WorkBuddy  列表始终显示置顶/收藏图标、selected 同步更新
 *   v1.3  2026-06-11  WorkBuddy  2Tab 剪切板/收藏、置顶始终最上、背景色区分
 *   v1.2  2026-06-11  WorkBuddy  统计从 items 派生、修复滚动条
 *   v1.1  2026-06-11  WorkBuddy  添加 onNewItem 监听
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Input, Typography, Button, Popconfirm, App as AntApp, Tooltip } from 'antd';
import {
  SearchOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled,
  DeleteOutlined, CopyOutlined, ClearOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useClipboardStore } from '../stores/clipboardStore';
import type { ClipboardItem } from '../../shared/types';

const { Text, Paragraph } = Typography;

function fmtTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = +new Date(dateStr.replace(' ', 'T') + (dateStr.includes('+') ? '' : '+08:00'));
  if (isNaN(then)) return dateStr.substring(0, 10);
  const diff = now - then;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '时前';
  return dateStr.substring(0, 10);
}

function gist(item: ClipboardItem, len = 40): string {
  if (item.content_type === 'image') return '[图片]';
  return item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, len);
}

function itemBg(item: ClipboardItem): string {
  if (item.is_pinned) return 'rgba(255,77,79,0.07)';
  if (item.is_favorite) return 'rgba(250,173,20,0.08)';
  return 'transparent';
}

const TAB_CLIPBOARD = 'clipboard';
const TAB_FAVORITES = 'favorites';

const MainWindow: React.FC = () => {
  const { items, setItems, addItem, loading, setLoading } = useClipboardStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(TAB_CLIPBOARD);
  const [selected, setSelected] = useState<ClipboardItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleClear = async () => {
    await window.electronAPI?.clearAll();
    load();
    setSelected(null);
  };

  const tabs = [
    { key: TAB_CLIPBOARD, label: '剪切板', count: stats.total },
    { key: TAB_FAVORITES, label: '收藏', count: stats.favorites },
  ];

  return (
    <AntApp>
      <div style={{ height: '100vh', display: 'flex' }}>
        {/* 左侧栏 */}
        <div style={{ width: 260, background: '#fafafa', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
          {/* 搜索 + Tab */}
          <div style={{ padding: 8, flexShrink: 0 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              placeholder="搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small" allowClear
            />
            <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSelected(null); }}
                  style={{
                    flex: 1, padding: '4px 0', textAlign: 'center', fontSize: 12,
                    border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: tab === t.key ? '#1677ff' : 'transparent',
                    color: tab === t.key ? '#fff' : '#666',
                    fontWeight: tab === t.key ? 500 : 400,
                  }}
                >
                  {t.label} <span style={{ opacity: tab === t.key ? 0.8 : 0.5, fontSize: 11 }}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '2px 0', minHeight: 0 }}>
            {listData.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
                {tab === TAB_FAVORITES ? '暂无收藏' : '暂无数据，复制内容即可记录'}
              </div>
            ) : (
              listData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  style={{
                    padding: '6px 10px', margin: '1px 4px', borderRadius: 4, cursor: 'pointer',
                    borderLeft: selected?.id === item.id ? '3px solid #1677ff' : '3px solid transparent',
                    background: selected?.id === item.id ? 'rgba(22,119,255,0.12)' : itemBg(item),
                    fontSize: 12,
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gist(item, 35) || '(空)'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: '#999' }}>{fmtTime(item.created_at)}</span>
                    <span style={{ display: 'flex', gap: 3 }} onClick={(e) => e.stopPropagation()}>
                      <span onClick={() => handlePin(item)} style={{ cursor: 'pointer' }}>
                        {item.is_pinned
                          ? <PushpinFilled style={{ color: '#ff4d4f', fontSize: 12 }} />
                          : <PushpinOutlined style={{ color: '#bbb', fontSize: 12 }} />}
                      </span>
                      <span onClick={() => handleFav(item)} style={{ cursor: 'pointer' }}>
                        {item.is_favorite
                          ? <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                          : <StarOutlined style={{ color: '#bbb', fontSize: 12 }} />}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 底部按钮 */}
          <div style={{ padding: 6, display: 'flex', gap: 6, borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
            <Popconfirm title="确认清空？" onConfirm={handleClear}>
              <Button size="small" icon={<ClearOutlined />} danger block>清空</Button>
            </Popconfirm>
            <Button size="small" icon={<ReloadOutlined />} loading={refreshing} onClick={() => { setRefreshing(true); load(); }} />
          </div>
        </div>

        {/* 右侧详情 */}
        <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '6px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {selected.created_at} | {selected.source_app || 'Unknown'}
                </Text>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Tooltip title={selected.is_favorite ? '取消收藏' : '收藏'}>
                    <Button size="small" type="text" icon={selected.is_favorite ? <StarFilled style={{ color: '#faad14', fontSize: 14 }} /> : <StarOutlined style={{ fontSize: 14 }} />} onClick={() => handleFav(selected)} />
                  </Tooltip>
                  <Tooltip title={selected.is_pinned ? '取消置顶' : '置顶'}>
                    <Button size="small" type="text" icon={selected.is_pinned ? <PushpinFilled style={{ color: '#ff4d4f', fontSize: 14 }} /> : <PushpinOutlined style={{ fontSize: 14 }} />} onClick={() => handlePin(selected)} />
                  </Tooltip>
                  <Tooltip title="复制">
                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(selected)} />
                  </Tooltip>
                  <Popconfirm title="确认删除？" onConfirm={() => handleDelete(selected.id)}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
              <div style={{ flex: 1, padding: 10, overflow: 'auto' }}>
                <Paragraph copyable ellipsis={{ rows: 20, expandable: true }} style={{ fontSize: 13 }}>
                  {selected.content_type === 'image' ? '[图片]' : selected.content.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ')}
                </Paragraph>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#bbb' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
                <div style={{ fontSize: 12 }}>选择记录查看详情</div>
                <div style={{ fontSize: 10, marginTop: 6, lineHeight: 1.6 }}>
                  总计 {stats.total} · 置顶 {stats.pinned} · 收藏 {stats.favorites}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AntApp>
  );
};

export default MainWindow;
