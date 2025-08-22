export function parseCliArgs(args: string[]) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help') {
      console.log(`
Usage: memory-stats

Shows statistics about stored memories including:
- Total number of memories
- Total number of relationships
- Database size

Examples:
  memory-stats
`);
      process.exit(0);
    }
  }
  
  return {};
}
