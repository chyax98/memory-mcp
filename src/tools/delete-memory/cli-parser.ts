import { parseCommandLineArgs } from '../../utils/cli-parser.js';

export function parseCliArgs(args: string[]) {
  // PHASE 1: Convert string array to object (shared utility)
  const rawArgs = parseCommandLineArgs(args);

  // PHASE 2: Validate and transform (command-specific logic)
  const result: any = {};
  
  if (rawArgs.hash) result.hash = rawArgs.hash;
  if (rawArgs.tag) result.tag = rawArgs.tag;
  
  return result;
}
