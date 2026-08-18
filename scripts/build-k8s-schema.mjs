#!/usr/bin/env node
/**
 * Regenerates k8s/06-postgres-schema.yaml from the SQL files.
 *
 * That ConfigMap used to be a hand-copied duplicate of the schema, which is
 * exactly the kind of thing that silently drifts: a migration lands in
 * database/migrations/ and the cluster keeps building databases from a schema
 * six weeks old. Generating it means there is one source of truth.
 *
 *   node scripts/build-k8s-schema.mjs          write the ConfigMap
 *   node scripts/build-k8s-schema.mjs --check  fail if it is stale (used by CI)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'k8s', '06-postgres-schema.yaml');
const checkOnly = process.argv.includes('--check');

const SOURCES = [
    ['database/markit_roofing.sql', 'Base schema'],
    ['database/migrations/001_cost_estimate_dimensions.sql', 'Migration 001 - estimate materials and roof dimensions'],
    ['database/migrations/002_platform_hardening.sql', 'Migration 002 - platform hardening'],
];

let out = `apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init-script
data:
  # GENERATED FILE -- do not edit by hand.
  # Regenerate with: node scripts/build-k8s-schema.mjs
  #
  # Postgres runs everything in /docker-entrypoint-initdb.d once, on an empty
  # data directory, in filename order. Keeping the base schema and the
  # migrations as separate keys means a fresh cluster ends up in exactly the
  # same state as a developer machine that has run them in sequence -- rather
  # than drifting because someone hand-copied the schema into this file and
  # forgot a later change.
`;

for (const [relativePath, title] of SOURCES) {
    const key = path.basename(relativePath);
    const sql = (await readFile(path.join(root, relativePath), 'utf8')).replace(/\n+$/, '');
    out += `\n  # --- ${title} ---\n  ${key}: |\n`;
    for (const line of sql.split('\n')) {
        out += line.trim() ? `    ${line}\n` : '\n';
    }
}

if (checkOnly) {
    const current = existsSync(target) ? await readFile(target, 'utf8') : null;
    if (current !== out) {
        console.error('k8s/06-postgres-schema.yaml is out of date. Run: npm run build:k8s-schema');
        process.exit(1);
    }
    console.log('k8s schema ConfigMap is in sync');
} else {
    await writeFile(target, out, 'utf8');
    console.log(`wrote ${path.relative(root, target)} from ${SOURCES.length} SQL files`);
}
