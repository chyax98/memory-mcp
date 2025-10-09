import { readFileSync } from 'fs';
import type { ToolContext, ImportOptions, ImportResult } from '../../types/tools.js';

export interface ImportMemoryResult extends ImportResult {
  success: boolean;
  inputPath: string;
  dryRun?: boolean;
}

export async function execute(args: any, context: ToolContext): Promise<ImportMemoryResult> {
  const { memoryService } = context;

  // Read JSON file
  const jsonData = readFileSync(args.input, 'utf-8');

  if (args.dryRun) {
    // Parse and validate without importing
    const exportData = JSON.parse(jsonData);
    return {
      success: true,
      inputPath: args.input,
      imported: 0,
      skipped: 0,
      errors: [],
      dryRun: true
    };
  }

  // Build import options
  const options: ImportOptions = {
    skipDuplicates: args.skipDuplicates,
    preserveTimestamps: args.preserveTimestamps
  };

  // Import memories
  const result = memoryService.importMemories(jsonData, options);

  return {
    success: result.errors.length === 0,
    inputPath: args.input,
    ...result
  };
}
