#!/usr/bin/env node
/**
 * Automatic version bumper for simple-memory-mcp
 * 
 * This script automatically bumps the patch version on every build.
 * You can manually bump minor/major versions using npm version commands.
 * 
 * Usage:
 *   node scripts/bump-version.js [patch|minor|major]
 *   Default: patch
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packagePath = join(__dirname, '..', 'package.json');

function bumpVersion(type = 'patch') {
  try {
    // Read package.json
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const currentVersion = packageJson.version;
    
    // Parse version
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    // Bump version based on type
    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    // Update package.json
    packageJson.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    
    console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error('❌ Failed to bump version:', error.message);
    process.exit(1);
  }
}

// Get bump type from command line args (default: patch)
const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: patch, minor, or major');
  process.exit(1);
}

bumpVersion(bumpType);
