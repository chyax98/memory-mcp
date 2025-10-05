// Debug logging utilities

/**
 * Check if debug logging is enabled
 */
function isDebugEnabled(): boolean {
  return process.env.DEBUG === 'true' || process.argv.length > 2;
}

/**
 * Main debug logging function
 */
export function debugLog(message: string, ...args: any[]) {
  // Always use stderr for debug output
  // Check for DEBUG env var or CLI mode
  if (isDebugEnabled()) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Format hash for display (first 8 chars + ellipsis)
 */
export function formatHash(hash: string): string {
  return hash.length > 8 ? hash.substring(0, 8) + '...' : hash;
}

/**
 * Debug log with hash formatting
 */
export function debugLogHash(message: string, hash: string, ...args: any[]) {
  if (isDebugEnabled()) {
    debugLog(message, formatHash(hash), ...args);
  }
}

/**
 * Debug log with multiple hash formatting
 */
export function debugLogHashes(message: string, ...hashes: string[]) {
  if (isDebugEnabled()) {
    const formatted = hashes.map(formatHash).join(', ');
    debugLog(message, formatted);
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
