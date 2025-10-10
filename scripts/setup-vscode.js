#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Automatically configure VS Code MCP settings for simple-memory
 * Creates/updates mcp.json in VS Code user directory
 */

const MCP_CONFIG = {
  "simple-memory-mcp": {
    "command": "simple-memory"
  }
};

function getVSCodeConfigPaths() {
  const platform = process.platform;
  const home = homedir();
  const paths = [];
  
  if (platform === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    paths.push(
      { name: 'VS Code', path: join(appData, 'Code', 'User') },
      { name: 'VS Code Insiders', path: join(appData, 'Code - Insiders', 'User') }
    );
  } else if (platform === 'darwin') {
    const appSupport = join(home, 'Library', 'Application Support');
    paths.push(
      { name: 'VS Code', path: join(appSupport, 'Code', 'User') },
      { name: 'VS Code Insiders', path: join(appSupport, 'Code - Insiders', 'User') }
    );
  } else {
    const config = join(home, '.config');
    paths.push(
      { name: 'VS Code', path: join(config, 'Code', 'User') },
      { name: 'VS Code Insiders', path: join(config, 'Code - Insiders', 'User') }
    );
  }
  
  return paths;
}

function configureVSCode(name, vscodeUserPath) {
  const mcpJsonPath = join(vscodeUserPath, 'mcp.json');
  
  if (!existsSync(vscodeUserPath)) {
    return { success: false, reason: 'not-found' };
  }
  
  console.log(`\n✅ ${name} detected!`);
  
  let mcpConfig = {};
  let serversProp = 'mcpServers'; // Default for VS Code stable
  
  // Read existing mcp.json if it exists
  if (existsSync(mcpJsonPath)) {
    try {
      mcpConfig = JSON.parse(readFileSync(mcpJsonPath, 'utf8'));
      
      // Detect which property is used (Insiders uses "servers", stable uses "mcpServers")
      if (mcpConfig.servers) {
        serversProp = 'servers';
      } else if (mcpConfig.mcpServers) {
        serversProp = 'mcpServers';
      }
      
      // Ensure the property exists
      if (!mcpConfig[serversProp]) {
        mcpConfig[serversProp] = {};
      }
    } catch (error) {
      console.log(`⚠️  Could not parse mcp.json for ${name}`);
      return { success: false, reason: 'parse-error' };
    }
  } else {
    // New file - use mcpServers for stable, will be overridden if needed
    mcpConfig[serversProp] = {};
  }
  
  // Check if already configured
  if (mcpConfig[serversProp]['simple-memory-mcp']) {
    console.log(`✅ Already configured in ${name}`);
    return { success: true, reason: 'already-configured' };
  }
  
  // Add simple-memory-mcp config
  mcpConfig[serversProp]['simple-memory-mcp'] = MCP_CONFIG['simple-memory-mcp'];
  
  try {
    mkdirSync(vscodeUserPath, { recursive: true });
    writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
    console.log(`✅ Added to ${name} mcp.json`);
    console.log(`   Location: ${mcpJsonPath}`);
    return { success: true, reason: 'configured' };
  } catch (error) {
    console.error(`❌ Failed to update ${name} mcp.json:`, error.message);
    return { success: false, reason: 'write-error' };
  }
}

function main() {
  const vscodeInstalls = getVSCodeConfigPaths();
  let configuredCount = 0;
  let foundCount = 0;
  
  console.log('\n🔧 Checking for VS Code installations...');
  
  for (const install of vscodeInstalls) {
    const result = configureVSCode(install.name, install.path);
    if (result.success) {
      foundCount++;
      if (result.reason === 'configured') {
        configuredCount++;
      }
    }
  }
  
  if (foundCount === 0) {
    console.log('\nℹ️  No VS Code installations detected');
    console.log('   Add this to your VS Code User/mcp.json manually:');
    console.log(JSON.stringify(MCP_CONFIG, null, 2));
  } else if (configuredCount > 0) {
    console.log('\n🎉 Configuration complete!');
    console.log('   Restart VS Code and simple-memory-mcp will be available');
  } else {
    console.log('\n✅ All installations already configured');
  }
}

main();
