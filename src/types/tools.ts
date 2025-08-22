// Common tool interfaces and types

import type { MemoryService } from '../services/memory-service.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolContext {
  memoryService: MemoryService;
  config: Record<string, any>;
}

export interface ToolHandler {
  (args: any, context: ToolContext): Promise<any>;
}

export interface CliParser {
  (args: string[]): any;
}

export interface ToolCliMetadata {
  positionalArgs?: {
    name: string;
    description: string;
    required?: boolean;
  }[];
  options?: {
    name: string;
    description: string;
    hasValue?: boolean;
    example?: string;
  }[];
  examples?: string[];
}

// Tool interface that combines definition, handler, and optional CLI parser
export interface Tool {
  definition: ToolDefinition; // MCP schema definition
  handler: ToolHandler;       // Business logic handler
  cliParser?: CliParser;      // Optional CLI argument parser
  cliMetadata?: ToolCliMetadata; // Optional CLI metadata
}

