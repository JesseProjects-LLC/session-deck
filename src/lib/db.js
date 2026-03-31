// src/lib/db.js — SQLite database initialization

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import config from './config.js';

let db;

/**
 * Get or create the database connection.
 * @returns {import('better-sqlite3').Database}
 */
export function getDb() {
  if (db) return db;

  // Ensure data directory exists
  mkdirSync(dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);

  // WAL mode for better concurrent reads
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  migrate(db);

  return db;
}

/**
 * Close the database connection. Call on shutdown.
 */
export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS layout_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      layout_json TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS host_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      host_names_json TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deploy_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      target_host TEXT NOT NULL,
      files_deployed TEXT NOT NULL,
      backup_path TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      error TEXT,
      deployed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (preset_id) REFERENCES layout_presets(id)
    );

    CREATE TABLE IF NOT EXISTS managed_hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      hostname TEXT NOT NULL,
      user TEXT,
      port INTEGER NOT NULL DEFAULT 22,
      identity_file TEXT,
      auth_method TEXT NOT NULL DEFAULT 'key',
      group_name TEXT NOT NULL DEFAULT 'Other',
      is_local INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      last_test_status TEXT,
      last_test_at TEXT,
      tmux_available INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6b7688',
      sort_order INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add sort_order if missing (for existing DBs)
  try {
    db.prepare('SELECT sort_order FROM layout_presets LIMIT 1').get();
  } catch {
    db.exec('ALTER TABLE layout_presets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  }

  // Seed default session types if empty
  const typeCount = db.prepare('SELECT COUNT(*) as c FROM session_types').get();
  if (typeCount.c === 0) {
    const seedTypes = db.prepare(
      'INSERT OR IGNORE INTO session_types (process_name, display_name, color, sort_order) VALUES (?, ?, ?, ?)'
    );
    const defaults = [
      ['claude', 'Claude Code', '#3d8bfd', 1],
      ['gsd', 'GSD', '#c792ea', 2],
      ['pi', 'GSD (pi)', '#c792ea', 3],
      ['bash', 'Bash', '#6b7688', 10],
      ['zsh', 'Zsh', '#6b7688', 11],
      ['fish', 'Fish', '#6b7688', 12],
      ['vim', 'Vim', '#98c379', 20],
      ['nvim', 'Neovim', '#98c379', 21],
      ['htop', 'htop', '#56b6c2', 30],
      ['top', 'top', '#56b6c2', 31],
      ['btop', 'btop', '#56b6c2', 32],
      ['python', 'Python', '#e5c07b', 40],
      ['python3', 'Python 3', '#e5c07b', 41],
      ['node', 'Node.js', '#98c379', 42],
      ['docker', 'Docker', '#61afef', 50],
      ['ssh', 'SSH', '#d19a66', 60],
      ['tail', 'tail (logs)', '#e06c75', 70],
      ['less', 'less', '#6b7688', 71],
      ['man', 'man', '#6b7688', 72],
    ];
    for (const [proc, name, color, order] of defaults) {
      seedTypes.run(proc, name, color, order);
    }
  }

  // Seed default accent color if not set
  const accentSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'accent_color'").get();
  if (!accentSetting) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('accent_color', '#F97316')").run();
  }

  // Workspace templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      layout_json TEXT NOT NULL,
      pane_count INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
