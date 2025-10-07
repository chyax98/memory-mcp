import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, basename } from 'path';
import Database from 'better-sqlite3';
import { debugLog, formatTimestampForFilename } from '../utils/debug.js';

export interface BackupConfig {
  backupPath: string;
  autoBackupInterval?: number; // minutes - minimum time between backups (0 = backup on every write)
  maxBackups?: number; // keep last N backups (0 = unlimited)
}

export class BackupService {
  private config: BackupConfig;
  private dbPath: string;
  private lastBackupTime: number = 0;

  constructor(dbPath: string, config: BackupConfig) {
    this.dbPath = dbPath;
    this.config = {
      ...config,
      autoBackupInterval: config.autoBackupInterval || 0,
      maxBackups: config.maxBackups || 10
    };

    // Ensure backup directory exists
    try {
      mkdirSync(this.config.backupPath, { recursive: true });
      debugLog(`Backup directory ready: ${this.config.backupPath}`);
      
      // Initialize lastBackupTime from most recent backup file (for CLI persistence)
      this.initializeLastBackupTime();
    } catch (error: any) {
      debugLog(`Warning: Could not create backup directory: ${error.message}`);
    }
  }

  /**
   * Initialize lastBackupTime from the most recent backup file
   * This allows throttling to work across CLI invocations
   */
  private initializeLastBackupTime(): void {
    try {
      if (!existsSync(this.config.backupPath)) {
        debugLog(`Backup path does not exist yet: ${this.config.backupPath}`);
        return;
      }

      const files = readdirSync(this.config.backupPath)
        .filter(f => f.endsWith('.db') && f.includes('_auto'))
        .map(f => {
          const filePath = join(this.config.backupPath, f);
          const stats = statSync(filePath);
          return {
            name: f,
            path: filePath,
            time: stats.mtime.getTime(),
            mtimeDate: stats.mtime
          };
        })
        .sort((a, b) => b.time - a.time); // Newest first

      if (files.length > 0) {
        const mostRecent = files[0];
        this.lastBackupTime = mostRecent.time;
        const now = Date.now();
        const ageMinutes = Math.floor((now - this.lastBackupTime) / 60000);
        debugLog(`📁 Found ${files.length} existing auto backup(s)`);
        debugLog(`📅 Most recent: ${mostRecent.name}`);
        debugLog(`🕐 Last backup time: ${new Date(this.lastBackupTime).toISOString()}`);
        debugLog(`🕐 Current time: ${new Date(now).toISOString()}`);
        debugLog(`⏱️  Age: ${ageMinutes} minutes (${Math.floor((now - this.lastBackupTime) / 1000)} seconds)`);
      } else {
        debugLog(`No existing auto backups found in ${this.config.backupPath}`);
      }
    } catch (error: any) {
      debugLog(`Warning: Could not initialize last backup time: ${error.message}`);
    }
  }

