#!/usr/bin/env node
/**
 * Copies microservices/shared/ into every service at src/shared/.
 *
 * Each service has its own Dockerfile with its own directory as the build
 * context, so it cannot COPY from a sibling folder, and there is no npm
 * workspace linking them. Vendoring a copy is the option that keeps both
 * `npm run dev` and `docker compose build` working without extra tooling.
 *
 * The copies are generated -- edit microservices/shared/ and re-run this.
 *
 *   node scripts/sync-shared.mjs          write the copies
 *   node scripts/sync-shared.mjs --check  fail if any copy is stale (used by CI)
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'microservices', 'shared');
const checkOnly = process.argv.includes('--check');

const BANNER = [
    '// GENERATED FILE -- do not edit.',
    '// Source: microservices/shared/%NAME%',
    '// Regenerate with: npm run sync:shared',
    '',
].join('\n');

const services = (await readdir(path.join(root, 'microservices'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('-service'))
    .map((entry) => entry.name);

const sourceFiles = (await readdir(sourceDir)).filter((name) => name.endsWith('.ts'));

let stale = 0;
let written = 0;

for (const service of services) {
    const targetDir = path.join(root, 'microservices', service, 'src', 'shared');
    if (!checkOnly) await mkdir(targetDir, { recursive: true });

    for (const fileName of sourceFiles) {
        const contents = BANNER.replace('%NAME%', fileName) + (await readFile(path.join(sourceDir, fileName), 'utf8'));
        const targetPath = path.join(targetDir, fileName);

        if (checkOnly) {
            const current = existsSync(targetPath) ? await readFile(targetPath, 'utf8') : null;
            if (current !== contents) {
                console.error(`stale: ${path.relative(root, targetPath)}`);
                stale += 1;
            }
            continue;
        }

        await writeFile(targetPath, contents, 'utf8');
        written += 1;
    }
}

if (checkOnly) {
    if (stale > 0) {
        console.error(`\n${stale} vendored file(s) are out of date. Run: npm run sync:shared`);
        process.exit(1);
    }
    console.log(`shared kit is in sync across ${services.length} services`);
} else {
    console.log(`synced ${sourceFiles.length} shared files into ${services.length} services (${written} files written)`);
}
