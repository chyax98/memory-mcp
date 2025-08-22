# Memory Server Tests

Comprehensive test suite to verify the Simple Memory MCP Server functionality.

## Running Tests

```bash
# Run all tests
npm test
```

## Test Coverage

- **Basic Operations**: Store, search, delete memories
- **Tag-based Operations**: Search and filter by tags
- **Relationship Features**: Auto-linking and explicit relationships  
- **Enhanced Search**: Include related memories in search results
- **CLI Functionality**: All command-line tools and argument parsing
- **JSON Output**: Validation of all API responses
- **Database Operations**: Persistence, statistics, cleanup

The test suite includes comprehensive validation of:
- Memory storage with auto-linking relationships
- Explicit relationship creation via `--relate-to`
- Enhanced search with `--include-related` flag
- Memory statistics including relationship counts
- Proper cleanup and database management

Tests automatically clean up their test database after completion.
