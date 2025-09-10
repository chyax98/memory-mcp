import Database from 'better-sqlite3';
import { Migration } from './types.js';
import { DatabaseOptimizer } from '../database-optimizer.js';

/**
 * Migration 001: Initial schema with memories, relationships, and FTS
 * This represents the current schema that exists in the codebase
 */
export const migration001: Migration = {
  version: 1,
  description: 'Initial schema with memories, relationships, and FTS',
  up: (db: Database.Database) => {
    // Create memories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        tags TEXT,
        created_at TEXT,
        hash TEXT UNIQUE
      )
    `);

    // Create relationships table for linking memories
    db.exec(`
      CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_memory_id INTEGER,
        to_memory_id INTEGER,
        relationship_type TEXT DEFAULT 'related',
        created_at TEXT,
        FOREIGN KEY (from_memory_id) REFERENCES memories (id) ON DELETE CASCADE,
        FOREIGN KEY (to_memory_id) REFERENCES memories (id) ON DELETE CASCADE,
        UNIQUE(from_memory_id, to_memory_id, relationship_type)
      )
    `);

    // Create FTS table for fast text search
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts 
      USING fts5(content, tags, content='memories', content_rowid='id')
    `);

    // Create trigger to automatically update FTS when memories are inserted
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts (rowid, content, tags) 
        VALUES (new.id, new.content, new.tags);
      END;
    `);

    // Create trigger to automatically update FTS when memories are updated
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        UPDATE memories_fts SET content = new.content, tags = new.tags 
        WHERE rowid = new.id;
      END;
    `);

    // Create trigger to automatically delete from FTS when memories are deleted
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.id;
      END;
    `);

    // Create migration tracking table
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);

    // Record this migration
    const now = new Date().toISOString();
    db.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(1, now);

    // Set version in pragma for quick access
    DatabaseOptimizer.setVersion(db, 1);
  }
};