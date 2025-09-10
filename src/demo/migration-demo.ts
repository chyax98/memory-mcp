#!/usr/bin/env node

/**
 * Database Migration Demo
 * Demonstrates the automatic migration system in action
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { MemoryService } from '../services/memory-service.js';
import { DatabaseMigrator } from '../services/database-migrator.js';
import { DatabaseOptimizer } from '../services/database-optimizer.js';

const DEMO_DB = './demo-migration.db';

async function cleanup(): Promise<void> {
  try {
    if (existsSync(DEMO_DB)) await unlink(DEMO_DB);
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main(): Promise<void> {
  console.log('🚀 Database Migration System Demo');
  console.log('=================================\n');

  await cleanup();

  console.log('1. Creating new database with automatic migration...');
  const memoryService = new MemoryService(DEMO_DB);
  await memoryService.initialize();
  
  // Check initial state
  const db = new Database(DEMO_DB);
  const migrator = new DatabaseMigrator(db, DEMO_DB);
  
  console.log('\n📊 Migration Status:');
  const status = migrator.getMigrationStatus();
  console.log(`   Current Version: ${status.currentVersion}`);
  console.log(`   Latest Version: ${status.latestVersion}`);
  console.log(`   Applied Migrations: ${status.appliedMigrations.length}`);
  console.log(`   Pending Migrations: ${status.pendingMigrations.length}`);

  console.log('\n🗃️ Database Schema:');
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as any[];
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
    if (table.name === 'memories' || table.name === 'relationships') {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[];
      columns.forEach(col => {
        console.log(`     * ${col.name}: ${col.type}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
      });
    }
  });

  console.log('\n⚡ Performance Optimizations:');
  const perfStats = DatabaseOptimizer.getPerformanceStats(db);
  if (perfStats) {
    console.log(`   Journal Mode: ${perfStats.journalMode.toUpperCase()}`);
    console.log(`   Cache Size: ${Math.abs(perfStats.cacheSize / 1024)}MB`);
    console.log(`   Temp Store: ${perfStats.tempStore === 2 ? 'MEMORY' : 'FILE'}`);
    console.log(`   Application ID: 0x${perfStats.applicationId.toString(16).toUpperCase()} (MEMS)`);
  }

  console.log('\n💾 Testing with actual data...');
  const hash1 = memoryService.store('This is a test memory with metadata support', ['demo', 'migration']);
  console.log(`   Stored memory: ${hash1.substring(0, 8)}...`);
  
  const memories = memoryService.search('test');
  console.log(`   Found ${memories.length} memories in search`);

  // Check if metadata column exists and is working
  const memoryColumns = db.prepare(`PRAGMA table_info(memories)`).all() as any[];
  const hasMetadata = memoryColumns.some(col => col.name === 'metadata');
  console.log(`   Metadata column available: ${hasMetadata ? '✅' : '❌'}`);

  console.log('\n🔍 Applied Migrations:');
  status.appliedMigrations.forEach(migration => {
    console.log(`   ✅ Migration ${migration.version} - Applied at ${migration.appliedAt}`);
  });

  db.close();
  await memoryService.close();

  console.log('\n✨ Demo completed successfully!');
  console.log('\nKey features demonstrated:');
  console.log('  • Automatic schema creation from migrations');
  console.log('  • Version tracking with SQLite pragma');
  console.log('  • Database optimizations (WAL, cache, etc.)');
  console.log('  • Metadata columns for future extensibility');
  console.log('  • Zero user intervention required');

  await cleanup();
}

// Handle ES modules
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Check if we're running this file directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}