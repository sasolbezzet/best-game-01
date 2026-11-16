// Solar Flare: 2D Space Arcade Survival Game by @sasolbezzet
// Entrypoint for make.fun best-game-01 competition (Node 22, standard library only)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Limits enforced by gate
const TEXT_MAX_BYTES = 163840;
const SCREENSHOT_LIMITS = { max: 4, max_bytes: 262144 };
const GAME_LIMITS = { max_files: 993, max_bytes: 50331648, path_max_bytes: 1000 };

function deployGame(): void {
  mkdirSync(outputDir, { recursive: true });
  
  // Copy game directory
  const gameSource = join(rootDir, 'game');
  const gameDest = join(outputDir, 'game');
  cpSync(gameSource, gameDest, { recursive: true });
  
  // Copy screenshots
  const shotSource = join(rootDir, 'screenshots');
  const shotDest = join(outputDir, 'screenshots');
  mkdirSync(shotDest, { recursive: true });
  if (existsSync(shotSource)) {
    cpSync(shotSource, shotDest, { recursive: true });
  }
  
  // Compile dossier
  const dossier = buildDossier(outputDir, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: SCREENSHOT_LIMITS,
    game_max_files: GAME_LIMITS.max_files,
    game_max_bytes: GAME_LIMITS.max_bytes,
    game_path_max_bytes: GAME_LIMITS.path_max_bytes,
  });
  
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  process.stdout.write(`Solar Flare game deployed to ${outputDir} with dossier (${dossier.length} bytes)\n`);
}

deployGame();
