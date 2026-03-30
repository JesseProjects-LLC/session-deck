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
  `);

  // Migration: add sort_order if missing (for existing DBs)
  try {
    db.prepare('SELECT sort_order FROM layout_presets LIMIT 1').get();
  } catch {
    db.exec('ALTER TABLE layout_presets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  }
}
