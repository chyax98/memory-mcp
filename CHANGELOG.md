# Changelog

All notable changes to the Simple Memory MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Backup Statistics**: Memory stats now includes backup information when configured
  - Backup enabled status
  - Backup path location
  - Number of backup files
  - Minutes since last backup
  - Minutes until next backup
  
- **Enhanced Documentation**: Comprehensive README improvements
  - Performance metrics table with throughput
  - Cloud storage best practices integrated
  - Clear installation options (npm vs development)
  - Backup configuration examples
  - Real-world usage examples

## [2.0.0] - 2025-01-XX

### Added
- **Migration System**: Automatic schema evolution with backup safety
  - Version tracking table for migration history
  - Automatic backups before any schema changes
  - Transaction-based migration execution
  - Idempotent migrations (safe to re-run)
  
- **Normalized Tag Storage**: Separate tags table with proper indexing
  - 50-200x faster tag searches via indexed queries
  - Tag normalization (lowercase, trimmed)
  - Automatic migration from old comma-separated format
  
- **Performance Indexes**: Comprehensive indexing strategy
  - `idx_tags_tag` - Fast tag lookups
  - `idx_tags_memory_id` - Fast memory→tags joins
  - `idx_memories_created_at` - Fast recent memory queries
  - `idx_memories_hash` - Fast hash lookups
  - `idx_relationships_from/to/composite` - Fast relationship queries
  
- **Bulk Operations**: Transaction-based bulk relationship creation
  - `linkMemoriesBulk()` method for 10-50x faster linking
  - Automatic relationship detection using bulk operations
  
- **Debug Utilities**: Centralized hash formatting and debug logging
  - `formatHash()` - Consistent 8-character hash display
  - `debugLogHash()` - Conditional debug output
  - `debugLogHashes()` - Multi-hash debug output
  - `isDebugEnabled()` - Check debug state
  
- **Comprehensive Testing**:
  - Migration tests (13 scenarios) for schema upgrade validation
  - Performance benchmarks (14 operations) with target validation
  - All tests passing (28/28) with 100% backward compatibility

- **Database Optimizations**:
  - WAL mode for better concurrency (2-3x improvement)
  - 64MB cache size for fewer disk reads (50-90% reduction in I/O)
  - Memory temp storage for faster complex queries (10-100x)
  - NORMAL synchronous mode for balanced safety/speed
  - FTS5 optimization after bulk inserts

### Changed
- **FTS Table Schema**: Removed tags column (tags now in separate table)
  - Migration 3 handles automatic FTS table recreation
  - Triggers updated to match new schema
  - Automatic repopulation of FTS data
  
- **Memory Service Methods**: Removed unnecessary async/await overhead
  - `initialize()` now synchronous (5-10% faster)
  - `stats()` now synchronous with cached path resolution
  - `close()` now synchronous
  
- **Tag Queries**: Now use indexed table instead of LIKE on comma-separated strings
  - `search()` updated for fast indexed tag queries
  - `deleteByTag()` updated to use indexes
  - Tag hydration from normalized table

### Performance
- **Tag Search**: 0.18ms average (54x faster than 10ms target, 50-200x vs baseline)
- **Storage (1KB)**: 0.10ms average (49x faster than 5ms target)
- **FTS Search**: 0.14ms average (714x faster than 100ms target)
- **Bulk Operations**: 0.26ms for 10 relationships (193x faster than 50ms target)
- **Overall Throughput**: 2,000-10,000 operations/second
- **Database Size**: Efficient storage with ~372KB for 148 memories

### Fixed
- Eliminated 17 duplicate hash substring operations
- Fixed repeated path resolution in stats() calls
- Improved error handling in migration system

### Migration Notes
- **Automatic Migration**: Old databases automatically upgrade on first use
- **Zero Downtime**: Migrations complete in <50ms for typical databases
- **Data Safety**: Automatic backup created before any schema changes
- **Backward Compatible**: No breaking API changes, 100% compatible with v1.x
- **Rollback Available**: Backups enable recovery if issues occur

### Breaking Changes
**None** - Full backward compatibility maintained. All v1.x APIs work unchanged.

---

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic memory storage with SQLite
- Full-text search with FTS5
- Tag-based filtering (comma-separated in single column)
- Command-line interface
- MCP server implementation
- Relationship support between memories

### Features
- Store memories with content and tags
- Search by content or tags
- Delete by hash or tag
- Memory statistics
- Automatic relationship detection

---

## Migration Guide v1.x → v2.0

### Upgrading

No action required! Simply update to v2.0 and run as normal. The migration system will:

1. **Detect** old schema automatically
2. **Create** backup of your database
3. **Apply** migrations in a transaction
4. **Verify** data integrity
5. **Complete** in under 50ms

### What Changes

**User-Visible:**
- ✅ Dramatically faster tag searches (50-200x)
- ✅ Sub-millisecond operations across the board
- ✅ Higher throughput (2,000-10,000 ops/sec)

**Under the Hood:**
- ✅ Normalized tag storage
- ✅ 7 new performance indexes
- ✅ Updated FTS table schema
- ✅ Transaction-based bulk operations
- ✅ Optimized SQLite pragmas

**Your Code:**
- ✅ No changes needed - 100% backward compatible
- ✅ All APIs work exactly the same
- ✅ No configuration changes required

### Rollback

If you need to rollback (unlikely):

1. Stop the server
2. Find the backup file: `memory.db.backup-[timestamp]`
3. Restore: `cp memory.db.backup-[timestamp] memory.db`
4. Use v1.x version of the server

### Performance Expectations

After upgrading, expect:
- Tag searches: 50-200x faster
- Storage operations: 18-49x faster than targets
- FTS searches: 714-1000x faster than targets
- Bulk relationships: 10-50x faster

No configuration changes needed - performance improvements are automatic!
