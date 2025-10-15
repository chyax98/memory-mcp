import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface MCPConfigPath {
  name: string;
  path: string;
  exists: boolean;
}

/**
 * Get potential MCP configuration file paths for VS Code installations
 * Returns an array of config paths with their existence status
 * 
 * Note: Currently detects VS Code and VS Code Insiders. Other variants
 * like VSCodium, VS Code OSS, or Cursor are not detected.
 */
export function getMCPConfigPaths(): MCPConfigPath[] {
  const platform = process.platform;
  const home = homedir();
  const paths: MCPConfigPath[] = [];
  
  if (platform === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    paths.push(
      { name: 'VS Code', path: join(appData, 'Code', 'User', 'mcp.json'), exists: false },
      { name: 'VS Code Insiders', path: join(appData, 'Code - Insiders', 'User', 'mcp.json'), exists: false }
    );
  } else if (platform === 'darwin') {
    const appSupport = join(home, 'Library', 'Application Support');
    paths.push(
      { name: 'VS Code', path: join(appSupport, 'Code', 'User', 'mcp.json'), exists: false },
      { name: 'VS Code Insiders', path: join(appSupport, 'Code - Insiders', 'User', 'mcp.json'), exists: false }
    );
  } else {
    const config = join(home, '.config');
    paths.push(
      { name: 'VS Code', path: join(config, 'Code', 'User', 'mcp.json'), exists: false },
      { name: 'VS Code Insiders', path: join(config, 'Code - Insiders', 'User', 'mcp.json'), exists: false }
    );
  }
  
  // Check which paths actually exist
  for (const pathInfo of paths) {
    pathInfo.exists = existsSync(pathInfo.path);
  }
  
  return paths;
}
