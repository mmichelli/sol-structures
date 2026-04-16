/**
 * Isometric renderers for sol structures.
 *
 * isoSVG()      — clean single-line wireframes
 * isoBarSVG()   — thick-bar 3D prism style (LeWitt print aesthetic)
 */

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;

export function project(x, y, z, scale = 1) {
  return [
    (x - z) * C30 * scale,
    (x + z) * S30 * scale - y * scale,
  ];
}

// ─── Clean line renderer ────────────────────────────────────────

export function isoSVG(opts = {}) {
  const scale = opts.scale || 40;
  const stroke = opts.stroke || '#555';
  const strokeWidth = opts.strokeWidth || 1.5;
  const bg = opts.bg || '#ffffff';
  const segments = [];

  function addLine(x1, y1, z1, x2, y2, z2, style = {}) {
    segments.push({ from: [x1, y1, z1], to: [x2, y2, z2], style });
  }

  function addOpenBox(ox, oy, oz, sx, sy, sz, style = {}) {
    const x0=ox, x1=ox+sx, y0=oy, y1=oy+sy, z0=oz, z1=oz+sz;
    const L = (a,b,c,d,e,f) => addLine(a,b,c,d,e,f,style);
    L(x0,y0,z0,x1,y0,z0); L(x1,y0,z0,x1,y0,z1); L(x1,y0,z1,x0,y0,z1); L(x0,y0,z1,x0,y0,z0);
    L(x0,y1,z0,x1,y1,z0); L(x1,y1,z0,x1,y1,z1); L(x1,y1,z1,x0,y1,z1); L(x0,y1,z1,x0,y1,z0);
    L(x0,y0,z0,x0,y1,z0); L(x1,y0,z0,x1,y1,z0); L(x1,y0,z1,x1,y1,z1); L(x0,y0,z1,x0,y1,z1);
  }

  function addOpenCube(ox, oy, oz, s, style = {}) { addOpenBox(ox, oy, oz, s, s, s, style); }

  function addEdges(ox, oy, oz, s, edgeList, style = {}) {
    const x0=ox, x1=ox+s, y0=oy, y1=oy+s, z0=oz, z1=oz+s;
    const edges = [
      [x0,y0,z0,x1,y0,z0],[x1,y0,z0,x1,y0,z1],[x1,y0,z1,x0,y0,z1],[x0,y0,z1,x0,y0,z0],
      [x0,y1,z0,x1,y1,z0],[x1,y1,z0,x1,y1,z1],[x1,y1,z1,x0,y1,z1],[x0,y1,z1,x0,y1,z0],
      [x0,y0,z0,x0,y1,z0],[x1,y0,z0,x1,y1,z0],[x1,y0,z1,x1,y1,z1],[x0,y0,z1,x0,y1,z1],
    ];
    for (const ei of edgeList) { const e=edges[ei]; addLine(e[0],e[1],e[2],e[3],e[4],e[5],style); }
  }

  // Platform grid on the ground (y=0)
  function addPlatform(x0, z0, x1, z1, step, style = {}) {
    const st = { stroke: '#bbb', strokeWidth: 0.5, ...style };
    for (let x = x0; x <= x1; x += step) addLine(x, 0, z0, x, 0, z1, st);
    for (let z = z0; z <= z1; z += step) addLine(x0, 0, z, x1, 0, z, st);
  }

  function render(container) {
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    const projected = segments.map(seg => {
      const [x1,y1] = project(...seg.from, scale);
      const [x2,y2] = project(...seg.to, scale);
      minX=Math.min(minX,x1,x2); minY=Math.min(minY,y1,y2);
      maxX=Math.max(maxX,x1,x2); maxY=Math.max(maxY,y1,y2);
      return { x1, y1, x2, y2, style: seg.style };
    });
    const pad=40, vw=maxX-minX+pad*2, vh=maxY-minY+pad*2;
    const ox=-minX+pad, oy=-minY+pad;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw.toFixed(1)} ${vh.toFixed(1)}" style="width:100%;height:100%;background:${bg}">`;
    for (const seg of projected) {
      const sc=seg.style.stroke||stroke, sw=seg.style.strokeWidth||strokeWidth;
      const op=seg.style.opacity!=null?` opacity="${seg.style.opacity}"`:'';
      svg += `<line x1="${(seg.x1+ox).toFixed(2)}" y1="${(seg.y1+oy).toFixed(2)}" x2="${(seg.x2+ox).toFixed(2)}" y2="${(seg.y2+oy).toFixed(2)}" stroke="${sc}" stroke-width="${sw}" stroke-linecap="round"${op}/>`;
    }
    svg += '</svg>';
    container.innerHTML = svg;
  }

  return { addLine, addOpenBox, addOpenCube, addEdges, addPlatform, render, project };
}


// ─── Thick-bar 3D prism renderer ────────────────────────────────

