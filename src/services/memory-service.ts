import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { resolve } from 'path';
import { debugLog, debugLogHash } from '../utils/debug.js';
import { runMigrations } from './migrations.js';
import { DatabaseOptimizer } from './database-optimizer.js';

export interface MemoryEntry {
  id: number;
  content: string;
  tags: string[];
  createdAt: string;
  hash: string;
}

export interface MemoryRelationship {
  fromMemoryId: number;
  toMemoryId: number;
  relationshipType: string;
  createdAt: string;
}

export interface MemoryStats {
  totalMemories: number;
  totalRelationships: number;
  dbSize: number;
  dbPath: string;
  resolvedPath: string;
}

/**
 * Memory Service for persistent storage and retrieval of memories with tagging and relationships.
 * Based on SQLite with FTS (Full Text Search) for efficient querying.
 */
export class MemoryService {
  private db: Database.Database | null = null;
  private dbPath: string;
  private resolvedDbPath: string;
  private stmts!: Record<string, Database.Statement>;
  private maxContentSize: number = 1024 * 1024; // 1MB default

  constructor(dbPath: string = 'memory.db', maxContentSize?: number) {
    this.dbPath = dbPath;
    if (maxContentSize) this.maxContentSize = maxContentSize;
    
    // Cache resolved path once
    this.resolvedDbPath = resolve(dbPath);
  }

  initialize(): void {
    try {
      this.db = new Database(this.dbPath);
      this.initDb();
      debugLog('MemoryService initialized with database:', this.dbPath);
    } catch (error: any) {
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  private initDb(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // Apply SQLite optimizations first
    DatabaseOptimizer.applyOptimizations(this.db);
    
    // Create base tables (if they don't exist)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        tags TEXT,
        created_at TEXT,
        hash TEXT UNIQUE
      )
    `);

    // Create relationships table for linking memories
    this.db.exec(`
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
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts 
      USING fts5(content, tags, content='memories', content_rowid='id')
    `);

    // Create trigger to automatically update FTS when memories are inserted
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts (rowid, content, tags) 
        VALUES (new.id, new.content, new.tags);
      END;
    `);

    // Create trigger to automatically update FTS when memories are updated
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        UPDATE memories_fts SET content = new.content, tags = new.tags 
        WHERE rowid = new.id;
      END;
    `);

    // Create trigger to automatically delete from FTS when memories are deleted
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.id;
      END;
    `);

    // Run migrations (creates tags table, indexes, etc.)
    // This is where all the magic happens - automatic, tracked, safe
    runMigrations(this.db, this.dbPath);
    
    // Optimize FTS after migrations
    DatabaseOptimizer.optimizeFTS(this.db);

    // Prepare statements for better performance
    this.prepareStatements();

