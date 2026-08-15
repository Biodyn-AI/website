/* ========================================
   BIODYN , Margin shapes
   A pair per section, each pair saying what
   that section is about. Nothing here repeats
   a figure used elsewhere on the site.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  if (!A) return;

  const N = 620;
  const TAU = Math.PI * 2;

  const graph = (nodes, edges, opts) => {
    const o = opts || {};
    const rand = o.rand || A.makeRandom(7);
    const jitter = o.jitter === undefined ? 0.006 : o.jitter;
    const pos = new Float32Array(N * 3);
    const intensity = new Float32Array(N);
    const count = Math.min(nodes.length, N);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = o.nodeIntensity ? o.nodeIntensity(i) : 0.95;
    }
    const ec = edges.length / 2;
    for (let i = count; i < N; i += 1) {
      const e = ec ? (i - count) % ec : 0;
      const a = nodes[edges[e * 2]] || [0, 0, 0];
      const b = nodes[edges[e * 2 + 1]] || [0, 0, 0];
      const t = rand();
      pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(rand) * jitter;
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(rand) * jitter;
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(rand) * jitter;
      intensity[i] = o.fill === undefined ? 0.3 : o.fill;
    }
    A.fit(pos, N, 1);
    return { pos, intensity, edges: count >= nodes.length ? edges : null };
  };

  /* --- Research: four tracks, braided and fully cross-linked --- */

  const braid = () => {
    const rand = A.makeRandom(4004);
    const STRANDS = 4;
    const STEPS = 26;
    const nodes = [];
    const edges = [];
    for (let s = 0; s < STRANDS; s += 1) {
      const first = nodes.length;
      for (let i = 0; i < STEPS; i += 1) {
        const t = i / (STEPS - 1);
        const a = t * TAU * 1.5 + (s / STRANDS) * TAU;
        const r = 0.3 * (1 - 0.35 * Math.sin(t * Math.PI));
        nodes.push([Math.cos(a) * r, (t - 0.5) * 1.85, Math.sin(a) * r]);
        if (i > 0) edges.push(first + i - 1, first + i);
        // Cross-links, so the four read as interwoven rather than parallel.
        if (s > 0 && i % 5 === 0) edges.push(first + i, first + i - STEPS);
      }
    }
    return graph(nodes, edges, { rand, nodeIntensity: () => 0.85, fill: 0.34 });
  };

  const tetra = () => {
    const rand = A.makeRandom(4005);
    const HUBS = 4;
    const nodes = [];
    const edges = [];
    const at = [[0, 0.82, 0], [-0.72, -0.34, 0.42], [0.72, -0.34, 0.42], [0, -0.34, -0.82]];
    at.forEach((p) => nodes.push(p));
    for (let i = 0; i < HUBS; i += 1) {
      for (let j = i + 1; j < HUBS; j += 1) edges.push(i, j);
      // Each hub carries its own small cluster of work.
      for (let k = 0; k < 7; k += 1) {
        const idx = nodes.length;
        nodes.push([
          at[i][0] + A.gaussian(rand) * 0.13,
          at[i][1] + A.gaussian(rand) * 0.13,
          at[i][2] + A.gaussian(rand) * 0.13
        ]);
        edges.push(i, idx);
      }
    }
    return graph(nodes, edges, { rand, nodeIntensity: (i) => (i < HUBS ? 1 : 0.5), fill: 0.28 });
  };

  /* --- Atlases: a sparse code, and a mapped surface --- */

  const sparseCode = () => {
    const rand = A.makeRandom(5150);
    const COLS = 24;
    const nodes = [];
    const edges = [];
    for (let i = 0; i < COLS; i += 1) {
      const x = (i / (COLS - 1) - 0.5) * 1.8;
      const base = nodes.length;
      nodes.push([x, -0.7, 0]);
      // Most coefficients are zero; a few fire hard. That is the whole point
      // of a sparse dictionary.
      const active = rand() < 0.22;
      const h = active ? 0.6 + rand() * 0.9 : 0.045;
      nodes.push([x, -0.7 + h, 0]);
      edges.push(base, base + 1);
    }
    return graph(nodes, edges, {
      rand,
      jitter: 0.004,
      nodeIntensity: (i) => (i % 2 === 1 ? 1 : 0.28),
      fill: 0.3
    });
  };

  const mappedSurface = () => {
    const rand = A.makeRandom(5151);
    const REGIONS = 9;
    const nodes = [];
    const edges = [];
    const centres = [];
    for (let i = 0; i < REGIONS; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / REGIONS);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const c = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
      centres.push(c);
      const idx = nodes.length;
      nodes.push(c);
      for (let k = 0; k < 6; k += 1) {
        const a = (k / 6) * TAU;
        const u = [-c[1], c[0], 0];
        const ul = Math.hypot(u[0], u[1], u[2]) || 1;
        const v = [c[1] * u[2] - c[2] * u[1], c[2] * u[0] - c[0] * u[2], c[0] * u[1] - c[1] * u[0]];
        const r = 0.3;
        const p = [
          c[0] + (u[0] / ul) * Math.cos(a) * r + v[0] * Math.sin(a) * r,
          c[1] + (u[1] / ul) * Math.cos(a) * r + v[1] * Math.sin(a) * r,
          c[2] + (u[2] / ul) * Math.cos(a) * r + v[2] * Math.sin(a) * r
        ];
        const pi = nodes.length;
        nodes.push(p);
        edges.push(idx, pi);
      }
    }
    return graph(nodes, edges, { rand, nodeIntensity: (i) => (i % 7 === 0 ? 1 : 0.4), fill: 0.24 });
  };

  /* --- Research outputs: stacked plates, and what cites what --- */

  const plates = () => {
    const rand = A.makeRandom(6200);
    const SHEETS = 9;
    const nodes = [];
    const edges = [];
    for (let s = 0; s < SHEETS; s += 1) {
      const y = (s / (SHEETS - 1) - 0.5) * 1.5;
      const w = 0.66 - Math.abs(s - SHEETS / 2) * 0.02;
      const c = [[-w, y, -w * 0.7], [w, y, -w * 0.7], [w, y, w * 0.7], [-w, y, w * 0.7]];
      const first = nodes.length;
      c.forEach((p) => nodes.push(p));
      for (let k = 0; k < 4; k += 1) edges.push(first + k, first + ((k + 1) % 4));
      if (s > 0) edges.push(first, first - 4);
    }
    return graph(nodes, edges, {
      rand,
      jitter: 0.004,
      nodeIntensity: (i) => 0.4 + 0.5 * (Math.floor(i / 4) / SHEETS),
      fill: 0.32
    });
  };

  const citations = () => {
    const rand = A.makeRandom(6201);
    const LAYERS = [4, 7, 9];
    const nodes = [];
    const edges = [];
    const rows = [];
    LAYERS.forEach((n, l) => {
      const row = [];
      for (let i = 0; i < n; i += 1) {
        row.push(nodes.length);
        nodes.push([((i + 0.5) / n - 0.5) * 1.7, 0.8 - l * 0.8, A.gaussian(rand) * 0.16]);
      }
      rows.push(row);
    });
    for (let l = 0; l < rows.length - 1; l += 1) {
      rows[l].forEach((from) => {
        const below = rows[l + 1];
        for (let k = 0; k < 2; k += 1) edges.push(from, below[Math.floor(rand() * below.length)]);
      });
    }
    return graph(nodes, edges, { rand, nodeIntensity: (i) => (i < LAYERS[0] ? 1 : 0.55), fill: 0.26 });
  };

  /* --- Collaborations: two groups bridged, and linked rings --- */

  const bridged = () => {
    const rand = A.makeRandom(7300);
    const nodes = [];
    const edges = [];
    const anchors = [];
    [-0.78, 0.78].forEach((cx, g) => {
      const local = [];
      for (let i = 0; i < 9; i += 1) {
        local.push(nodes.length);
        nodes.push([cx + A.gaussian(rand) * 0.26, A.gaussian(rand) * 0.34, A.gaussian(rand) * 0.26]);
      }
      for (let i = 0; i < local.length; i += 1) {
        for (let j = i + 1; j < local.length; j += 1) if (rand() < 0.4) edges.push(local[i], local[j]);
      }
      anchors.push(local);
    });
    // The few links that actually cross between the groups.
    for (let k = 0; k < 4; k += 1) {
      edges.push(anchors[0][Math.floor(rand() * 9)], anchors[1][Math.floor(rand() * 9)]);
    }
    return graph(nodes, edges, { rand, nodeIntensity: () => 0.8, fill: 0.3 });
  };

  const linkedRings = () => {
    const rand = A.makeRandom(7301);
    const STEPS = 30;
    const nodes = [];
    const edges = [];
    const rings = [
      { c: [-0.34, 0, 0], axis: 'y' },
      { c: [0.34, 0, 0], axis: 'x' }
    ];
    rings.forEach((ring) => {
      const first = nodes.length;
      for (let i = 0; i < STEPS; i += 1) {
        const a = (i / STEPS) * TAU;
        const p = ring.axis === 'y'
          ? [ring.c[0] + Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0]
          : [ring.c[0], Math.sin(a) * 0.56, Math.cos(a) * 0.56];
        nodes.push(p);
        if (i > 0) edges.push(first + i - 1, first + i);
      }
      edges.push(first + STEPS - 1, first);
    });
    return graph(nodes, edges, { rand, jitter: 0.004, nodeIntensity: () => 0.75, fill: 0.34 });
  };

  /* --- Team: individuals, and the shared centre they work from --- */

  const constellation = () => {
    const rand = A.makeRandom(8400);
    const PEOPLE = 7;
    const nodes = [];
    const edges = [];
    for (let i = 0; i < PEOPLE; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PEOPLE);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const c = [
        0.72 * Math.sin(phi) * Math.cos(theta),
        0.72 * Math.cos(phi),
        0.72 * Math.sin(phi) * Math.sin(theta)
      ];
      const idx = nodes.length;
      nodes.push(c);
      // A small orbit each: separate work, same system.
      const first = nodes.length;
      for (let k = 0; k < 10; k += 1) {
        const a = (k / 10) * TAU;
        nodes.push([c[0] + Math.cos(a) * 0.2, c[1] + Math.sin(a) * 0.2 * 0.6, c[2] + Math.sin(a) * 0.2]);
        if (k > 0) edges.push(first + k - 1, first + k);
      }
      edges.push(first + 9, first);
      edges.push(idx, first);
    }
    return graph(nodes, edges, { rand, jitter: 0.004, nodeIntensity: (i) => (i % 11 === 0 ? 1 : 0.4), fill: 0.22 });
  };

  const sharedCentre = () => {
    const rand = A.makeRandom(8401);
    const SPOKES = 12;
    const nodes = [[0, 0, 0]];
    const edges = [];
    for (let i = 0; i < SPOKES; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / SPOKES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const idx = nodes.length;
      nodes.push([
        0.88 * Math.sin(phi) * Math.cos(theta),
        0.88 * Math.cos(phi),
        0.88 * Math.sin(phi) * Math.sin(theta)
      ]);
      edges.push(0, idx);
    }
    return graph(nodes, edges, { rand, nodeIntensity: (i) => (i === 0 ? 1 : 0.62), fill: 0.24 });
  };

  const cache = {};
  const get = (key, build) => {
    if (!cache[key]) cache[key] = build();
    return cache[key];
  };

  window.BiodynMarginShapes = {
    N,
    braid: () => get('braid', braid),
    tetra: () => get('tetra', tetra),
    sparseCode: () => get('sparseCode', sparseCode),
    mappedSurface: () => get('mappedSurface', mappedSurface),
    plates: () => get('plates', plates),
    citations: () => get('citations', citations),
    bridged: () => get('bridged', bridged),
    linkedRings: () => get('linkedRings', linkedRings),
    constellation: () => get('constellation', constellation),
    sharedCentre: () => get('sharedCentre', sharedCentre)
  };
})();