export function isoBarSVG(opts = {}) {
  const scale = opts.scale || 40;
  const barWidth = opts.barWidth || 0.12; // bar half-width as fraction of scale
  const stroke = opts.stroke || '#444';
  const strokeWidth = opts.strokeWidth || 0.8;
  const fill = opts.fill || '#ffffff';
  const bg = opts.bg || '#ffffff';
  const quads = []; // { points: [[x,y]...], depth, style }

  const bw = barWidth;

  function proj(x, y, z) { return project(x, y, z, scale); }

  // A bar is a rectangular prism from (x1,y1,z1) to (x2,y2,z2)
  // We draw the 3 visible faces of a prism in isometric
  function addBar(x1, y1, z1, x2, y2, z2, style = {}) {
    const dx = x2-x1, dy = y2-y1, dz = z2-z1;
    const sf = style.fill || fill;
    const ss = style.stroke || stroke;
    const sw = style.strokeWidth || strokeWidth;

    if (Math.abs(dy) > 0.001) {
      // Vertical bar (Y axis)
      const faces = [
        // Front-left face
        [[x1-bw, y1, z1-bw], [x1-bw, y2, z1-bw], [x1+bw, y2, z1-bw], [x1+bw, y1, z1-bw]],
        // Front-right face
        [[x1+bw, y1, z1-bw], [x1+bw, y2, z1-bw], [x1+bw, y2, z1+bw], [x1+bw, y1, z1+bw]],
        // Top face
        [[x1-bw, y2, z1-bw], [x1-bw, y2, z1+bw], [x1+bw, y2, z1+bw], [x1+bw, y2, z1-bw]],
      ];
      const depth = z1 + x1 - y2;
      for (const f of faces) {
        quads.push({ points: f.map(p => proj(...p)), depth, fill: sf, stroke: ss, strokeWidth: sw });
      }
    } else if (Math.abs(dx) > 0.001) {
      // Horizontal bar along X
      const faces = [
        // Top face
        [[x1, y1+bw, z1-bw], [x2, y1+bw, z1-bw], [x2, y1+bw, z1+bw], [x1, y1+bw, z1+bw]],
        // Front face
        [[x1, y1-bw, z1-bw], [x2, y1-bw, z1-bw], [x2, y1+bw, z1-bw], [x1, y1+bw, z1-bw]],
        // Right end cap
        [[x2, y1-bw, z1-bw], [x2, y1-bw, z1+bw], [x2, y1+bw, z1+bw], [x2, y1+bw, z1-bw]],
      ];
      const depth = z1 + (x1+x2)/2 - y1;
      for (const f of faces) {
        quads.push({ points: f.map(p => proj(...p)), depth, fill: sf, stroke: ss, strokeWidth: sw });
      }
    } else if (Math.abs(dz) > 0.001) {
      // Horizontal bar along Z
      const faces = [
        // Top face
        [[x1-bw, y1+bw, z1], [x1+bw, y1+bw, z1], [x1+bw, y1+bw, z2], [x1-bw, y1+bw, z2]],
        // Left face
        [[x1+bw, y1-bw, z1], [x1+bw, y1-bw, z2], [x1+bw, y1+bw, z2], [x1+bw, y1+bw, z1]],
        // Front end cap
        // (skip — usually occluded)
      ];
      const depth = (z1+z2)/2 + x1 - y1;
      for (const f of faces) {
        quads.push({ points: f.map(p => proj(...p)), depth, fill: sf, stroke: ss, strokeWidth: sw });
      }
    }
  }

  function addOpenBox(ox, oy, oz, sx, sy, sz, style = {}) {
    const x0=ox, x1=ox+sx, y0=oy, y1=oy+sy, z0=oz, z1=oz+sz;
    const B = (a,b,c,d,e,f) => addBar(a,b,c,d,e,f,style);
    // Bottom edges
    B(x0,y0,z0,x1,y0,z0); B(x1,y0,z0,x1,y0,z1); B(x0,y0,z1,x1,y0,z1); B(x0,y0,z0,x0,y0,z1);
    // Top edges
    B(x0,y1,z0,x1,y1,z0); B(x1,y1,z0,x1,y1,z1); B(x0,y1,z1,x1,y1,z1); B(x0,y1,z0,x0,y1,z1);
    // Vertical edges
    B(x0,y0,z0,x0,y1,z0); B(x1,y0,z0,x1,y1,z0); B(x1,y0,z1,x1,y1,z1); B(x0,y0,z1,x0,y1,z1);
  }

  function addOpenCube(ox, oy, oz, s, style = {}) { addOpenBox(ox, oy, oz, s, s, s, style); }

  function addEdges(ox, oy, oz, s, edgeList, style = {}) {
    const x0=ox, x1=ox+s, y0=oy, y1=oy+s, z0=oz, z1=oz+s;
    const edges = [
      [x0,y0,z0,x1,y0,z0],[x1,y0,z0,x1,y0,z1],[x1,y0,z1,x0,y0,z1],[x0,y0,z1,x0,y0,z0],
      [x0,y1,z0,x1,y1,z0],[x1,y1,z0,x1,y1,z1],[x1,y1,z1,x0,y1,z1],[x0,y1,z1,x0,y1,z0],
      [x0,y0,z0,x0,y1,z0],[x1,y0,z0,x1,y1,z0],[x1,y0,z1,x1,y1,z1],[x0,y0,z1,x0,y1,z1],
    ];
    for (const ei of edgeList) { const e=edges[ei]; addBar(e[0],e[1],e[2],e[3],e[4],e[5],style); }
  }

  function render(container) {
    // Sort back to front
    quads.sort((a, b) => a.depth - b.depth);

    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    for (const q of quads)
      for (const [x,y] of q.points) {
        if (x<minX) minX=x; if (y<minY) minY=y;
        if (x>maxX) maxX=x; if (y>maxY) maxY=y;
      }

    const pad=40, vw=maxX-minX+pad*2, vh=maxY-minY+pad*2;
    const ox=-minX+pad, oy=-minY+pad;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw.toFixed(1)} ${vh.toFixed(1)}" style="width:100%;height:100%;background:${bg}">`;
    for (const q of quads) {
      const pts = q.points.map(([x,y]) => `${(x+ox).toFixed(2)},${(y+oy).toFixed(2)}`).join(' ');
      svg += `<polygon points="${pts}" fill="${q.fill}" stroke="${q.stroke}" stroke-width="${q.strokeWidth}" stroke-linejoin="round"/>`;
    }
    svg += '</svg>';
    container.innerHTML = svg;
  }

  return { addBar, addOpenBox, addOpenCube, addEdges, render };
}
