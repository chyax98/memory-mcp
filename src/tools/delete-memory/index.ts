import type { Tool } from '../../types/tools.js';
import { execute } from './executor.js';
import { parseCliArgs } from './cli-parser.js';

export const deleteMemoryTool: Tool = {
  definition: {
    name: 'delete-memory',
    description: 'Delete a specific memory by hash or delete all memories with specific tags',
    inputSchema: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: 'Hash of the memory to delete'
        },
        tag: {
          type: 'string',
          description: 'Delete all memories with this tag'
        }
      }
    }
  },
  handler: execute,
  cliParser: parseCliArgs
};
