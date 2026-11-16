// Solar Flare: Orbital Defense & Extraction Tuning Configuration
// Fixed 1280x720 logical coordinate field, resolution-independent scaling.

export const FIELD = {
  width: 1280,
  height: 720,
  groundY: 660,
};

export const STEP = 1 / 60;

export const SHIP = {
  width: 68,
  height: 28,
  speed: 620,
  invulnerable: 1.8,
};

export const SHIELDS = 3;

export const SOLAR_FLARE = {
  minWidth: 42,
  maxWidth: 114,
  height: 38,
  speed: 260,
  speedPerSector: 32,
  speedJitter: 95,
  interval: 0.52,
  intervalScale: 0.86,
  minInterval: 0.12,
  evadePoints: 5,
};

export const PLASMA_CORE = {
  size: 26,
  speed: 210,
  speedPerSector: 16,
  interval: 1.3,
  intervalJitter: 0.75,
  basePoints: 50,
};

export const SECTOR = {
  durationSeconds: 14,
  maxSector: 10,
};

export const POOL_CAPACITY = 80;

export const PALETTE = {
  space: '#0a0d16',
  sky: '#0f1424',
  boundary: '#192238',
  shipHull: '#00d2ff',
  shipAccent: '#ffffff',
  solarFlare: '#ff4400',
  flareGlow: '#ffaa00',
  plasmaCore: '#00ffc8',
  panelBg: '#121829',
  hudText: '#eef2fb',
  comboAccent: '#ffd228',
  subText: '#8fa0c0',
  danger: '#ff3344',
};

export const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const HIGH_SCORE_KEY = 'solar-flare.high-score';

// Compatibility aliases
export const PLAYER = SHIP;
export const BLOCK = SOLAR_FLARE;
export const COIN = PLASMA_CORE;
export const LIVES = SHIELDS;
