// Solar Flare Renderer: Hardware-Accelerated 2D Canvas Graphics & Sci-Fi HUD
import { FIELD, FONT_FAMILY, PALETTE, SHIELDS } from './config.js';
import { ENTITY_CORE, ENTITY_FLARE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const PANEL_WIDTH = 620;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  // Static starfield
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: ((i * 137.5) % FIELD.width),
      y: ((i * 293.7) % FIELD.groundY),
      size: (i % 3 === 0 ? 2 : 1),
      brightness: 0.4 + (i % 5) * 0.12,
    });
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(window.innerWidth * ratio);
    const h = Math.round(window.innerHeight * ratio);
    canvas.width = w;
    canvas.height = h;
    view.scale = Math.min(w / FIELD.width, h / FIELD.height);
    view.x = (w - FIELD.width * view.scale) / 2;
    view.y = (h - FIELD.height * view.scale) / 2;
  }

  function drawText(text, x, y, size, color, align = 'center') {
    ctx.font = `${size}px ${FONT_FAMILY}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  function drawScene(state) {
    // Deep space backdrop
    ctx.fillStyle = PALETTE.sky;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // Stars
    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Boundary barrier line
    ctx.strokeStyle = PALETTE.boundary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.stroke();

    // Render falling entities
    const items = state.items;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item.active) continue;

      if (item.kind === ENTITY_CORE) {
        // Glowing plasma core
        ctx.fillStyle = PALETTE.plasmaCore;
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Solar flare hazard (meteor with fiery gradient)
        ctx.fillStyle = PALETTE.solarFlare;
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = PALETTE.flareGlow;
        ctx.fillRect(item.x + 3, item.y + 3, item.width - 6, item.height - 6);
      }
    }

    // Render ship
    const ship = state.ship;
    const blink = ship.invulnerable > 0 && Math.floor(ship.invulnerable * 12) % 2 === 1;
    if (!blink) {
      const cx = ship.x + ship.width / 2;
      const cy = ship.y + ship.height / 2;

      // Engine thruster glow
      ctx.fillStyle = PALETTE.flareGlow;
      ctx.beginPath();
      ctx.moveTo(cx - 8, ship.y + ship.height);
      ctx.lineTo(cx + 8, ship.y + ship.height);
      ctx.lineTo(cx, ship.y + ship.height + 14);
      ctx.fill();

      // Interceptor hull
      ctx.fillStyle = PALETTE.shipHull;
      ctx.beginPath();
      ctx.moveTo(cx, ship.y);
      ctx.lineTo(ship.x, ship.y + ship.height);
      ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = PALETTE.shipAccent;
      ctx.beginPath();
      ctx.moveTo(cx, ship.y + 6);
      ctx.lineTo(cx - 6, ship.y + 18);
      ctx.lineTo(cx + 6, ship.y + 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHud(state) {
    ctx.textBaseline = 'top';
    drawText(`SCORE: ${state.score.toLocaleString()}`, 32, 22, 24, PALETTE.hudText, 'left');
    drawText(`COMBO x${state.multiplier}`, 250, 24, 20, PALETTE.comboAccent, 'left');
    drawText(`SECTOR ${state.sector}`, FIELD.width / 2, 22, 24, PALETTE.hudText, 'center');

    // Shield status
    const shieldStartX = FIELD.width - 240;
    drawText('SHIELDS', shieldStartX - 16, 24, 18, PALETTE.subText, 'right');
    for (let i = 0; i < SHIELDS; i += 1) {
      ctx.fillStyle = i < state.shields ? PALETTE.plasmaCore : PALETTE.boundary;
      ctx.fillRect(shieldStartX + i * 40, 22, 30, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(shieldStartX + i * 40, 22, 30, 20);
    }
  }

  function drawPanel(title, lines, promptColor, prompt) {
    const panelHeight = 280 + lines.length * 36;
    const x = (FIELD.width - PANEL_WIDTH) / 2;
    const y = (FIELD.height - panelHeight) / 2;

    ctx.fillStyle = PALETTE.panelBg;
    ctx.fillRect(x, y, PANEL_WIDTH, panelHeight);
    ctx.strokeStyle = PALETTE.shipHull;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, PANEL_WIDTH, panelHeight);

    ctx.textBaseline = 'alphabetic';
    drawText(title, FIELD.width / 2, y + 68, 42, PALETTE.hudText, 'center');

    for (let i = 0; i < lines.length; i += 1) {
      drawText(lines[i], FIELD.width / 2, y + 130 + i * 36, 20, PALETTE.subText, 'center');
    }

    drawText(prompt, FIELD.width / 2, y + panelHeight - 38, 22, promptColor, 'center');
  }

  function draw(state, screen, highScore) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawScene(state);

    if (screen === SCREEN_TITLE) {
      const titleLines = [
        'Evade solar flare anomalies · Harvest quantum plasma cores',
        'Controls: [← / →] or [A / D] to steer · [P] to pause',
        `High Score Record: ${highScore.toLocaleString()}`,
      ];
      drawPanel('SOLAR FLARE', titleLines, PALETTE.comboAccent, 'Press Space or Click to Launch');
      return;
    }

    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['Orbital telemetry standing by.'], PALETTE.hudText, 'Press P to Resume');
    } else if (screen === SCREEN_VICTORY) {
      const victoryLines = [
        'ALL 10 ORBITAL SECTORS CLEARED — S-CLASS ACE RATING',
        `Final Victory Score: ${state.score.toLocaleString()} PTS`,
        `Plasma Cores Harvested: 142 · Multiplier: x${state.multiplier}`,
        `All-Time Best: ${Math.max(highScore, state.score).toLocaleString()}`,
      ];
      drawPanel('MISSION ACCOMPLISHED', victoryLines, PALETTE.plasmaCore, 'Press Space or Click to Re-Deploy');
    } else if (screen === SCREEN_OVER) {
      const overLines = [
        `Mission Score: ${state.score.toLocaleString()}`,
        `Highest Sector Reached: ${state.sector}`,
        `All-Time Best: ${Math.max(highScore, state.score).toLocaleString()}`,
      ];
      drawPanel('MISSION TERMINATED', overLines, PALETTE.danger, 'Press Space or Click to Re-Deploy');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
