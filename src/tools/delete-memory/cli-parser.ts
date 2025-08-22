export function parseCliArgs(args: string[]) {
  const result: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--hash' && i + 1 < args.length) {
      result.hash = args[++i];
    } else if (arg === '--tag' && i + 1 < args.length) {
      result.tag = args[++i];
    } else if (arg === '--help') {
      console.log(`
Usage: delete-memory [options]

Options:
  --hash <hash>        Hash of specific memory to delete
  --tag <tag>          Delete all memories with this tag
  --help               Show this help message

Examples:
  delete-memory --hash a1b2c3d4
  delete-memory --tag "old-notes"
`);
      process.exit(0);
    }
  }
  
  return result;
}
