#!/usr/bin/env node
/**
 * Compiles the shared kit plus its tests, then runs them with Node's built-in
 * test runner.
 *
 * node:test ships with Node 22, so the whole suite needs no test framework,
 * no transpiler beyond the TypeScript already in the repo, and no extra
 * dependency in any of the seven services.
 *
 *   npm test
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = path.join(root, 'microservices', 'shared');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

if (!existsSync(tsc)) {
    console.error('TypeScript is not installed. Run: npm install');
    process.exit(1);
}

console.log('Compiling the shared kit and tests...');
const build = spawnSync(process.execPath, [tsc, '-p', path.join(sharedDir, 'tsconfig.test.json')], {
    stdio: 'inherit',
    cwd: root,
});

if (build.status !== 0) {
    console.error('\nCompilation failed, so the tests were not run.');
    process.exit(build.status ?? 1);
}

const testDir = path.join(sharedDir, 'test-build', '__tests__');

// Explicit file list rather than handing the runner a directory: directory
// discovery depends on Node's default naming patterns and quietly matches
// nothing when they do not line up, which reads as a pass.
const testFiles = readdirSync(testDir)
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => path.join(testDir, name))
    .sort();

if (testFiles.length === 0) {
    console.error('No compiled test files were found.');
    process.exit(1);
}

console.log(`\nRunning ${testFiles.length} test files\n`);

const run = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit', cwd: root });
process.exit(run.status ?? 1);
