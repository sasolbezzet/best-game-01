// Solar Flare Main Loop: Input Handling, State Updates, and Lifecycle
import { HIGH_SCORE_KEY, SHIELDS, STEP } from './config.js';
import { createInput } from './input.js';
import { createRandom } from './random.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_MISSION_OVER, EVENT_MISSION_VICTORY, EVENT_SHIELD_DAMAGE } from './world.js';

const MAX_FRAME_DELTA = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedArg = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedArg) ? seedArg : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function getSavedHighScore() {
  try {
    return Number.parseInt(window.localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function updateSavedHighScore(score) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // LocalStorage fallback
  }
}

function executeShot(name) {
  const scene = stageShot(name, world);
  let frames = 0;
  function renderFrame() {
    renderer.draw(world.state, scene.screen, scene.best);
    frames += 1;
    if (frames < 2) requestAnimationFrame(renderFrame);
    else window.__shotReady = true;
  }
  requestAnimationFrame(renderFrame);
}

function runSolarFlare() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let highScore = getSavedHighScore();
  let accumulator = 0;
  let lastTime = performance.now();

  function announce(msg) {
    if (status) status.textContent = msg;
  }

  function launchMission() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Mission launched. ${SHIELDS} shield cells active.`);
  }

  function endMission() {
    screen = SCREEN_OVER;
    if (world.state.score > highScore) {
      highScore = world.state.score;
      updateSavedHighScore(highScore);
    }
    announce(`Mission terminated. Score: ${world.state.score}. High score: ${highScore}.`);
  }

  function completeMission() {
    screen = SCREEN_VICTORY;
    if (world.state.score > highScore) {
      highScore = world.state.score;
      updateSavedHighScore(highScore);
    }
    announce(`Mission accomplished! Sector 10 cleared with score ${world.state.score}. High score: ${highScore}.`);
  }

  function processInputActions() {
    const actions = input.takeActions();
    if (actions & 1 && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY)) {
      launchMission();
    } else if (actions & 2 && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Mission paused.');
    } else if (actions & (1 | 2) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Mission resumed.');
    }
  }

  function updateSimulation() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, true);
      return;
    }
    const events = world.step(STEP, input.direction(), false);
    if (events & EVENT_MISSION_OVER) {
      endMission();
    } else if (events & EVENT_MISSION_VICTORY) {
      completeMission();
    } else if (events & EVENT_SHIELD_DAMAGE) {
      endMission();
    } else if (events & EVENT_SHIELD_DAMAGE) {
      announce(`Shield alert: ${world.state.shields} cells remaining.`);
    }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    accumulator += Math.min((now - lastTime) / 1000, MAX_FRAME_DELTA);
    lastTime = now;

    processInputActions();

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        updateSimulation();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world.state, screen, highScore);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Mission paused.');
    }
  });

  announce('Solar Flare: Orbital Defense. Press Space or Click to Launch.');
  requestAnimationFrame(tick);
}

if (shotName) executeShot(shotName);
else runSolarFlare();
