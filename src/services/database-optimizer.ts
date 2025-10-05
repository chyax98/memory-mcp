import Database from 'better-sqlite3';
import { debugLog } from '../utils/debug.js';

export class DatabaseOptimizer {
  /**
   * Apply SQLite performance optimizations
   * Safe to run multiple times (idempotent)
   */
  static applyOptimizations(db: Database.Database): void {
    // Enable Write-Ahead Logging for better concurrency
    // WAL allows readers and writers to work simultaneously
    db.pragma('journal_mode = WAL');
    
    // Larger cache = fewer disk reads = faster queries (64MB)
    db.pragma('cache_size = -64000');
    
    // Store temp tables in memory (faster)
    db.pragma('temp_store = MEMORY');
    
    // Balance between safety and speed
    db.pragma('synchronous = NORMAL');
    
    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');
    
    debugLog('Database optimizations applied');
  }
  
  /**
   * Optimize FTS5 index (run periodically or after bulk inserts)
   */
  static optimizeFTS(db: Database.Database): void {
    try {
      db.exec(`INSERT INTO memories_fts(memories_fts) VALUES('optimize')`);
      debugLog('FTS index optimized');
    } catch (error: any) {
      // FTS table might not exist yet, that's fine
      debugLog('FTS optimization skipped:', error.message);
    }
  }
}
