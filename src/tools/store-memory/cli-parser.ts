export function parseCliArgs(args: string[]) {
  const result: any = {
    autoLink: true // Default to true
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--content' && i + 1 < args.length) {
      result.content = args[++i];
    } else if (arg === '--tags' && i + 1 < args.length) {
      result.tags = args[++i].split(',').map(tag => tag.trim());
    } else if (arg === '--auto-link') {
      result.autoLink = true;
    } else if (arg === '--no-auto-link') {
      result.autoLink = false;
    } else if (arg === '--relate-to' && i + 1 < args.length) {
      result.relateTo = args[++i].split(',').map(tag => tag.trim());
    } else if (arg === '--help') {
      console.log(`
Usage: store-memory [options]

Options:
  --content <text>         Content to store (required)
  --tags <tag1,tag2>       Comma-separated tags (optional)
  --auto-link              Enable automatic relationship detection (default)
  --no-auto-link           Disable automatic relationship detection
  --relate-to <tag1,tag2>  Explicitly link to memories with these tags
  --help                   Show this help message

Examples:
  store-memory --content "Build 12345 failed due to timeout" --tags "build,failure,timeout"
  store-memory --content "Advanced Express patterns" --tags "express,advanced" --relate-to "nodejs,tutorial"
  store-memory --content "Private notes" --tags "personal" --no-auto-link
`);
      process.exit(0);
    }
  }
  
  return result;
}
