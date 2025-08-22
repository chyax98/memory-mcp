import type { Tool } from '../../types/tools.js';
import { execute } from './executor.js';
import { parseCliArgs } from './cli-parser.js';

export const memoryStatsTool: Tool = {
  definition: {
    name: 'memory-stats',
    description: 'Get statistics about stored memories and database usage',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  handler: execute,
  cliParser: parseCliArgs
};
