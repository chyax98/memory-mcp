import Database from 'better-sqlite3';
import { copyFile, access, readdir, stat, unlink } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { debugLog } from '../utils/debug.js';
import { DatabaseOptimizer } from './database-optimizer.js';
import { Migration, migration001, migration002 } from './migrations/index.js';

/**
 * Automatic database migration system
 * Handles schema evolution with zero user intervention
 */
export class DatabaseMigrator {
  private migrations: Migration[] = [
    migration001,
    migration002
  ];

  constructor(
    private db: Database.Database,
    private dbPath: string
  ) {}

  /**
   * Run automatic migration on startup
   * Creates backups, applies migrations, handles errors gracefully
   */
  async autoMigrate(): Promise<void> {
    try {
      debugLog('DatabaseMigrator: Starting automatic migration...');
      
      // Get current version quickly
      const currentVersion = DatabaseOptimizer.getQuickVersion(this.db);
      const latestVersion = Math.max(...this.migrations.map(m => m.version));
      
      debugLog(`DatabaseMigrator: Current version: ${currentVersion}, Latest: ${latestVersion}`);
      
      if (currentVersion >= latestVersion) {
        debugLog('DatabaseMigrator: Database is up to date');
        return;
      }

      // Create backup before migration
      await this.createBackup(currentVersion);
      
      // Apply migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          await this.applyMigration(migration);
        }
      }
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      debugLog('DatabaseMigrator: Migration completed successfully');
      
    } catch (error: any) {
      debugLog('DatabaseMigrator: Migration failed, but continuing:', error.message);
      // Never block server startup - graceful degradation
      // The server will continue to work with the existing schema
    }
  }

  /**
   * Apply a single migration with error handling
   */
  private async applyMigration(migration: Migration): Promise<void> {
    try {
      debugLog(`DatabaseMigrator: Applying migration ${migration.version}: ${migration.description}`);
      
      // Run migration in a transaction for safety
      this.db.transaction(() => {
        migration.up(this.db);
      })();
      
      debugLog(`DatabaseMigrator: Migration ${migration.version} completed`);
      
    } catch (error: any) {
      debugLog(`DatabaseMigrator: Migration ${migration.version} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Create backup before migration
   */
  private async createBackup(version: number): Promise<void> {
    try {
      const backupDir = join(dirname(this.dbPath), 'backups');
      
      // Create backup directory if it doesn't exist
      try {
        await access(backupDir);
      } catch {
        // Directory doesn't exist, but we'll create it when needed
        // Using copyFile will fail gracefully if we can't create the backup
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `memory-v${version}-${timestamp}.db`;
      const backupPath = join(backupDir, backupName);
      
      // Ensure backup directory exists
      const { mkdir } = await import('fs/promises');
      await mkdir(backupDir, { recursive: true });
      
      await copyFile(this.dbPath, backupPath);
      debugLog(`DatabaseMigrator: Backup created: ${backupName}`);
      
    } catch (error: any) {
      debugLog('DatabaseMigrator: Backup failed (migration will continue):', error.message);
      // Don't throw - backup failure shouldn't prevent migration
    }
  }

  /**
   * Clean up old backups (keep last 5)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = join(dirname(this.dbPath), 'backups');
      
      // Check if backup directory exists
      try {
        await access(backupDir);
      } catch {
        return; // No backup directory, nothing to clean
      }
      
      const files = await readdir(backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('memory-v') && f.endsWith('.db'))
        .map(async f => {
          const filepath = join(backupDir, f);
          const stats = await stat(filepath);
          return { name: f, path: filepath, mtime: stats.mtime };
        });
      
      const backups = await Promise.all(backupFiles);
      
      // Sort by modification time (newest first)
      backups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Remove all but the newest 5
      const toDelete = backups.slice(5);
      for (const backup of toDelete) {
        try {
          await unlink(backup.path);
          debugLog(`DatabaseMigrator: Cleaned up old backup: ${backup.name}`);
        } catch (error: any) {
          debugLog(`DatabaseMigrator: Failed to clean backup ${backup.name}:`, error.message);
        }
      }
      
    } catch (error: any) {
      debugLog('DatabaseMigrator: Backup cleanup failed:', error.message);
      // Don't throw - cleanup failure is not critical
    }
  }

  /**
   * Get applied migrations from database
   */
  getAppliedMigrations(): { version: number; appliedAt: string }[] {
    try {
      const stmt = this.db.prepare(`SELECT version, applied_at as appliedAt FROM schema_migrations ORDER BY version`);
      return stmt.all() as { version: number; appliedAt: string }[];
    } catch (error: any) {
      // Table might not exist yet
      debugLog('DatabaseMigrator: Could not get applied migrations:', error.message);
      return [];
    }
  }

  /**
   * Get migration status for diagnostics
   */
  getMigrationStatus(): {
    currentVersion: number;
    latestVersion: number;
    appliedMigrations: { version: number; appliedAt: string }[];
    pendingMigrations: Migration[];
  } {
    const currentVersion = DatabaseOptimizer.getQuickVersion(this.db);
    const latestVersion = Math.max(...this.migrations.map(m => m.version));
    const appliedMigrations = this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    const pendingMigrations = this.migrations.filter(m => !appliedVersions.has(m.version));

    return {
      currentVersion,
      latestVersion,
      appliedMigrations,
      pendingMigrations
    };
  }
}