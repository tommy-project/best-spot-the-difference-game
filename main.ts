// main.ts — the entry's hand-in program (Node 22, standard library only).
// One job: copy game/ and screenshots/ from this repository into the output
// directory and write /output/dossier.json exactly as buildDossier writes
// it from those files, so the gate can compare the two byte for byte.
// Run locally as: MAKEFUN_OUTPUT_DIR=out node main.ts

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const from = join(REPO_ROOT, name);
  const to = join(OUTPUT_DIR, name);
  if (!existsSync(from)) throw new Error(`main.ts: missing ${name}/ in ${REPO_ROOT}`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

function main(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTree('game');
  copyTree('screenshots');
  const dossier = buildDossier(REPO_ROOT, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
}

main();
