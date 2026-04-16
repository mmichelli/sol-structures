/**
 * Shared helpers for sol_cubes — thin wrapper around heerich.js
 * Loaded as ES module.
 */

import { Heerich } from 'https://cdn.jsdelivr.net/npm/heerich/dist/heerich.js';

export { Heerich };

export function createScene(opts) {
  const tile = opts.tile || 30;
  const camera = opts.camera || { type: 'isometric', angle: 45 };
  return new Heerich({ tile, camera, gap: opts.gap != null ? opts.gap : 0.02 });
}

export function render(container, scene, opts) {
  container.innerHTML = scene.toSVG({
    padding: opts && opts.padding != null ? opts.padding : 30,
  });
  const svg = container.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = '100%';
  }
}

// LeWitt grey palette
export const GREY = {
  default: { fill: '#d4d4d4', stroke: '#999', strokeWidth: 0.5 },
  top:     { fill: '#e8e8e8' },
  front:   { fill: '#c0c0c0' },
  left:    { fill: '#a8a8a8' },
};

// LeWitt four-colour palettes
export const RED = {
  default: { fill: '#c03030', stroke: '#333', strokeWidth: 0.5 },
  top: { fill: '#e85050' }, front: { fill: '#b02828' }, left: { fill: '#8a1c1c' },
};
export const YELLOW = {
  default: { fill: '#d0b020', stroke: '#333', strokeWidth: 0.5 },
  top: { fill: '#f0d040' }, front: { fill: '#c0a018' }, left: { fill: '#9a8010' },
};
export const BLUE = {
  default: { fill: '#3060c0', stroke: '#333', strokeWidth: 0.5 },
  top: { fill: '#5080e0' }, front: { fill: '#2850a8' }, left: { fill: '#1c3c88' },
};
export const BLACK = {
  default: { fill: '#3a3a3a', stroke: '#222', strokeWidth: 0.5 },
  top: { fill: '#555' }, front: { fill: '#333' }, left: { fill: '#222' },
};

export const PALETTES = [RED, YELLOW, BLUE, BLACK];
