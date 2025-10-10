import { parseCommandLineArgs } from '../../utils/cli-parser.js';

export function parseCliArgs(args: string[]) {
  // PHASE 1: Convert string array to object (shared utility)
  const rawArgs = parseCommandLineArgs(args);

  // PHASE 2: Validate and transform (command-specific logic)
  const result: any = {};
  
  if (rawArgs.hash) result.hash = rawArgs.hash;
  if (rawArgs.content) result.content = rawArgs.content;
  
  // Tags are optional - if provided, they replace existing tags
  if (rawArgs.tags) {
    result.tags = (rawArgs.tags as string).split(',').map((tag: string) => tag.trim());
  }
  
  return result;
}
