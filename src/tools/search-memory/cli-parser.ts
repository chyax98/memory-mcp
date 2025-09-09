import { parseCommandLineArgs } from '../../utils/cli-parser.js';

export function parseCliArgs(args: string[]) {
  // PHASE 1: Convert string array to object (shared utility)
  const rawArgs = parseCommandLineArgs(args);

  // PHASE 2: Validate and transform (command-specific logic)
  const result: any = {
    includeRelated: false,
    relationshipDepth: 1
  };
  
  if (rawArgs.query) result.query = rawArgs.query;
  if (rawArgs.tags) result.tags = (rawArgs.tags as string).split(',').map((tag: string) => tag.trim());
  if (rawArgs.limit) result.limit = parseInt(rawArgs.limit as string);
  if (rawArgs.includeRelated) {
    result.includeRelated = Boolean(rawArgs.includeRelated);
  }
  if (rawArgs.depth) {
    const depth = parseInt(rawArgs.depth as string);
    result.relationshipDepth = Math.min(Math.max(depth, 1), 3); // Clamp between 1-3
  }
  
  return result;
}
