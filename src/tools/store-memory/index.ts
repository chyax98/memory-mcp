import type { Tool } from '../../types/tools.js';
import { execute } from './executor.js';
import { parseCliArgs } from './cli-parser.js';

export const storeMemoryTool: Tool = {
  definition: {
    name: 'store-memory',
    description: `Store a memory with optional tags and automatic relationship detection.

🧠 AUTO-CAPTURE MODE: Use this tool proactively during conversations to capture important information WITHOUT waiting for explicit user requests.

ALWAYS CAPTURE (automatically):
✓ User preferences, opinions, likes/dislikes ("I prefer X", "I like Y")
✓ Decisions made during conversation ("Let's go with option A")
✓ Facts about people mentioned (names, roles, relationships)
✓ Facts about projects or work (names, status, goals, technologies)
✓ Learnings, insights, realizations ("I learned that...", "I discovered...")
✓ Action items, commitments, TODOs ("I need to...", "Remember to...")
✓ Technical knowledge or discoveries
✓ User corrections or clarifications about past information

NEVER CAPTURE (skip these):
✗ Casual greetings, small talk, farewells
✗ Temporary information (current weather, time, date)
✗ Purely transactional exchanges
✗ Simple questions or clarifications
✗ Sensitive personal data (unless explicitly requested by user)

BEHAVIOR:
• Store SILENTLY - don't announce "I've saved that to memory"
• Use clear, descriptive tags for easy retrieval (e.g., "preferences", "decisions", "project-name")
• Link related memories using autoLink or relateTo parameters
• Be thoughtful about long-term value - not everything needs storage

EXAMPLE:
User: "I really prefer TypeScript over JavaScript for its type safety"
You: [Continue conversation naturally about TypeScript...]
Background action: store-memory("User prefers TypeScript over JavaScript for type safety", tags: ["preferences", "typescript", "javascript"])`,
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
