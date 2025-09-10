import Database from 'better-sqlite3';
import { debugLog } from '../utils/debug.js';

/**
 * Database optimization utilities for SQLite performance tuning and version tracking
 */
export class DatabaseOptimizer {
  /**
   * Apply performance optimizations to SQLite database
   */
  static applyOptimizations(db: Database.Database): void {
    // === Performance Optimizations ===
    
    // Enable Write-Ahead Logging (WAL) for better concurrency
    // WAL allows readers and writers to work simultaneously
    db.pragma('journal_mode = WAL');
    
    // Set cache size to 64MB (negative value = KB)
    // Larger cache = fewer disk reads = faster queries
    db.pragma('cache_size = -64000');
    
    // Store temporary tables in memory instead of disk
    // Speeds up complex queries that use temp tables
    db.pragma('temp_store = MEMORY');
    
    // Balance between safety and speed
    // NORMAL = safe but faster than FULL synchronous mode
    db.pragma('synchronous = NORMAL');
    
    // === Data Integrity ===
    
    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // === Version Tracking ===
    
    // Set application ID to identify this as a Memory Server database
    // This helps prevent accidental opening with wrong tools
    db.pragma('application_id = 0x4D454D53'); // 'MEMS' in hex
    
    // Note: user_version will be managed by DatabaseMigrator
    // We don't set an initial version here to avoid conflicts
    
    const currentVersion = db.pragma('user_version', { simple: true }) as number;
    debugLog('DatabaseOptimizer: Applied optimizations, current version:', currentVersion);
  }
  
  /**
   * Optimize FTS5 index periodically
   */
  static optimizeFTS(db: Database.Database): void {
    // Optimize FTS5 index periodically
    // Merges b-tree segments for better search performance
    try {
      db.exec(`INSERT INTO memories_fts(memories_fts) VALUES('optimize')`);
      debugLog('DatabaseOptimizer: FTS optimization completed');
    } catch (error: any) {
      // FTS table might not exist yet
      debugLog('DatabaseOptimizer: FTS optimization skipped:', error.message);
    }
  }
  
  /**
   * Get database version quickly using pragma (no table queries needed)
   */
  static getQuickVersion(db: Database.Database): number {
    // Ultra-fast version check using pragma
    return db.pragma('user_version', { simple: true }) as number;
  }
  
  /**
   * Update database version in pragma
   */
  static setVersion(db: Database.Database, version: number): void {
    db.pragma(`user_version = ${version}`);
    debugLog('DatabaseOptimizer: Updated version to:', version);
  }
  
  /**
   * Get performance statistics (optional monitoring)
   */
  static getPerformanceStats(db: Database.Database): any {
    try {
      const stats = {
        cacheSize: db.pragma('cache_size', { simple: true }),
        journalMode: db.pragma('journal_mode', { simple: true }),
        synchronous: db.pragma('synchronous', { simple: true }),
        tempStore: db.pragma('temp_store', { simple: true }),
        userVersion: db.pragma('user_version', { simple: true }),
        applicationId: db.pragma('application_id', { simple: true })
      };
      return stats;
    } catch (error: any) {
      debugLog('DatabaseOptimizer: Could not get performance stats:', error.message);
      return null;
    }
  }
}