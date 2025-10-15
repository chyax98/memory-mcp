# Stress Tests

Performance and load testing scripts for Simple Memory MCP.

## Running Tests

```bash
# Complete stress test suite (recommended)
.\stress-tests\memory-massacre.ps1

# Individual tests
.\stress-tests\bulk-insert-storm.ps1
.\stress-tests\search-apocalypse.ps1
```

## What They Test

- **bulk-insert-storm.ps1**: 60 diverse memories inserted rapidly with various content types
- **search-apocalypse.ps1**: 30+ complex search patterns (full-text, tags, multi-term queries)
- **memory-massacre.ps1**: Full suite combining inserts, searches, edge cases, and rapid-fire operations

All tests use isolated `stress-test.db` - your main database is safe.

## Expected Results

**CLI Performance** (includes ~500ms startup overhead per command):
- Insert: ~823ms per memory (with relationship detection)
- Insert: ~637ms per memory (without autoLink)
- Search: ~700ms per query (full-text)
- Tag Search: ~730ms per query

**Database Efficiency:**
- ~3KB per memory with relationships
- 60 memories + 191 relationships = 188KB
- Sub-millisecond actual database operations

**Note:** CLI performance includes Node.js startup and database initialization overhead. MCP server performance (persistent connection) is 60-127x faster. See [PERFORMANCE.md](../docs/PERFORMANCE.md) for detailed analysis.

## Interpreting Results

These tests demonstrate:
- ✅ System handles bulk operations without errors
- ✅ Search performs consistently across query types
- ✅ Database remains efficient as data grows
- ✅ Edge cases (large content, many tags, special chars) handled correctly
- ✅ Automatic relationship detection works reliably

The "slow" CLI times are expected and by design - see Performance docs for why MCP server usage is dramatically faster.
