/**
 * JSON parsing utilities for CLI output processing
 */

/**
 * Parse JSON output from CLI command, handling multi-line formatted JSON
 * and filtering out debug messages
 * 
 * @param output - Raw CLI output string
 * @returns Parsed JSON object or null if parsing fails
 */
export function parseJsonOutput(output: string): any {
  try {
    // Remove debug messages and parse JSON
    const lines = output.split('\n').filter(line => 
      !line.startsWith('[DEBUG]')
    );
    
    // Find where JSON starts and ends
    let jsonStartIndex = -1;
    let jsonEndIndex = -1;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStartIndex === -1) {
        jsonStartIndex = i;
      }
      
      if (jsonStartIndex >= 0) {
        // Count braces to find the end
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        if (braceCount === 0) {
          jsonEndIndex = i;
          break;
        }
      }
    }
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      console.error('Failed to find complete JSON in output:', output);
      return null;
    }
    
    // Reconstruct the JSON string
    const jsonLines = lines.slice(jsonStartIndex, jsonEndIndex + 1);
    const jsonString = jsonLines.join('\n');
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON output:', output, 'Error:', error);
    return null;
  }
}
