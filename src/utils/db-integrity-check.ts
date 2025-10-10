import Database from 'better-sqlite3';
import { createHash } from 'crypto';

interface IntegrityCheckResult {
  totalMemories: number;
  orphanedHashIndexes: number;
  missingHashIndexes: number;
  corruptedHashes: number;
  orphanedMemories: Array<{
    id: number;
    hash: string;
    content: string;
  }>;
}

/**
 * Check database integrity for hash index corruption
 * This helps diagnose why hash lookups fail while data exists
 */
export function checkDatabaseIntegrity(dbPath: string): IntegrityCheckResult {
  const db = new Database(dbPath);
  
  const result: IntegrityCheckResult = {
    totalMemories: 0,
    orphanedHashIndexes: 0,
    missingHashIndexes: 0,
    corruptedHashes: 0,
    orphanedMemories: []
  };

  try {
    // Get all memories
    const allMemories = db.prepare('SELECT id, hash, content FROM memories').all() as Array<{
      id: number;
      hash: string;
      content: string;
    }>;
    
    result.totalMemories = allMemories.length;

    for (const memory of allMemories) {
      // Check 1: Can we find it via hash index lookup?
      const indexedLookup = db.prepare('SELECT id FROM memories WHERE hash = ?').get(memory.hash) as any;
      
      // Check 2: Can we find it via full table scan?
      const scanLookup = db.prepare('SELECT id FROM memories WHERE +hash = ?').get(memory.hash) as any;
      
      // Check 3: Does the hash match the content?
      const computedHash = createHash('md5').update(memory.content).digest('hex');
      
      if (computedHash !== memory.hash) {
        result.corruptedHashes++;
        result.orphanedMemories.push({
          id: memory.id,
          hash: memory.hash,
          content: memory.content.substring(0, 100) + '...'
        });
      } else if (!indexedLookup && scanLookup) {
        // Hash is correct but index lookup fails - this is hash index corruption
        result.orphanedHashIndexes++;
        result.orphanedMemories.push({
          id: memory.id,
          hash: memory.hash,
          content: memory.content.substring(0, 100) + '...'
        });
      } else if (indexedLookup && !scanLookup) {
        // Index works but scan doesn't - very strange, shouldn't happen
        result.missingHashIndexes++;
      }
    }

    return result;
  } finally {
    db.close();
  }
}

/**
 * Rebuild hash index (REINDEX)
 */
export function rebuildHashIndex(dbPath: string): void {
  const db = new Database(dbPath);
  
  try {
    console.log('Rebuilding hash index...');
    db.prepare('REINDEX idx_memories_hash').run();
    console.log('✓ Hash index rebuilt successfully');
  } finally {
    db.close();
  }
}
