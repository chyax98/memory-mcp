# 🧠 Simple Memory MCP Server

[![npm version](https://img.shields.io/npm/v/simple-memory-mcp.svg)](https://www.npmjs.com/package/simple-memory-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A blazingly fast Model Context Protocol (MCP) server for persistent memory storage with intelligent tagging and full-text search.

Perfect for AI assistants that need to remember context across conversations, store project notes, or build a personal knowledge base.

---

## ✨ Features

- 🚀 **Sub-millisecond Performance** - 2,000-10,000 operations/second
- 🔍 **Full-Text Search** - SQLite FTS5 with 0.14ms average query time
- 🏷️ **Smart Tagging** - Organize and filter memories with tags
- 🔗 **Auto-Relationships** - Automatically link related memories
- 💾 **Automatic Backups** - Optional lazy backups to cloud storage
- 🔄 **Safe Migrations** - Automatic schema upgrades without data loss
- 📦 **Zero Config** - Works out of the box with sensible defaults

---

## 📊 Performance Highlights

| Operation | Average Time | Throughput |
|-----------|--------------|------------|
| Store Memory (1KB) | 0.1ms | ~10,000 ops/sec |
| Tag Search | 0.18ms | ~5,500 ops/sec |
| Full-Text Search | 0.14ms | ~7,000 ops/sec |
| Bulk Relationships | 0.26ms | ~3,800 ops/sec |

**All operations complete in sub-millisecond timeframes** with optimized indexes and prepared statements.


---

## 🚀 Quick Start

### 1️⃣ Install

**Option A: From npm (when published)**
```bash
npm install -g simple-memory-mcp
```

**Option B: For development/testing (current)**
```bash
# Clone and build the repository
git clone https://github.com/chrisribe/simple-memory-mcp.git
cd simple-memory-mcp
npm install
npm run build

# Create a global symlink
npm link

# Now 'simple-memory' command works globally!
simple-memory memory-stats
```

> 💡 **What's the difference?** Option A installs from npm's registry (not available yet). Option B creates a symlink to your local code, perfect for testing and development. Both make the `simple-memory` command available globally.

### 2️⃣ Configure Your MCP Client

Add to your MCP client config (e.g., Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "simple-memory": {
      "command": "simple-memory"
    }
  }
}
```

> 💡 **Windows users**: Config is usually at `%APPDATA%\Claude\claude_desktop_config.json`  
> 💡 **macOS users**: Config is usually at `~/Library/Application Support/Claude/claude_desktop_config.json`

### 3️⃣ Restart Your MCP Client

That's it! Start storing and retrieving memories with your AI assistant.

---

## 📖 Table of Contents

- [Usage](#-usage)
  - [MCP Server](#as-mcp-server)
  - [CLI Commands](#command-line-interface)
- [Available Tools](#-available-tools)
- [Configuration](#-configuration)
- [Database](#-database)
- [Development](#-development)
- [Examples](#-examples)

---

## 💻 Usage

### As MCP Server

The server exposes tools that your AI assistant can use directly. Once configured, you can ask your assistant to:

- "Remember that I prefer dark mode"
- "Store this meeting summary with tags project and planning"
- "Search my memories for Python tips"
- "Show me all memories tagged with 'important'"

### Command Line Interface

You can also use the CLI directly:

```bash
# Store a memory
simple-memory store-memory --content "Your content here" --tags "tag1,tag2"

# Search by content
simple-memory search-memory --query "search term"

# Search by tags
simple-memory search-memory --tags "tag1,tag2"

# View statistics
simple-memory memory-stats

# Delete by tag
simple-memory delete-memory --tag "old-notes"
```

---

## 🛠️ Available Tools

### `store-memory`
Store content with optional tags.

**Parameters:**
- `content` (string, required) - The text content to store
- `tags` (array, optional) - Tags to associate with the memory
- `autoLink` (boolean, optional) - Auto-link to similar memories (default: true)

**Example:**
```json
{
  "content": "Remember to use TypeScript for all new projects",
  "tags": ["coding", "best-practices"],
  "autoLink": true
}
```

### `search-memory`
Search stored memories by content or tags.

**Parameters:**
- `query` (string, optional) - Text to search for in content
- `tags` (array, optional) - Filter by tags
- `limit` (number, optional) - Max results to return (default: 10)
- `includeRelated` (boolean, optional) - Include related memories (default: false)

**Example:**
```json
{
  "query": "TypeScript",
  "tags": ["coding"],
  "limit": 5
}
```

### `delete-memory`
Delete memories by hash or tag.

**Parameters:**
- `hash` (string, optional) - Hash of specific memory to delete
- `tag` (string, optional) - Delete all memories with this tag

**Example:**
```json
{
  "tag": "temporary"
}
```

### `memory-stats`
Get statistics about stored memories.

**Returns:**
- Total memories count
- Total relationships count
- Database size in bytes
- Schema version
- Backup status (if configured):
  - Backup path
  - Number of backup files
  - Minutes since last backup
  - Minutes until next backup

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MEMORY_DB` | Database file path | `./memory.db` | `/home/user/memories.db` |
| `MEMORY_BACKUP_PATH` | Backup directory (optional) | None | `/home/user/backups` |
| `MEMORY_BACKUP_INTERVAL` | Minutes between backups | `0` (disabled) | `180` |
| `MEMORY_BACKUP_KEEP` | Number of backups to keep | `10` | `24` |
| `MEMORY_CLOUD_SAFE` | Cloud storage safe mode | `false` | `true` |
| `DEBUG` | Enable debug logging | `false` | `true` |

### Custom Database Location

```json
{
  "mcpServers": {
    "simple-memory": {
      "command": "simple-memory",
      "env": {
        "MEMORY_DB": "/path/to/your/memory.db"
      }
    }
  }
}
```

### With Automatic Backups

```json
{
  "mcpServers": {
    "simple-memory": {
      "command": "simple-memory",
      "env": {
        "MEMORY_DB": "/home/user/memory.db",
        "MEMORY_BACKUP_PATH": "/home/user/OneDrive/MCP-Backups",
        "MEMORY_BACKUP_INTERVAL": "180",
        "MEMORY_BACKUP_KEEP": "24"
      }
    }
  }
}
```

**💡 Backup Strategy:**
- **Lazy backups** - Only backs up after write operations
- **Throttled** - Won't backup again until interval passes
- **Efficient** - No wasted backups when idle

### Multiple Database Instances

Run multiple instances for different contexts:

```json
{
  "mcpServers": {
    "memory-work": {
      "command": "simple-memory",
      "env": {
        "MEMORY_DB": "/path/to/work-memory.db"
      }
    },
    "memory-personal": {
      "command": "simple-memory",
      "env": {
        "MEMORY_DB": "/path/to/personal-memory.db"
      }
    }
  }
}
```

---

## 🗄️ Database

### Technology

- **SQLite** with WAL mode for better concurrency
- **FTS5** for lightning-fast full-text search
- **Normalized tags** with proper indexing (50-200x faster than LIKE queries)
- **Automatic relationships** between related memories

### Schema Features

- ✅ Automatic migrations with data integrity guarantees
- ✅ Optimized indexes on all hot paths
- ✅ Prepared statements for all queries
- ✅ 64MB cache with memory-based temp storage
- ✅ Transaction-based bulk operations

### Size Limits

- Maximum content size: 5MB per memory
- No limit on number of memories
- No limit on number of tags

---

## 🔧 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/chrisribe/simple-memory-mcp.git
cd simple-memory-mcp

# Install dependencies
npm install

# Build
npm run build
```

### Commands

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run all tests (28 tests)
npm run test:all

# Run specific test suites
npm test              # Core functionality (9 tests)
npm run test:perf     # Performance tests (6 tests)
npm run test:migration # Migration tests (13 tests)

# Performance benchmarks
npm run benchmark

# Link globally for testing
npm link
simple-memory memory-stats
```

### Testing

The project has comprehensive test coverage:

- ✅ **Core Tests** (9) - CRUD operations, search, basic functionality
- ✅ **Performance Tests** (6) - Large content, size limits, throughput
- ✅ **Migration Tests** (13) - Schema upgrades, rollback safety, data integrity
- ✅ **Benchmarks** - Detailed performance metrics

All tests pass with 100% backward compatibility.

---

## 📝 Examples

### Example 1: Project Memory System

```bash
# Store project decisions
simple-memory store-memory \
  --content "Decided to use PostgreSQL for user data" \
  --tags "decisions,database,project-alpha"

# Store meeting notes
simple-memory store-memory \
  --content "Team agreed on 2-week sprints starting Monday" \
  --tags "meetings,agile,project-alpha"

# Search project memories
simple-memory search-memory --tags "project-alpha"

# Search for database-related decisions
simple-memory search-memory --query "database" --tags "decisions"
```

### Example 2: Personal Knowledge Base

```bash
# Store learning notes
simple-memory store-memory \
  --content "TypeScript generics allow for type-safe reusable components" \
  --tags "typescript,learning,programming"

# Store code snippets
simple-memory store-memory \
  --content "Use Array.reduce() for transforming arrays to single values" \
  --tags "javascript,snippets,arrays"

# Find all programming tips
simple-memory search-memory --tags "programming"

# Search for specific concepts
simple-memory search-memory --query "generics"
```

### Example 3: AI Assistant Context

When using with an AI assistant through MCP:

- **"Remember that I'm working on a React project with TypeScript"**
  - Assistant stores this with tags like `project`, `react`, `typescript`

- **"What did I tell you about my tech stack?"**
  - Assistant searches memories for relevant context

- **"Store this API key for later: ABC123"**
  - Assistant stores securely with appropriate tags

- **"Show me all my API keys"**
  - Assistant retrieves all memories tagged with `api-key`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Powered by [SQLite](https://www.sqlite.org/) and [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

## 📚 Additional Resources

- [Cloud Storage Setup](CLOUD-STORAGE.md) - Configure backups to OneDrive/Dropbox
- [Changelog](CHANGELOG.md) - Version history and changes

---

## 🐛 Issues & Support

Found a bug or have a feature request?

- 🐛 [Report Issues](https://github.com/chrisribe/simple-memory-mcp/issues)
- 💬 [Start a Discussion](https://github.com/chrisribe/simple-memory-mcp/discussions)
- 📧 Check the [documentation](https://github.com/chrisribe/simple-memory-mcp)

---

<div align="center">

**[⬆ back to top](#-simple-memory-mcp-server)**

Made with ❤️ by [chrisribe](https://github.com/chrisribe)

</div>

