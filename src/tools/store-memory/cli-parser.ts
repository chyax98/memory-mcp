import { parseCommandLineArgs } from '../../utils/cli-parser.js';

export function parseCliArgs(args: string[]) {
  // PHASE 1: Convert string array to object (shared utility)
  const rawArgs = parseCommandLineArgs(args);

  // PHASE 2: Validate and transform (command-specific logic)
  const result: any = {
    autoLink: true // Default to true
  };
  
  if (rawArgs.content) result.content = rawArgs.content;
  if (rawArgs.tags) result.tags = (rawArgs.tags as string).split(',').map((tag: string) => tag.trim());
  if (rawArgs.autoLink) {
      result.autoLink = Boolean(rawArgs.autoLink);
  }
  if (rawArgs.relateTo) result.relateTo = (rawArgs.relateTo as string).split(',').map((tag: string) => tag.trim());
  
  return result;
}
