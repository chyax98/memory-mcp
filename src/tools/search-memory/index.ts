import type { Tool } from '../../types/tools.js';
import { execute } from './executor.js';
import { parseCliArgs } from './cli-parser.js';

export const searchMemoryTool: Tool = {
  definition: {
    name: 'search-memory',
    description: 'Search stored memories by content or tags, with optional relationship traversal',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in memory content'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to filter by'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
          minimum: 1
        },
        includeRelated: {
          type: 'boolean',
          description: 'Include related memories in results (default: false)',
          default: false
        },
        relationshipDepth: {
          type: 'number',
          description: 'Depth of relationship traversal when includeRelated is true (default: 1)',
          default: 1,
          minimum: 1,
          maximum: 3
        }
      }
    }
  },
  handler: execute,
  cliParser: parseCliArgs
};
