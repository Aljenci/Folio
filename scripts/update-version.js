#!/usr/bin/env node

/**
 * Updates version numbers across all configuration files.
 * 
 * Usage: node scripts/update-version.js <version>
 * Example: node scripts/update-version.js 1.0.1
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/update-version.js <version>');
  console.error('Example: node scripts/update-version.js 1.0.1');
  process.exit(1);
}

// Validate version format (semver)
const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)(-.+)?$/;
const normalizedVersion = version.startsWith('v') ? version.slice(1) : version;
if (!semverRegex.test(version)) {
  console.error(`Invalid version format: ${version}`);
  console.error('Expected format: 1.0.1 or v1.0.1');
  process.exit(1);
}

console.log(`Updating version to ${normalizedVersion}...`);

// Files to update
const files = [
  {
    path: join(rootDir, 'src/version.ts'),
    pattern: /export const APP_VERSION = "([^"]+)";/,
    replacement: `export const APP_VERSION = "${normalizedVersion}";`
  },
  {
    path: join(rootDir, 'src-tauri/tauri.conf.json'),
    pattern: /"version": "([^"]+)"/,
    replacement: `"version": "${normalizedVersion}"`
  },
  {
    path: join(rootDir, 'src-tauri/tauri.conf.json'),
    pattern: /"title": "Folio ([^"]+)"/,
    replacement: `"title": "Folio ${normalizedVersion}"`
  },
  {
    path: join(rootDir, 'package.json'),
    pattern: /"version": "([^"]+)"/,
    replacement: `"version": "${normalizedVersion}"`
  }
];

// Update each file
for (const file of files) {
  try {
    const content = readFileSync(file.path, 'utf-8');
    const updatedContent = content.replace(file.pattern, file.replacement);
    
    if (updatedContent === content) {
      console.log(`⚠️  No changes needed in ${file.path}`);
      continue;
    }
    
    writeFileSync(file.path, updatedContent, 'utf-8');
    console.log(`✅ Updated ${file.path}`);
  } catch (error) {
    console.error(`❌ Error updating ${file.path}:`, error.message);
    process.exit(1);
  }
}

console.log(`\n✅ Version updated to ${normalizedVersion}`);