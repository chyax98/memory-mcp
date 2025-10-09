import { parseCommandLineArgs } from '../../utils/cli-parser.js';

export function parseCliArgs(args: string[]) {
  // PHASE 1: Convert string array to object (shared utility)
  const rawArgs = parseCommandLineArgs(args);

  // PHASE 2: Validate and transform (command-specific logic)
  const result: any = {};
  
  if (rawArgs.input) {
    result.input = rawArgs.input;
  }
  
  if (rawArgs.skipDuplicates !== undefined) {
    result.skipDuplicates = rawArgs.skipDuplicates; // Already a boolean
  }
  
  if (rawArgs.preserveTimestamps !== undefined) {
    result.preserveTimestamps = rawArgs.preserveTimestamps; // Already a boolean
  }
  
  if (rawArgs.dryRun !== undefined) {
    result.dryRun = rawArgs.dryRun; // Already a boolean
  }
  
  // Validation
  if (!result.input) {
    throw new Error('--input is required');
  }
  
  return result;
}
