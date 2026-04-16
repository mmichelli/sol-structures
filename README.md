# sol structures

A growing set of generative drawings after [Sol LeWitt](https://en.wikipedia.org/wiki/Sol_LeWitt) — each piece a short written instruction, executed in the browser.

**Live site:** https://mmichelli.github.io/sol-structures/

## About

Each drawing pairs a plain-language instruction (a grid of cubes, a stepped pyramid, a field of prisms…) with a self-contained HTML page that renders it. Open the gallery and click any card to view the piece full-screen; many are interactive or re-roll on click.

## Rendering

Drawings are rendered with a mix of:

- [heerich.js](https://github.com/meodai/heerich) — for 2D line work
- [three.js](https://threejs.org/) — for 3D forms, colour, and transparency
- Plain SVG

## Structure

- `index.html` — gallery of all drawings
- `drawings/` — one HTML file per piece
- `previews/` — thumbnail images shown in the gallery
- `favicon.svg`

## Running locally

Every page is static. Serve the repo root with any static file server, e.g.:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
