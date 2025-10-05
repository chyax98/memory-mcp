#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from 'dotenv';
config();

import { MemoryService } from './services/memory-service.js';
import { toolRegistry } from './tools/index.js';
import type { ToolContext } from './types/tools.js';
import { debugLog } from './utils/debug.js';

// Initialize server
const server = new Server(
  {
    name: 'simple-memory-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Initialize services and start server
function initializeServices(): MemoryService {
  let memoryService: MemoryService;

  try {
    // Use environment variable or default path
    const dbPath = process.env.MEMORY_DB || './memory.db';
    memoryService = new MemoryService(dbPath);
    memoryService.initialize();
    debugLog('Memory service initialized');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }

  return memoryService;
}

// Initialize and get memory service
const memoryService = initializeServices();

// Create tool context
const toolContext: ToolContext = {
  memoryService,
  config: {}
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolRegistry.getDefinitions(),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  debugLog('Tool call:', name, 'with args:', args);
  
  try {
    const result = await toolRegistry.handle(name, args || {}, toolContext);
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    debugLog('Tool error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Simple Memory MCP Server does not provide prompts. Use tools: ${toolRegistry.getToolNames().join(', ')}`,
        },
      },
    ],
  };
});

// Start server or run CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // CLI mode
    const [toolName, ...toolArgs] = args;
    
    if (!toolRegistry.hasTool(toolName)) {
      console.error(`Unknown tool: ${toolName}`);
      console.error('Available tools:', toolRegistry.getToolNames().join(', '));
      process.exit(1);
    }
    
    try {
      const parser = toolRegistry.getCliParser(toolName);
      const parsedArgs = parser ? parser(toolArgs) : {};
      const result = await toolRegistry.handle(toolName, parsedArgs, toolContext);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  } else {
    // MCP mode
    const transport = new StdioServerTransport();
    await server.connect(transport);
    debugLog('Simple Memory MCP server running on stdio');
  }
}

// Handle cleanup
const cleanup = () => {
  if (memoryService) {
    memoryService.close();
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  cleanup();
});

main().catch((error) => {
  console.error('Fatal error:', error);
  cleanup();
});
