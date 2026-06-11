/**
 * History Clipboard — 数据库模块
 * @version 1.0
 * @date 2026-06-10
 * @description SQLite 初始化、迁移、CRUD、自动清理调度
 *
 * 修订记录：
 *   v1.0  2026-06-10  WorkBuddy  初始版本
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'clipboard.db');
}

// ==================== 初始化 ====================

export function initDatabase(): void {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS clipboard_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      content       TEXT    NOT NULL,
      content_type  TEXT    NOT NULL DEFAULT 'text',
      content_hash  TEXT    NOT NULL,
      source_app    TEXT,
      is_favorite   INTEGER NOT NULL DEFAULT 0,
      is_pinned     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_hash     ON clipboard_history(content_hash);
    CREATE INDEX IF NOT EXISTS idx_created  ON clipboard_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_favorite ON clipboard_history(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_pinned   ON clipboard_history(is_pinned);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS window_state (
      window_name TEXT PRIMARY KEY,
      x          INTEGER,
      y          INTEGER,
      width      INTEGER,
      height     INTEGER,
      maximized  INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 默认设置
  const defaults: Record<string, string> = {
    theme: 'light',
    accentColor: '#1677FF',
    fontSize: '14',
    retentionDays: '3',
    maxRecords: '1000',
    autoLaunch: 'false',
    hotkey: 'Ctrl+Shift+V',
  };
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)');
  for (const [k, v] of Object.entries(defaults)) insert.run(k, v);

  console.log('[Database] Initialized:', getDbPath());
}

export function closeDatabase(): void {
  db?.close();
  db = null;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// ==================== 剪贴板 CRUD ====================

export function getLastHash(): string | null {
  const row = getDb()
    .prepare('SELECT content_hash FROM clipboard_history ORDER BY id DESC LIMIT 1')
    .get() as { content_hash: string } | undefined;
  return row?.content_hash ?? null;
}

export function insertClipboardItem(content: string, type: string, hash: string, sourceApp: string | null): number {
  const result = getDb()
    .prepare(
      'INSERT INTO clipboard_history (content,content_type,content_hash,source_app) VALUES (?,?,?,?)',
    )
    .run(content, type, hash, sourceApp);
  return Number(result.lastInsertRowid);
}

export function getItemById(id: number) {
  return getDb().prepare('SELECT * FROM clipboard_history WHERE id = ?').get(id) ?? null;
}

export function getHistory(params: {
  limit?: number;
  offset?: number;
  type?: string;
  favorite?: boolean;
  pinned?: boolean;
}) {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.type) {
    conditions.push('content_type = ?');
    values.push(params.type);
  }
  if (params.favorite) {
    conditions.push('is_favorite = 1');
  }
  if (params.pinned) {
    conditions.push('is_pinned = 1');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return getDb()
    .prepare(
      `SELECT * FROM clipboard_history ${where}
       ORDER BY is_pinned DESC, is_favorite DESC, created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...values, limit, offset);
}

export function searchHistory(query: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT * FROM clipboard_history WHERE content LIKE ?
       ORDER BY is_pinned DESC, is_favorite DESC, created_at DESC LIMIT ?`,
    )
    .all(`%${query}%`, limit);
}

export function toggleFavorite(id: number) {
  getDb()
    .prepare(
      `UPDATE clipboard_history
       SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END,
           updated_at = datetime('now','localtime')
       WHERE id = ?`,
    )
    .run(id);
  return getItemById(id);
}

export function togglePin(id: number) {
  getDb()
    .prepare(
      `UPDATE clipboard_history
       SET is_pinned = CASE WHEN is_pinned=1 THEN 0 ELSE 1 END,
           updated_at = datetime('now','localtime')
       WHERE id = ?`,
    )
    .run(id);
  return getItemById(id);
}

export function deleteItem(id: number): void {
  getDb().prepare('DELETE FROM clipboard_history WHERE id = ?').run(id);
}

export function deleteMultiple(ids: number[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  getDb()
    .prepare(`DELETE FROM clipboard_history WHERE id IN (${placeholders})`)
    .run(...ids);
}

export function clearAll(): number {
  const result = getDb()
    .prepare('DELETE FROM clipboard_history WHERE is_favorite=0 AND is_pinned=0')
    .run();
  return result.changes;
}

export function getStats() {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as c FROM clipboard_history').get() as { c: number }).c;
  const fav = (db.prepare('SELECT COUNT(*) as c FROM clipboard_history WHERE is_favorite=1').get() as { c: number }).c;
  const pin = (db.prepare('SELECT COUNT(*) as c FROM clipboard_history WHERE is_pinned=1').get() as { c: number }).c;
  return { total, favorites: fav, pinned: pin };
}

// ==================== 自动清理 ====================

export function runCleanup(): number {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get('retentionDays') as
    | { value: string }
    | undefined;
  const days = parseInt(row?.value ?? '3', 10);
  const maxRecords = parseInt(
    (db.prepare('SELECT value FROM settings WHERE key=?').get('maxRecords') as { value: string } | undefined)
      ?.value ?? '1000',
    10,
  );

  // 按天数清理
  const result1 = db
    .prepare(
      `DELETE FROM clipboard_history
       WHERE is_favorite=0 AND is_pinned=0
         AND created_at < datetime('now','localtime','-${days} days')`,
    )
    .run();

  // 按数量清理
  const count = (db.prepare('SELECT COUNT(*) as c FROM clipboard_history').get() as { c: number }).c;
  if (count > maxRecords) {
    const excess = count - maxRecords;
    db.prepare(
      `DELETE FROM clipboard_history WHERE id IN (
         SELECT id FROM clipboard_history
         WHERE is_favorite=0 AND is_pinned=0
         ORDER BY created_at ASC LIMIT ?
       )`,
    ).run(excess);
  }

  const totalDeleted = result1.changes + (count > maxRecords ? count - maxRecords : 0);
  if (totalDeleted > 10) {
    console.log(`[Database] Cleanup: deleted ${totalDeleted} old records`);
  }
  return totalDeleted;
}

// ==================== 设置 ====================

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key=?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(key, value);
}

// ==================== 窗口状态 ====================

export function saveWindowState(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  maximized: boolean,
): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO window_state VALUES (?,?,?,?,?,?)')
    .run(name, x, y, width, height, maximized ? 1 : 0);
}

export function getWindowState(name: string) {
  return (
    (getDb().prepare('SELECT * FROM window_state WHERE window_name=?').get(name) as {
      x: number;
      y: number;
      width: number;
      height: number;
      maximized: number;
    } | undefined) ?? null
  );
}
