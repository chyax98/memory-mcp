import Database from 'better-sqlite3';
import { Migration } from './types.js';
import { DatabaseOptimizer } from '../database-optimizer.js';

/**
 * Migration 002: Add JSON metadata columns for future extensibility
 * Adds metadata columns to both memories and relationships tables
 */
export const migration002: Migration = {
  version: 2,
  description: 'Add JSON metadata for extensibility',
  up: (db: Database.Database) => {
    // Add metadata column to memories table
    try {
      db.exec(`ALTER TABLE memories ADD COLUMN metadata TEXT DEFAULT '{}'`);
    } catch (error: any) {
      // Column might already exist
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // Add metadata column to relationships table
    try {
      db.exec(`ALTER TABLE relationships ADD COLUMN metadata TEXT DEFAULT '{}'`);
    } catch (error: any) {
      // Column might already exist
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // Record this migration
    const now = new Date().toISOString();
    db.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(2, now);

    // Update version in pragma for quick access
    DatabaseOptimizer.setVersion(db, 2);
  }
};