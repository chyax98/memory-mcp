# Simple Memory MCP Server

Simple Memory MCP Server is a TypeScript-based Model Context Protocol (MCP) server that provides persistent memory storage with tagging capabilities using SQLite. It functions as both an MCP server for client integration and a standalone CLI tool.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build Process
Bootstrap, build, and test the repository with these exact commands:

```bash
# Install dependencies (takes ~10 seconds)
npm install

# Build TypeScript to JavaScript (takes ~4 seconds) 
npm run build

# NEVER CANCEL: Run all tests (takes ~6 seconds total)
npm test

# NEVER CANCEL: Run performance tests (takes ~4 seconds)
npm run test:perf

# Run both test suites
npm run test:all
```

**CRITICAL TIMING NOTE**: All operations are fast in this repository - builds take under 5 seconds, tests take under 10 seconds. Use default timeouts (120s) - they are more than sufficient.

### Development Mode
- Development with hot reload: `npm run dev` (uses `tsx` to run TypeScript directly)
- Direct CLI usage: `npm run cli <command>` or `node dist/index.js <command>`
- Custom database: Set `MEMORY_DB` environment variable before running any command

### Project Structure Overview
```
src/
├── index.ts              # Main entry point - MCP server and CLI router
├── services/
│   └── memory-service.ts # Core SQLite database operations with FTS5
├── tools/                # MCP tools and CLI commands
│   ├── store-memory/     # Store content with tags
│   ├── search-memory/    # Search by content or tags with limits
│   ├── delete-memory/    # Delete by hash or tag
│   └── memory-stats/     # Database statistics
├── tests/
│   ├── memory-server-tests.ts  # Comprehensive functionality tests
│   └── performance-test.ts     # Large content and performance validation
└── utils/                # Helper utilities for JSON parsing, CLI parsing, debug
```

## Validation

### MANDATORY End-to-End Testing
After making any changes, ALWAYS run this complete validation scenario:

```bash
# Clean state
rm -f validation-test.db
export MEMORY_DB="./validation-test.db"

# 1. Store multiple memories with different tag combinations
node dist/index.js store-memory --content "First test memory" --tags "test,demo"
node dist/index.js store-memory --content "Project documentation" --tags "project,docs"
node dist/index.js store-memory --content "Bug fix notes" --tags "bug,fix,project"

# 2. Test all search capabilities
node dist/index.js search-memory --query "test"           # Content search
node dist/index.js search-memory --tags "project"         # Tag search
node dist/index.js search-memory --query "memory" --limit 1  # Limited search

# 3. Verify statistics
node dist/index.js memory-stats

# 4. Test deletion capabilities
node dist/index.js delete-memory --tag "test"             # Delete by tag
# Get a hash for deletion test:
HASH=$(node dist/index.js search-memory --tags "bug" | grep '"hash"' | head -1 | cut -d'"' -f4)
node dist/index.js delete-memory --hash "$HASH"           # Delete by hash

# 5. Final verification
node dist/index.js memory-stats
node dist/index.js search-memory --query "" --limit 10

# Clean up
rm -f validation-test.db
```

**Expected Results:**
- All commands complete with JSON output and no errors
- Search returns appropriate results with metadata (hash, tags, timestamps)
- Stats show correct counts before/after deletions
- Debug output shows database initialization and operation confirmations

### Test MCP Server Startup
The MCP server runs as a daemon waiting for stdio communication:

```bash
# Test server can start (will wait for input - this is correct behavior)
export MEMORY_DB="./mcp-test.db"
timeout 3 sh -c 'echo "test" | node dist/index.js' || echo "MCP server started successfully"
```

**Note**: The MCP server waits for JSON-RPC input via stdin/stdout. Starting without input/timeout is expected behavior.

### Development Testing
```bash
# Test development mode startup
timeout 3 sh -c 'echo "test" | npm run dev' || echo "Dev mode working"

# Build and test in one command  
npm run test
```

## Common Tasks

### Database Configuration
- **Default database**: `./memory.db` in current directory
- **Custom database**: Set `MEMORY_DB=/path/to/custom.db` environment variable
- **Database format**: SQLite with FTS5 full-text search, WAL mode enabled
- **Size limits**: Content limited to 5MB per memory entry

### CLI Commands Reference

All CLI commands follow this pattern: `node dist/index.js <command> [options]`

#### store-memory
```bash
node dist/index.js store-memory --content "Your content here" --tags "tag1,tag2"
# Required: --content
# Optional: --tags (comma-separated)
```

#### search-memory  
```bash
node dist/index.js search-memory --query "search term"           # Content search
node dist/index.js search-memory --tags "tag1,tag2"             # Tag search  
node dist/index.js search-memory --query "term" --limit 5       # Limited results
```

#### delete-memory
```bash
node dist/index.js delete-memory --tag "tagname"                # Delete all with tag
node dist/index.js delete-memory --hash "abc123..."             # Delete specific hash
```

#### memory-stats
```bash
node dist/index.js memory-stats                                 # Database statistics
```

### MCP Server Integration
Add to MCP client configuration:
```json
{
  "mcpServers": {
    "simple-memory": {
      "command": "node",
      "args": ["/absolute/path/to/simple-memory-mcp/dist/index.js"],
      "env": {
        "MEMORY_DB": "/path/to/memory.db"
      }
    }
  }
}
```

## Key Implementation Details

### Architecture Notes
- **ES Modules**: Project uses `"type": "module"` - all imports use `.js` extensions
- **TypeScript compilation**: Target ES2022, outputs to `dist/` directory  
- **Database engine**: better-sqlite3 with FTS5 full-text search
- **MCP Protocol**: Uses @modelcontextprotocol/sdk for server implementation
- **Error handling**: Comprehensive validation with JSON error responses

### Debug Output
All commands show debug output by default showing:
- Database initialization path
- Operation confirmations
- Search result counts
- Error details when operations fail

### No Linting/Formatting
This repository has no ESLint, Prettier, or other code quality tools configured. TypeScript compiler warnings are the primary code quality check.

## Troubleshooting

### Common Issues
- **"Cannot find module" errors**: Run `npm install` first
- **"File not found" errors**: Run `npm run build` to compile TypeScript
- **Database permission errors**: Check `MEMORY_DB` path is writable
- **Large content errors**: Content exceeds 5MB limit (expected behavior)

### Build Failures
Build failures are rare since the project has minimal dependencies. If build fails:
1. Check Node.js version (requires Node 18+)
2. Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
3. Ensure TypeScript can compile: `npx tsc --noEmit`

## Performance Characteristics

Based on performance testing:
- **Storage**: 1KB-1MB content stores in 0-7ms
- **Search**: FTS5 search typically completes in <150ms
- **Database size**: Efficient storage, ~1.7MB for 5 large memories
- **Memory usage**: Minimal, suitable for long-running processes
- **Relationships**: Auto-detection between memories with shared content

All operations are designed to be fast and suitable for interactive use.