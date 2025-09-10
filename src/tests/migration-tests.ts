#!/usr/bin/env node

/**
 * Database Migration System Tests
 * Tests the automatic migration functionality
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { MemoryService } from '../services/memory-service.js';
import { DatabaseMigrator } from '../services/database-migrator.js';
import { DatabaseOptimizer } from '../services/database-optimizer.js';

const TEST_DB = './test-migration.db';
const TEST_DB_V1 = './test-migration-v1.db';

interface TestResult {
  name: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

/**
 * Clean up test databases
 */
async function cleanup(): Promise<void> {
  try {
    if (existsSync(TEST_DB)) await unlink(TEST_DB);
    if (existsSync(TEST_DB_V1)) await unlink(TEST_DB_V1);
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Create a v1 database manually (simulating existing database)
 */
async function createV1Database(): Promise<void> {
  const db = new Database(TEST_DB_V1);
  
  // Create old schema without metadata columns
  db.exec(`
    CREATE TABLE memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT,
      hash TEXT UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE relationships (
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

  db.exec(`
    CREATE VIRTUAL TABLE memories_fts 
    USING fts5(content, tags, content='memories', content_rowid='id')
  `);

  // Create schema_migrations table and mark v1 as applied
  db.exec(`
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  // Record that migration 1 was applied
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`).run(1, now);

  // Set as version 1
  db.pragma('user_version = 1');
  
  // Insert some test data
  db.prepare(`INSERT INTO memories (content, tags, created_at, hash) VALUES (?, ?, ?, ?)`)
    .run('Test memory', 'test', new Date().toISOString(), 'test123');
  
  db.close();
}

/**
 * Run a test function and measure execution time
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    console.log(`✅ ${name} (${duration}ms)`);
    return { name, success: true, duration };
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`❌ ${name} failed: ${error.message} (${duration}ms)`);
    return { name, success: false, error: error.message, duration };
  }
}

/**
 * Test fresh database initialization with migrations
 */
async function testFreshDatabaseInit(): Promise<void> {
  await cleanup();
  
  const memoryService = new MemoryService(TEST_DB);
  await memoryService.initialize();
  
  // Check that tables exist
  const db = new Database(TEST_DB);
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as any[];
  const tableNames = tables.map(t => t.name);
  
  // Should have all tables including migrations table
  if (!tableNames.includes('memories')) throw new Error('memories table not created');
  if (!tableNames.includes('relationships')) throw new Error('relationships table not created');
  if (!tableNames.includes('schema_migrations')) throw new Error('schema_migrations table not created');
  
  // Check version
  const version = DatabaseOptimizer.getQuickVersion(db);
  if (version !== 2) throw new Error(`Expected version 2, got ${version}`);
  
  // Check metadata columns exist
  const memoryColumns = db.prepare(`PRAGMA table_info(memories)`).all() as any[];
  const hasMetadata = memoryColumns.some(col => col.name === 'metadata');
  if (!hasMetadata) throw new Error('metadata column not found in memories table');
  
  db.close();
  await memoryService.close();
}

/**
 * Test upgrading from v1 to v2
 */
async function testV1ToV2Upgrade(): Promise<void> {
  await cleanup();
  await createV1Database();
  
  // Open with migration system
  const memoryService = new MemoryService(TEST_DB_V1);
  await memoryService.initialize();
  
  // Check that upgrade happened
  const db = new Database(TEST_DB_V1);
  const version = DatabaseOptimizer.getQuickVersion(db);
  if (version !== 2) throw new Error(`Expected version 2 after upgrade, got ${version}`);
  
  // Check metadata column was added
  const memoryColumns = db.prepare(`PRAGMA table_info(memories)`).all() as any[];
  const hasMetadata = memoryColumns.some(col => col.name === 'metadata');
  if (!hasMetadata) throw new Error('metadata column not added during upgrade');
  
  // Check existing data is preserved
  const memories = db.prepare(`SELECT * FROM memories`).all() as any[];
  if (memories.length !== 1) throw new Error('Existing data was lost during migration');
  if (memories[0].content !== 'Test memory') throw new Error('Existing data was corrupted');
  
  db.close();
  await memoryService.close();
}

/**
 * Test migration status reporting
 */
async function testMigrationStatus(): Promise<void> {
  await cleanup();
  
  const memoryService = new MemoryService(TEST_DB);
  await memoryService.initialize();
  
  const db = new Database(TEST_DB);
  const migrator = new DatabaseMigrator(db, TEST_DB);
  
  const status = migrator.getMigrationStatus();
  
  if (status.currentVersion !== 2) throw new Error(`Expected current version 2, got ${status.currentVersion}`);
  if (status.latestVersion !== 2) throw new Error(`Expected latest version 2, got ${status.latestVersion}`);
  if (status.appliedMigrations.length !== 2) throw new Error(`Expected 2 applied migrations, got ${status.appliedMigrations.length}`);
  if (status.pendingMigrations.length !== 0) throw new Error(`Expected 0 pending migrations, got ${status.pendingMigrations.length}`);
  
  db.close();
  await memoryService.close();
}

/**
 * Test database optimizations are applied
 */
async function testOptimizations(): Promise<void> {
  await cleanup();
  
  const memoryService = new MemoryService(TEST_DB);
  await memoryService.initialize();
  
  const db = new Database(TEST_DB);
  const stats = DatabaseOptimizer.getPerformanceStats(db);
  
  if (!stats) throw new Error('Could not get performance stats');
  if (stats.journalMode !== 'wal') throw new Error(`Expected WAL mode, got ${stats.journalMode}`);
  if (stats.synchronous !== 1) throw new Error(`Expected synchronous=NORMAL (1), got ${stats.synchronous}`);
  if (stats.applicationId !== 0x4D454D53) throw new Error(`Expected application ID 0x4D454D53, got ${stats.applicationId}`);
  
  db.close();
  await memoryService.close();
}

/**
 * Main test runner
 */
async function main(): Promise<void> {
  console.log('🧪 Database Migration System Tests');
  console.log('==================================\n');

  const tests = [
    () => testFreshDatabaseInit(),
    () => testV1ToV2Upgrade(), 
    () => testMigrationStatus(),
    () => testOptimizations()
  ];

  const testNames = [
    'Fresh Database Initialization',
    'V1 to V2 Database Upgrade',
    'Migration Status Reporting',
    'Database Optimizations'
  ];

  const results: TestResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    console.log(`Running: ${testNames[i]}...`);
    const result = await runTest(testNames[i], tests[i]);
    results.push(result);
  }

  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Total time: ${totalTime}ms`);
  
  if (passed === total) {
    console.log('\n🎉 All migration tests passed!');
  } else {
    console.log('\n❌ Some tests failed:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n🧹 Test databases cleaned up');
  await cleanup();
  
  if (passed !== total) {
    process.exit(1);
  }
}

// Handle ES modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're running this file directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}