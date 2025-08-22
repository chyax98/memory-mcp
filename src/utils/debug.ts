// Debug logging utilities

export function debugLog(message: string, ...args: any[]) {
  // Always use stderr for debug output
  // Check for DEBUG env var or CLI mode
  if (process.env.DEBUG === 'true' || process.argv.length > 2) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}

export function debugToolCall(name: string, args: any) {
  // Only log in CLI mode, not MCP mode
  if (process.argv.length > 2) {
    debugLog(`MCP Tool called: ${name}`);
    debugLog(`Arguments:`, JSON.stringify(args, null, 2));
    debugLog(`Timestamp:`, new Date().toISOString());
  }
}

// Alias for compatibility
export const debugMCP = debugLog;
