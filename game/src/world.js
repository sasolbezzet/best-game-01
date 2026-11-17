// Solar Flare World Simulation: Physics, Collision Detection, and Scoring Logic
import { FIELD, PLASMA_CORE, POOL_CAPACITY, SECTOR, SHIELDS, SHIP, SOLAR_FLARE, STEP } from './config.js';

export const ENTITY_FLARE = 0;
export const ENTITY_CORE = 1;

export const EVENT_SHIELD_DAMAGE = 1;
export const EVENT_CORE_COLLECTED = 2;
export const EVENT_MISSION_OVER = 4;
export const EVENT_MISSION_VICTORY = 8;

function checkAABB(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const ship = {
    x: (FIELD.width - SHIP.width) / 2,
    y: FIELD.groundY - SHIP.height,
    width: SHIP.width,
    height: SHIP.height,
    invulnerable: 0,
  };

  const pool = [];
  for (let i = 0; i < POOL_CAPACITY; i += 1) {
    pool.push({ active: false, kind: ENTITY_FLARE, x: 0, y: 0, width: 0, height: 0, speed: 0 });
  }

  const state = {
    ship,
    items: pool,
    score: 0,
    multiplier: 1,
    comboStreak: 0,
    shields: SHIELDS,
    sector: 1,
    elapsed: 0,
    flareTimer: SOLAR_FLARE.interval,
    coreTimer: PLASMA_CORE.interval,
  };

  function reset() {
    ship.x = (FIELD.width - ship.width) / 2;
    ship.invulnerable = 0;
    for (const item of pool) item.active = false;
    state.score = 0;
    state.multiplier = 1;
    state.comboStreak = 0;
    state.shields = SHIELDS;
    state.sector = 1;
    state.elapsed = 0;
    state.flareTimer = SOLAR_FLARE.interval;
    state.coreTimer = PLASMA_CORE.interval;
  }

  function getAvailableItem() {
    for (let i = 0; i < pool.length; i += 1) {
      if (!pool[i].active) return pool[i];
    }
    return null;
  }

  function spawnSolarFlare() {
    const item = getAvailableItem();
    if (!item) return;
    item.active = true;
    item.kind = ENTITY_FLARE;
    item.width = SOLAR_FLARE.minWidth + random() * (SOLAR_FLARE.maxWidth - SOLAR_FLARE.minWidth);
    item.height = SOLAR_FLARE.height;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = SOLAR_FLARE.speed + SOLAR_FLARE.speedPerSector * (state.sector - 1) + random() * SOLAR_FLARE.speedJitter;
  }

  function spawnPlasmaCore() {
    const item = getAvailableItem();
    if (!item) return;
    item.active = true;
    item.kind = ENTITY_CORE;
    item.width = PLASMA_CORE.size;
    item.height = PLASMA_CORE.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = PLASMA_CORE.speed + PLASMA_CORE.speedPerSector * (state.sector - 1);
  }

  function currentFlareInterval() {
    return Math.max(SOLAR_FLARE.minInterval, SOLAR_FLARE.interval * SOLAR_FLARE.intervalScale ** (state.sector - 1));
  }

  function step(delta, direction, demo = false) {
    let events = 0;

    // Movement
    if (!demo && direction !== 0) {
      ship.x += direction * SHIP.speed * delta;
      ship.x = Math.max(0, Math.min(FIELD.width - ship.width, ship.x));
    }

    if (ship.invulnerable > 0) {
      ship.invulnerable = Math.max(0, ship.invulnerable - delta);
    }

    state.elapsed += delta;
    state.sector = Math.min(SECTOR.maxSector, Math.floor(state.elapsed / SECTOR.durationSeconds) + 1);
    if (!demo && state.elapsed >= SECTOR.durationSeconds * SECTOR.maxSector) {
      events |= EVENT_MISSION_VICTORY;
    }

    // Spawning timers
    state.flareTimer -= delta;
    if (state.flareTimer <= 0) {
      spawnSolarFlare();
      state.flareTimer = currentFlareInterval();
    }

    state.coreTimer -= delta;
    if (state.coreTimer <= 0) {
      spawnPlasmaCore();
      state.coreTimer = PLASMA_CORE.interval + (random() - 0.5) * PLASMA_CORE.intervalJitter;
    }

    // Move falling entities and check collisions
    for (let i = 0; i < pool.length; i += 1) {
      const item = pool[i];
      if (!item.active) continue;

      item.y += item.speed * delta;

      // Entity off screen
      if (item.y > FIELD.groundY) {
        item.active = false;
        if (item.kind === ENTITY_FLARE && !demo) {
          state.score += SOLAR_FLARE.evadePoints * state.multiplier;
        }
        continue;
      }

      // Check collision with ship
      if (!demo && checkAABB(ship, item)) {
        if (item.kind === ENTITY_CORE) {
          item.active = false;
          state.comboStreak += 1;
          state.multiplier = Math.min(8, 1 + Math.floor(state.comboStreak / 4));
          state.score += PLASMA_CORE.basePoints * state.multiplier;
          events |= EVENT_CORE_COLLECTED;
        } else if (item.kind === ENTITY_FLARE && ship.invulnerable === 0) {
          item.active = false;
          state.shields -= 1;
          state.comboStreak = 0;
          state.multiplier = 1;
          ship.invulnerable = SHIP.invulnerable;
          events |= EVENT_SHIELD_DAMAGE;

          if (state.shields <= 0) {
            events |= EVENT_MISSION_OVER;
          }
        }
      }
    }

    return events;
  }

  return { state, reset, step };
}

// Compatibility aliases
export const KIND_BLOCK = ENTITY_FLARE;
export const KIND_COIN = ENTITY_CORE;
export const EVENT_OVER = EVENT_MISSION_OVER;
export const EVENT_HIT = EVENT_SHIELD_DAMAGE;
export const EVENT_COIN = EVENT_CORE_COLLECTED;
