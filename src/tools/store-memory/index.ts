import type { Tool } from '../../types/tools.js';
import { execute } from './executor.js';
import { parseCliArgs } from './cli-parser.js';

export const storeMemoryTool: Tool = {
  definition: {
    name: 'store-memory',
    description: 'Store a memory with optional tags and automatic relationship detection',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to store in memory'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags to associate with this memory',
          default: []
        },
        autoLink: {
          type: 'boolean',
          description: 'Automatically create relationships with similar memories (default: true)',
          default: true
        },
        relateTo: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to explicitly link this memory to existing memories with matching tags',
          default: []
        }
      },
      required: ['content']
    }
  },
  handler: execute,
  cliParser: parseCliArgs
};
