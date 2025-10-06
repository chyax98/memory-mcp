# Memory Server Tests

Comprehensive test suite to verify the Simple Memory MCP Server functionality.

## Running Tests

```bash
# Run all TypeScript tests
npm test

# Run performance benchmarks
npm run test:perf

# Run both test suites
npm run test:all

# PowerShell validation test
.\src\tests\test-lazy-backup.ps1    # Backup throttling test (~70 seconds)
```

## Test Coverage

### TypeScript Tests (npm test)
- **Basic Operations**: Store, search, delete memories
- **Tag-based Operations**: Search and filter by tags
- **Relationship Features**: Auto-linking and explicit relationships  
- **Enhanced Search**: Include related memories in search results
- **CLI Functionality**: All command-line tools and argument parsing
- **JSON Output**: Validation of all API responses
- **Database Operations**: Persistence, statistics, cleanup
- **Migration System**: Schema versioning and upgrades

### Performance Tests (npm run test:perf)
- **Large Content**: 1KB - 1MB memory storage
- **Search Performance**: FTS5 query speed validation
- **Database Size**: Efficiency metrics
- **Throughput**: Operations per second

### PowerShell Tests
- **Lazy Backup**: Tests backup creation, throttling, and persistence across CLI invocations

## Test Files

```
src/tests/
├── README.md                      # This file
├── memory-server-tests.ts         # Comprehensive functionality tests
├── performance-test.ts            # Large content and performance validation
├── performance-benchmark.ts       # Speed and throughput benchmarks
├── migration-test.ts              # Schema migration testing
└── test-lazy-backup.ps1           # Backup throttling test (~70s)
```

Tests automatically clean up their test databases after completion.