    debugLog('MemoryService: Database initialized successfully');
  }

  private prepareStatements(): void {
    this.stmts = {
      // Memory operations
      insert: this.db!.prepare(`
        INSERT INTO memories (content, tags, created_at, hash) 
        VALUES (?, ?, ?, ?)
      `),
      getMemoryById: this.db!.prepare(`
        SELECT * FROM memories WHERE id = ?
      `),
      getMemoryByHash: this.db!.prepare(`
        SELECT * FROM memories WHERE hash = ?
      `),
      getRecent: this.db!.prepare(`
        SELECT * FROM memories 
        ORDER BY created_at DESC
        LIMIT ?
      `),
      deleteByHash: this.db!.prepare(`
        DELETE FROM memories WHERE hash = ?
      `),
      
      // Tag operations (NEW)
      insertTag: this.db!.prepare(`
        INSERT OR IGNORE INTO tags (memory_id, tag) VALUES (?, ?)
      `),
      getTagsForMemory: this.db!.prepare(`
        SELECT tag FROM tags WHERE memory_id = ? ORDER BY tag
      `),
      searchByTag: this.db!.prepare(`
        SELECT DISTINCT m.*
        FROM memories m
        INNER JOIN tags t ON m.id = t.memory_id
        WHERE t.tag = ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `),
      deleteByTag: this.db!.prepare(`
        DELETE FROM memories 
        WHERE id IN (SELECT memory_id FROM tags WHERE tag = ?)
      `),
      
      // FTS search (updated to just query text)
      searchText: this.db!.prepare(`
        SELECT m.* FROM memories m
        JOIN memories_fts fts ON m.id = fts.rowid
        WHERE memories_fts MATCH ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `),
      
      // Legacy tag search (fallback for old databases before migration)
      searchTagsLegacy: this.db!.prepare(`
        SELECT * FROM memories 
        WHERE tags LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `),
      
      // Relationship operations
      insertRelationship: this.db!.prepare(`
        INSERT INTO relationships (from_memory_id, to_memory_id, relationship_type, created_at)
        VALUES (?, ?, ?, ?)
      `),
      getRelated: this.db!.prepare(`
        SELECT m.*, r.relationship_type 
        FROM memories m
        JOIN relationships r ON (m.id = r.to_memory_id OR m.id = r.from_memory_id)
        WHERE (r.from_memory_id = ? OR r.to_memory_id = ?) AND m.id != ?
        ORDER BY r.created_at DESC
        LIMIT ?
      `),
      
      // Stats
      getStats: this.db!.prepare(`
        SELECT COUNT(*) as count FROM memories
      `),
      getRelationshipStats: this.db!.prepare(`
        SELECT COUNT(*) as count FROM relationships
      `)
    };
  }

  /**
   * Store a memory with optional tags
   */
  store(content: string, tags: string[] = []): string {
    // Validate content size
    if (content.length > this.maxContentSize) {
      throw new Error(`Content exceeds maximum size of ${this.maxContentSize} characters`);
    }

    const hash = createHash('md5').update(content).digest('hex');
    const createdAt = new Date().toISOString();

    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      // Use transaction for atomicity and performance
      const insertMemory = this.db.transaction(() => {
        // Insert memory (tags column kept as null for backward compatibility)
        const result = this.stmts.insert.run(content, null, createdAt, hash);
        const memoryId = result.lastInsertRowid as number;
        
        // Insert tags into normalized tags table
        for (const tag of tags) {
          const normalizedTag = tag.trim().toLowerCase();
          if (normalizedTag) {
            this.stmts.insertTag.run(memoryId, normalizedTag);
          }
        }
        
        return hash;
      });
      
      const resultHash = insertMemory();
      debugLogHash('MemoryService: Stored memory with hash:', hash);
      return resultHash;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        debugLogHash('MemoryService: Memory already exists with hash:', hash);
        return hash; // Already exists
      }
      debugLog('MemoryService: Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Search memories by content or tags
   */
  search(query?: string, tags?: string[], limit: number = 10): MemoryEntry[] {
    let results: any[];

    if (query) {
      // Use FTS for text search
      const ftsResults = this.stmts.searchText.all(query, limit);
      
      // Hydrate with tags from tags table
      results = ftsResults.map((row: any) => {
        const tagRows = this.stmts.getTagsForMemory.all(row.id) as Array<{ tag: string }>;
        return {
          ...row,
          tags: tagRows.map(t => t.tag)
        };
      });
    } else if (tags && tags.length > 0) {
      // Fast indexed tag search using normalized tags table
      const normalizedTag = tags[0].trim().toLowerCase();
      const tagResults = this.stmts.searchByTag.all(normalizedTag, limit);
      
      // Hydrate with all tags for each memory
      results = tagResults.map((row: any) => {
        const tagRows = this.stmts.getTagsForMemory.all(row.id) as Array<{ tag: string }>;
        return {
          ...row,
          tags: tagRows.map(t => t.tag)
        };
      });
    } else {
      // Get recent memories
      const recentResults = this.stmts.getRecent.all(limit);
      
      // Hydrate with tags
      results = recentResults.map((row: any) => {
        const tagRows = this.stmts.getTagsForMemory.all(row.id) as Array<{ tag: string }>;
        return {
          ...row,
          tags: tagRows.map(t => t.tag)
        };
      });
    }

    // Convert to MemoryEntry format
    const memories = results.map(row => ({
      id: row.id,
      content: row.content,
      tags: row.tags || [],
      createdAt: row.created_at,
      hash: row.hash
    }));

    debugLog('MemoryService: Search returned', memories.length, 'results');
    return memories;
  }

  /**
   * Delete a memory by hash
   */
  delete(hash: string): boolean {
    const result = this.stmts.deleteByHash.run(hash);
    const deleted = result.changes > 0;
    debugLogHash('MemoryService: Delete by hash', hash, deleted ? 'success' : 'not found');
    return deleted;
  }

  /**
   * Delete memories by tag
   */
  deleteByTag(tag: string): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const normalizedTag = tag.trim().toLowerCase();
    const result = this.stmts.deleteByTag.run(normalizedTag);
    
    debugLog('MemoryService: Deleted', result.changes, 'memories with tag:', normalizedTag);
    return result.changes;
  }

  /**
   * Bulk link memories in a single transaction for performance
   * Returns the number of relationships successfully created
   */
  linkMemoriesBulk(relationships: Array<{ fromHash: string; toHash: string; relationshipType?: string }>): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (relationships.length === 0) {
      return 0;
    }

    const insertBulk = this.db.transaction(() => {
      let count = 0;
      const createdAt = new Date().toISOString();
      
      for (const rel of relationships) {
        const fromMemory = this.stmts.getMemoryByHash.get(rel.fromHash) as any;
        const toMemory = this.stmts.getMemoryByHash.get(rel.toHash) as any;
        
        if (!fromMemory || !toMemory) continue;
        
        try {
          this.stmts.insertRelationship.run(
            fromMemory.id,
            toMemory.id,
            rel.relationshipType || 'related',
            createdAt
          );
          count++;
        } catch (error: any) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            // Skip duplicates silently
            continue;
          }
          throw error;
        }
      }
      
      return count;
    });

    const created = insertBulk();
    debugLog('MemoryService: Bulk linked', created, 'relationships');
    return created;
  }

  /**
   * Link two memories with a relationship
   */
  linkMemories(fromHash: string, toHash: string, relationshipType: string = 'related'): boolean {
    const fromMemory = this.stmts.getMemoryByHash.get(fromHash) as any;
    const toMemory = this.stmts.getMemoryByHash.get(toHash) as any;
    
    if (!fromMemory || !toMemory) {
      throw new Error('One or both memories not found');
    }
    
    const createdAt = new Date().toISOString();
    
    try {
      this.stmts.insertRelationship.run(
        fromMemory.id, 
        toMemory.id, 
        relationshipType, 
        createdAt
      );
      debugLogHash('MemoryService: Linked memories:', fromHash, 'to', toHash);
      return true;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        debugLog('MemoryService: Relationship already exists');
        return false; // Relationship already exists
      }
      throw error;
    }
  }

  /**
   * Get memories related to a specific memory
   */
  getRelated(hash: string, limit: number = 10): MemoryEntry[] {
    const memory = this.stmts.getMemoryByHash.get(hash) as any;
    if (!memory) {
      debugLogHash('MemoryService: Memory not found for getRelated:', hash);
      return [];
    }

    const results = this.stmts.getRelated.all(memory.id, memory.id, memory.id, limit) as any[];
    
    const related = results.map((row: any) => ({
      id: row.id,
      content: row.content,
      tags: row.tags ? row.tags.split(',') : [],
      createdAt: row.created_at,
      hash: row.hash,
      relationshipType: row.relationship_type
    }));

    debugLog('MemoryService: Found', related.length, 'related memories');
    return related;
  }

  /**
   * Get statistics about the memory database
   */
  stats(): MemoryStats {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const memoryCount = this.stmts.getStats.get() as any;
    const relationshipCount = this.stmts.getRelationshipStats.get() as any;
    
    const stats = {
      totalMemories: memoryCount.count,
      totalRelationships: relationshipCount.count,
      dbSize: (this.db.pragma('page_size', { simple: true }) as number) * 
              (this.db.pragma('page_count', { simple: true }) as number),
      dbPath: this.dbPath,
      resolvedPath: this.resolvedDbPath // Use cached value
    };

    debugLog('MemoryService: Stats:', stats);
    return stats;
  }

  /**
   * Get memory by hash
   */
  getByHash(hash: string): MemoryEntry | null {
    const result = this.stmts.getMemoryByHash.get(hash) as any;
    if (!result) {
      return null;
    }

    return {
      id: result.id,
      content: result.content,
      tags: result.tags ? result.tags.split(',') : [],
      createdAt: result.created_at,
      hash: result.hash
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      debugLog('MemoryService: Database connection closed');
    }
  }
}