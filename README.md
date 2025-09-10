# Simple Memory MCP Server

A Model Context Protocol (MCP) server that provides persistent memory storage with tagging capabilities using SQLite.

## Features

- **Store Memory**: Store text content with optional tags
- **Search Memory**: Full-text search and tag-based filtering
- **Delete Memory**: Remove memories by hash or tag
- **Memory Stats**: Get statistics about stored memories
- **Automatic Database Evolution**: Zero-configuration schema migrations with backups

## Database Schema Evolution

The Simple Memory MCP Server includes an automatic database migration system that ensures your database schema stays up-to-date without any manual intervention.

### Key Features

- **Zero Configuration**: Migrations happen automatically when the server starts
- **Automatic Backups**: Creates backups before any schema changes (keeps last 5)
- **Graceful Degradation**: Server continues to work even if migration fails
- **Version Tracking**: Fast version detection using SQLite pragma
- **Future-Proof**: JSON metadata columns for extensibility

### How It Works

1. **Fresh Installation**: Automatically creates the latest schema (v2) with all tables and optimizations
2. **Existing Database**: Detects current version and applies only needed migrations
3. **Backup Creation**: Creates timestamped backup in `backups/` directory before changes
4. **Migration Application**: Applies schema changes incrementally and safely
5. **Optimization**: Applies SQLite performance optimizations (WAL mode, cache tuning, etc.)

### Current Schema Versions

- **Version 1**: Initial schema with memories, relationships, and full-text search
- **Version 2**: Adds JSON metadata columns for future extensibility

### Performance Optimizations

The migration system automatically applies these SQLite optimizations:

- **WAL Mode**: Better concurrency for read-heavy workloads
- **64MB Cache**: Reduced disk I/O for frequently accessed data
- **Memory Temp Store**: Faster complex queries
- **Foreign Key Constraints**: Data integrity protection
- **Application ID**: Database type identification

### Migration Testing

Run the migration test suite to verify the system:

```bash
npm run test:migration
```

This tests fresh database creation, upgrades, and migration status reporting.

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "simple-memory": {
      "command": "node",
      "args": ["/path/to/simple-memory-mcp/dist/index.js"]
    }
  }
}
```

#### Custom Database Path

You can specify a custom database path using the `MEMORY_DB` environment variable:

```json
{
  "mcpServers": {
    "simple-memory-mcp": {
      "command": "node",
      "args": [
        "/path/to/simple-memory-mcp/dist/index.js"
      ],
      "env": {
        "MEMORY_DB": "/path/to/simple-memory-mcp/memory.db"
      }
    }
  }
}
```

**Environment Variables:**
- `MEMORY_DB`: Path to the SQLite database file (default: `./memory.db`)

### Command Line Interface

You can also use the `MEMORY_DB` environment variable with CLI commands:

```bash
# Set database path for CLI usage
export MEMORY_DB="/path/to/custom/memory.db"  # Linux/Mac
set MEMORY_DB=C:\path\to\custom\memory.db     # Windows CMD
$env:MEMORY_DB="C:\path\to\custom\memory.db"  # PowerShell

# Store memories with different content types
node dist/index.js store-memory --content "Test memory entry" --tags "test,demo"
node dist/index.js store-memory --content "Project Alpha documentation" --tags "project,alpha,docs"
node dist/index.js store-memory --content "Meeting notes for Q4 planning" --tags "meetings,q4,planning"
node dist/index.js store-memory --content "Bug fix for login issue" --tags "bugs,login,fix"

# Search memories by content
node dist/index.js search-memory --query "Test"
node dist/index.js search-memory --query "project"
node dist/index.js search-memory --query "bug" --limit 2

# Search memories by tags
node dist/index.js search-memory --tags "alpha"
node dist/index.js search-memory --tags "meetings,planning"

# Get memory statistics
node dist/index.js memory-stats

# Delete memories by tag
node dist/index.js delete-memory --tag "test"
node dist/index.js delete-memory --tag "old-notes"
```

## Available Tools

### store-memory
Store content with optional tags.

**Parameters:**
- `content` (required): The text content to store
- `tags` (optional): Array of tags to associate with the memory

### search-memory
Search stored memories by content or tags.

**Parameters:**
- `query` (optional): Text to search for in memory content
- `tags` (optional): Array of tags to filter by
- `limit` (optional): Maximum number of results (default: 10)

### delete-memory
Delete memories by hash or tag.

**Parameters:**
- `hash` (optional): Hash of specific memory to delete
- `tag` (optional): Delete all memories with this tag

### memory-stats
Get statistics about the memory database.

**Returns:**
- Total number of memories
- Total number of relationships
- Database size in bytes

## Database

Uses SQLite with Full-Text Search (FTS5) for efficient content searching. The database file defaults to `memory.db` in the current directory, but can be customized using the `MEMORY_DB` environment variable.

**Database Features:**
- Full-text search with FTS5
- Automatic relationship detection
- WAL mode for better performance
- Automatic cleanup and maintenance

## Development

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run all tests
npm run test:all

# Run specific test suites
npm test                    # Core functionality tests
npm run test:migration      # Database migration tests  
npm run test:perf          # Performance tests

# Run specific tool
npm run cli store-memory -- --content "test" --tags "development"

# Run with custom database
MEMORY_DB="./test.db" npm run cli memory-stats
```

### Testing the Migration System

To see the automatic migration system in action:

```bash
# Run the migration demo
npm run build && node dist/demo/migration-demo.js

# Run migration-specific tests
npm run test:migration
```

## Configuration Examples

### Multiple Database Instances

You can run multiple instances with different database files:

```json
{
  "mcpServers": {
    "memory-work": {
      "command": "node",
      "args": ["/path/to/simple-memory-mcp/dist/index.js"],
      "env": {
        "MEMORY_DB": "/path/to/work-memory.db"
      }
    },
    "memory-personal": {
      "command": "node",
      "args": ["/path/to/simple-memory-mcp/dist/index.js"],
      "env": {
        "MEMORY_DB": "/path/to/personal-memory.db"
      }
    }
  }
}
```
