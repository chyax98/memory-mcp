export function parseCliArgs(args: string[]) {
  const result: any = {
    includeRelated: false,
    relationshipDepth: 1
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--query' && i + 1 < args.length) {
      result.query = args[++i];
    } else if (arg === '--tags' && i + 1 < args.length) {
      result.tags = args[++i].split(',').map(tag => tag.trim());
    } else if (arg === '--limit' && i + 1 < args.length) {
      result.limit = parseInt(args[++i]);
    } else if (arg === '--include-related') {
      result.includeRelated = true;
    } else if (arg === '--depth' && i + 1 < args.length) {
      const depth = parseInt(args[++i]);
      result.relationshipDepth = Math.min(Math.max(depth, 1), 3); // Clamp between 1-3
    } else if (arg === '--help') {
      console.log(`
Usage: search-memory [options]

Options:
  --query <text>         Text to search for in memory content
  --tags <tag1,tag2>     Comma-separated tags to filter by
  --limit <number>       Maximum results to return (default: 10)
  --include-related      Include related memories in results
  --depth <number>       Relationship traversal depth (1-3, default: 1)
  --help                 Show this help message

Examples:
  search-memory --query "build failure"
  search-memory --tags "dri,handoff"
  search-memory --query "express" --include-related --depth 2
  search-memory --query "timeout" --tags "build" --limit 5
`);
      process.exit(0);
    }
  }
  
  return result;
}