  /**
   * Create a backup of the database
   * Uses SQLite's built-in VACUUM INTO for consistent backups
   */
  backup(label: string = 'manual'): string | null {
    if (!existsSync(this.dbPath)) {
      debugLog('Backup: Source database does not exist');
      return null;
    }

    try {
      const timestamp = formatTimestampForFilename();
      const backupFileName = `${basename(this.dbPath, '.db')}_${label}_${timestamp}.db`;
      const backupPath = join(this.config.backupPath, backupFileName);

      // Try to checkpoint WAL if database exists and is accessible
      try {
        const db = new Database(this.dbPath, { readonly: true, fileMustExist: true });
        db.pragma('wal_checkpoint(PASSIVE)'); // Non-blocking checkpoint
        db.close();
      } catch {
        // Database might be in use or not exist yet, continue anyway
      }

      // Simple file copy - works even if database is in use (thanks to WAL)
      copyFileSync(this.dbPath, backupPath);
      
      // Also copy WAL and SHM files if they exist (for complete backup)
      try {
        copyFileSync(this.dbPath + '-wal', backupPath + '-wal');
      } catch {
        // WAL file might not exist, that's ok
      }
      try {
        copyFileSync(this.dbPath + '-shm', backupPath + '-shm');
      } catch {
        // SHM file might not exist, that's ok
      }
      
      this.lastBackupTime = Date.now();
      debugLog(`✅ Backup created: ${backupPath}`);

      // Clean up old backups
      this.cleanupOldBackups();

      return backupPath;
    } catch (error: any) {
      debugLog(`❌ Backup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a backup before a potentially dangerous operation
   */
  backupBeforeOperation(operationType: string): string | null {
    return this.backup(`pre-${operationType}`);
  }

  /**
   * Check if backup should be created based on throttle interval
   * Call this after write operations (store, delete)
   */
  shouldBackup(): boolean {
    const now = Date.now();
    const timeSinceLastBackupMs = now - this.lastBackupTime;
    const timeSinceLastBackupMinutes = Math.floor(timeSinceLastBackupMs / 60000);
    const timeSinceLastBackupSeconds = Math.floor(timeSinceLastBackupMs / 1000);

    // If interval is 0, backup on every write
    if (!this.config.autoBackupInterval || this.config.autoBackupInterval <= 0) {
      debugLog(`⚡ Backup check: interval=0, backup on every write`);
      return true;
    }

    const intervalMs = this.config.autoBackupInterval * 60 * 1000;
    const shouldBackupNow = timeSinceLastBackupMs >= intervalMs;
    
    debugLog(`⏱️  Backup check: interval=${this.config.autoBackupInterval}min (${intervalMs}ms)`);
    debugLog(`   Last backup: ${this.lastBackupTime === 0 ? 'never' : new Date(this.lastBackupTime).toISOString()}`);
    debugLog(`   Current time: ${new Date(now).toISOString()}`);
    debugLog(`   Time since last: ${timeSinceLastBackupMinutes}min ${timeSinceLastBackupSeconds % 60}s (${timeSinceLastBackupMs}ms)`);
    debugLog(`   Should backup: ${shouldBackupNow ? '✅ YES' : '❌ NO'}`);
    
    return shouldBackupNow;
  }

  /**
   * Backup if enough time has passed since last backup (lazy backup on write)
   */
  backupIfNeeded(): string | null {
    if (this.shouldBackup()) {
      debugLog(`🔄 Creating lazy backup...`);
      return this.backup('auto');
    }
    debugLog(`⏭️  Skipping backup (not enough time passed)`);
    return null;
  }

  /**
   * Initialize lazy backup mode (creates initial backup if needed)
   * Backups will be created on write operations when interval has passed
   */
  initialize(): void {
    const intervalMinutes = this.config.autoBackupInterval || 0;
    if (intervalMinutes > 0) {
      debugLog(`Lazy backup enabled: will backup after writes if ${intervalMinutes}+ minutes since last backup`);
    } else {
      debugLog(`Lazy backup enabled: will backup on every write`);
    }
    
    // Only create initial backup if we should (respects throttling)
    if (this.shouldBackup()) {
      debugLog(`🔄 Creating initial backup...`);
      this.backup('auto-initial');
    } else {
      debugLog(`⏭️  Skipping initial backup (recent backup exists)`);
    }
  }

  /**
   * Clean up old backups, keeping only the most recent N
   */
  private cleanupOldBackups(): void {
    if (!this.config.maxBackups || this.config.maxBackups <= 0) {
      return; // Keep all backups
    }

    try {
      const files = readdirSync(this.config.backupPath)
        .filter(f => f.endsWith('.db'))
        .map(f => ({
          name: f,
          path: join(this.config.backupPath, f),
          time: statSync(join(this.config.backupPath, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first

      // Delete backups beyond the max count
      const toDelete = files.slice(this.config.maxBackups);
      
      for (const file of toDelete) {
        try {
          // Delete main .db file and any associated WAL/SHM files
          unlinkSync(file.path);
          try { unlinkSync(file.path + '-wal'); } catch {}
          try { unlinkSync(file.path + '-shm'); } catch {}
          debugLog(`Deleted old backup: ${file.name}`);
        } catch (error: any) {
          debugLog(`Warning: Could not delete old backup: ${error.message}`);
        }
      }

      if (toDelete.length > 0) {
        debugLog(`Cleaned up ${toDelete.length} old backup(s), kept ${this.config.maxBackups} most recent`);
      }
    } catch (error: any) {
      debugLog(`Warning: Backup cleanup failed: ${error.message}`);
    }
  }

  /**
   * List all available backups
   */
  listBackups(): Array<{ name: string; path: string; size: number; created: Date }> {
    if (!existsSync(this.config.backupPath)) {
      return [];
    }

    try {
      return readdirSync(this.config.backupPath)
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const path = join(this.config.backupPath, f);
          const stats = statSync(path);
          return {
            name: f,
            path,
            size: stats.size,
            created: stats.mtime
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime()); // Newest first
    } catch (error: any) {
      debugLog(`Error listing backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Restore from a backup
   */
  restore(backupPath: string): boolean {
    if (!existsSync(backupPath)) {
      debugLog(`Restore failed: Backup file not found: ${backupPath}`);
      return false;
    }

    try {
      // Create a backup of current database before restoring
      if (existsSync(this.dbPath)) {
        const safeguard = this.backup('pre-restore-safeguard');
        debugLog(`Created safeguard backup: ${safeguard}`);
      }

      // Copy backup to main database location
      copyFileSync(backupPath, this.dbPath);
      debugLog(`✅ Restored database from: ${backupPath}`);
      return true;
    } catch (error: any) {
      debugLog(`❌ Restore failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get time since last backup in minutes
   */
  getTimeSinceLastBackup(): number {
    if (this.lastBackupTime === 0) return -1;
    return Math.floor((Date.now() - this.lastBackupTime) / 60000);
  }
}
