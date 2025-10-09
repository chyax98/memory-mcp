import type { Tool } from '../../types/tools.js';
import { parseCliArgs } from './cli-parser.js';
import { execute } from './executor.js';

export const importMemoryTool: Tool = {
  definition: {
    name: 'import-memory',
    description: 'Import memories from JSON file. Supports duplicate detection and timestamp preservation. Use for cross-machine sync or restoring backups.',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Input JSON file path (required)'
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip memories that already exist (by hash)',
          default: false
        },
        preserveTimestamps: {
          type: 'boolean',
          description: 'Keep original creation timestamps',
          default: false
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview import without making changes',
          default: false
        }
      },
      required: ['input']
    }
  },
  handler: execute,
  cliParser: parseCliArgs,
  cliMetadata: {
    options: [
      {
        name: '--input, -i',
        description: 'Input JSON file path',
        hasValue: true,
        example: '--input memories.json'
      },
      {
        name: '--skip-duplicates, -s',
        description: 'Skip memories that already exist',
        hasValue: false,
        example: '--skip-duplicates'
      },
      {
        name: '--preserve-timestamps',
        description: 'Keep original creation timestamps',
        hasValue: false,
        example: '--preserve-timestamps'
      },
      {
        name: '--dry-run',
        description: 'Preview without importing',
        hasValue: false,
        example: '--dry-run'
      }
    ],
    examples: [
      'import-memory --input memories.json',
      'import-memory --input backup.json --skip-duplicates',
      'import-memory --input export.json --preserve-timestamps'
    ]
  }
};

export default importMemoryTool;
