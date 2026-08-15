/* ========================================
   BIODYN, About, symbolic figures
   Each figure has to read as the thing it argues,
   not as an abstract cloud:

     I    a small organism, traced end to end
     II   an opaque output surface, cut open to
          show the interior it hides
     III  disordered internals on one side, a
          double helix drawn out of them

   and one figure per application area, so the
   detail view can morph a level deeper.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  if (!A) return;

  const TAU = Math.PI * 2;

  /* Places graph nodes first, then scatters the remaining budget along the
     edges so the wiring reads as drawn rather than implied. */
  const fromGraph = (nodes, edges, n, options) => {
    const opts = options || {};
    const rand = opts.rand || A.makeRandom(1);
    const jitter = opts.jitter === undefined ? 0.006 : opts.jitter;
    const fill = opts.fill === undefined ? 0.3 : opts.fill;
    const pos = new Float32Array(n * 3);
    const intensity = new Float32Array(n);
    const nodeCount = Math.min(nodes.length, n);

    for (let i = 0; i < nodeCount; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = opts.nodeIntensity ? opts.nodeIntensity(i) : 0.95;
    }

    const edgeCount = edges.length / 2;
    for (let i = nodeCount; i < n; i += 1) {
      const e = edgeCount ? (i - nodeCount) % edgeCount : 0;
      const a = nodes[edges[e * 2]] || [0, 0, 0];
      const b = nodes[edges[e * 2 + 1]] || [0, 0, 0];
      const t = rand();
      pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(rand) * jitter;
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(rand) * jitter;
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(rand) * jitter;
      intensity[i] = typeof fill === 'function' ? fill(i) : fill;
    }

    return { pos, intensity, edges: nodeCount >= nodes.length ? edges : null };
  };

  /* =======================================
     I, A small organism, traced end to end
     ======================================= */

  const modelOrganism = (n) => {
    const rand = A.makeRandom(31337);
    const CORD = 34;
    const GANGLIA = 22;
    const nodes = [];
    const edges = [];

    // Tapered body profile, fatter at the head.
    const radiusAt = (t) => 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06)), 0.62)
      * (1 + 0.42 * Math.exp(-Math.pow((t - 0.16) / 0.16, 2)));

    // Dorsal nerve cord down the length of the animal.
    for (let i = 0; i < CORD; i += 1) {
      const t = i / (CORD - 1);
      nodes.push([(t - 0.5) * 1.68, radiusAt(t) * 0.42 + 0.02, 0]);
      if (i > 0) edges.push(i - 1, i);
    }

    // Ganglia hanging off the cord, alternating left and right.
    for (let g = 0; g < GANGLIA; g += 1) {
      const anchor = 2 + Math.floor((g / GANGLIA) * (CORD - 4));
      const side = g % 2 === 0 ? 1 : -1;
      const t = anchor / (CORD - 1);
      const r = radiusAt(t);
      const index = nodes.length;
      nodes.push([
        (t - 0.5) * 1.68 + A.gaussian(rand) * 0.02,
        r * -0.24,
        side * r * 0.82
      ]);
      edges.push(anchor, index);
      if (g >= 2) edges.push(index - 2, index);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.008,
      nodeIntensity: (i) => (i < CORD ? 1 : 0.82),
      fill: 0.4
    });

    // Body wall, dim, so the silhouette of the animal is legible.
    const surfaceStart = Math.min(nodes.length, n) + Math.floor((n - nodes.length) * 0.34);
    for (let i = surfaceStart; i < n; i += 1) {
      const t = rand();
      const a = rand() * TAU;
      const r = radiusAt(t);
      built.pos[i * 3] = (t - 0.5) * 1.68;
      built.pos[i * 3 + 1] = Math.sin(a) * r;
      built.pos[i * 3 + 2] = Math.cos(a) * r;
      built.intensity[i] = 0.24;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* =======================================
     II, Output surface, cut open
     ======================================= */

  const cutawayAudit = (n) => {
    const rand = A.makeRandom(556677);
    const CORE_NODES = 46;
    const nodes = [];
    const edges = [];

    // A compact, wired interior: organised knowledge, not noise.
    for (let i = 0; i < CORE_NODES; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / CORE_NODES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 0.28 + rand() * 0.2;
      nodes.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ]);
    }
    for (let i = 0; i < CORE_NODES; i += 1) {
      for (let j = i + 1; j < CORE_NODES; j += 1) {
        const d = Math.hypot(
          nodes[i][0] - nodes[j][0],
          nodes[i][1] - nodes[j][1],
          nodes[i][2] - nodes[j][2]
        );
        if (d < 0.31) edges.push(i, j);
      }
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.005,
      nodeIntensity: () => 1,
      fill: 0.55
    });

    // The shell is the output surface. A wedge is missing, so you can see that
    // there is far more inside than the surface ever shows.
    const shellStart = Math.floor(n * 0.46);
    const GAP_FROM = -0.62;
    const GAP_TO = 0.72;
    for (let i = shellStart; i < n; i += 1) {
      let theta = 0;
      let phi = 0;
      // Rejection-sample the sphere minus the wedge.
      for (let tries = 0; tries < 24; tries += 1) {
        const k = rand();
        phi = Math.acos(1 - 2 * k);
        theta = rand() * TAU - Math.PI;
        if (theta < GAP_FROM || theta > GAP_TO) break;
      }
      const r = 1 + A.gaussian(rand) * 0.01;
      built.pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      built.pos[i * 3 + 1] = r * Math.cos(phi);
      built.pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      built.intensity[i] = 0.26;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* =======================================
     III, A helix drawn out of the internals
     ======================================= */

  const extraction = (n) => {
    const rand = A.makeRandom(8080808);
    const TURNS = 2.6;
    const RUNGS = 26;
    const nodes = [];
    const edges = [];
    const strandA = [];
    const strandB = [];

    // Ordered structure, extracted: a double helix standing on the right.
    for (let i = 0; i < RUNGS; i += 1) {
      const t = i / (RUNGS - 1);
      const angle = t * TAU * TURNS;
      const y = -0.86 + t * 1.72;
      const x = 0.52;
      strandA.push(nodes.length);
      nodes.push([x + Math.cos(angle) * 0.26, y, Math.sin(angle) * 0.26]);
      strandB.push(nodes.length);
      nodes.push([x - Math.cos(angle) * 0.26, y, -Math.sin(angle) * 0.26]);
      edges.push(strandA[i], strandB[i]);
      if (i > 0) {
        edges.push(strandA[i - 1], strandA[i]);
        edges.push(strandB[i - 1], strandB[i]);
      }
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.005,
      nodeIntensity: () => 0.95,
      fill: 0.5
    });

    const helixBudget = Math.floor(n * 0.52);

    // The internals it was read out of: a diffuse, unordered mass on the left.
    const cloudEnd = Math.floor(n * 0.84);
    for (let i = helixBudget; i < cloudEnd; i += 1) {
      built.pos[i * 3] = -0.78 + A.gaussian(rand) * 0.29;
      built.pos[i * 3 + 1] = -0.04 + A.gaussian(rand) * 0.34;
      built.pos[i * 3 + 2] = A.gaussian(rand) * 0.29;
      built.intensity[i] = 0.24;
    }

    // The stream between them: the extraction itself.
    for (let i = cloudEnd; i < n; i += 1) {
      const t = rand();
      const x = -0.5 + t * 0.98;
      const spread = 0.2 * (1 - t) + 0.03;
      built.pos[i * 3] = x;
      built.pos[i * 3 + 1] = -0.05 + A.gaussian(rand) * spread + Math.sin(t * 2.6) * 0.06;
      built.pos[i * 3 + 2] = A.gaussian(rand) * spread;
      built.intensity[i] = 0.34 + t * 0.5;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* =======================================
     Application figures
     ======================================= */

  /* Layered, directed: regulators above, targets below. */
  const grnFigure = (n) => {
    const rand = A.makeRandom(4242);
    const LAYERS = [9, 14, 18];
    const nodes = [];
    const edges = [];
    const layerIndex = [];

    LAYERS.forEach((size, l) => {
      const y = 0.72 - l * 0.72;
      const ring = [];
      for (let i = 0; i < size; i += 1) {
        const a = (i / size) * TAU + l * 0.4;
        const r = 0.34 + l * 0.24;
        ring.push(nodes.length);
        nodes.push([Math.cos(a) * r, y + A.gaussian(rand) * 0.03, Math.sin(a) * r]);
      }
      layerIndex.push(ring);
    });

    for (let l = 0; l < layerIndex.length - 1; l += 1) {
      layerIndex[l].forEach((from) => {
        const below = layerIndex[l + 1];
        const fanout = 2 + Math.floor(rand() * 2);
        for (let k = 0; k < fanout; k += 1) {
          edges.push(from, below[Math.floor(rand() * below.length)]);
        }
      });
    }
    // A few skip edges, because real networks are not tidy.
    for (let k = 0; k < 6; k += 1) {
      edges.push(
        layerIndex[0][Math.floor(rand() * layerIndex[0].length)],
        layerIndex[2][Math.floor(rand() * layerIndex[2].length)]
      );
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      nodeIntensity: (i) => (i < LAYERS[0] ? 1 : 0.7),
      fill: 0.3
    });
    A.fit(built.pos, n, 1);
    return built;
  };

  /* A long trajectory that thins with time, and the points that hold. */
  const longevityFigure = (n) => {
    const rand = A.makeRandom(19191);
    const STEPS = 78;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < STEPS; i += 1) {
      const t = i / (STEPS - 1);
      const angle = t * TAU * 3.1;
      const r = 0.52 - t * 0.33;
      nodes.push([(t - 0.5) * 1.9, Math.sin(angle) * r, Math.cos(angle) * r]);
      if (i > 0) edges.push(i - 1, i);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.007,
      // Signal decays along the trajectory; a periodic few stay bright.
      nodeIntensity: (i) => (i % 9 === 0 ? 1 : 0.9 - (i / STEPS) * 0.62),
      fill: (i) => 0.34 - (i / n) * 0.12
    });
    A.fit(built.pos, n, 1);
    return built;
  };

  /* One neuron: soma, dendritic arbor above, axon and terminals below. */
  const neuroFigure = (n) => {
    const rand = A.makeRandom(6501);
    const nodes = [[0, -0.05, 0]];
    const edges = [];

    const deflect = (dir, spread) => {
      const v = [
        dir[0] + A.gaussian(rand) * spread,
        dir[1] + A.gaussian(rand) * spread * 0.5,
        dir[2] + A.gaussian(rand) * spread
      ];
      const len = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / len, v[1] / len, v[2] / len];
    };

    const grow = (from, dir, length, gen, max) => {
      const p = nodes[from];
      const to = [p[0] + dir[0] * length, p[1] + dir[1] * length, p[2] + dir[2] * length];
      const index = nodes.length;
      nodes.push(to);
      edges.push(from, index);
      if (gen >= max) return;
      const kids = gen < 1 ? 2 : (rand() < 0.55 ? 2 : 3);
      for (let k = 0; k < kids; k += 1) grow(index, deflect(dir, 0.62), length * 0.74, gen + 1, max);
    };

    // Dendrites fan upward.
    for (let d = 0; d < 4; d += 1) {
      const a = (d / 4) * TAU;
      grow(0, deflect([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5], 0.2), 0.34, 0, 3);
    }

    // A single axon runs down, then breaks into terminals.
    let axon = 0;
    for (let s = 0; s < 7; s += 1) {
      const p = nodes[axon];
      const index = nodes.length;
      nodes.push([p[0] + A.gaussian(rand) * 0.02, p[1] - 0.15, p[2] + A.gaussian(rand) * 0.02]);
      edges.push(axon, index);
      axon = index;
    }
    for (let d = 0; d < 5; d += 1) {
      const a = (d / 5) * TAU;
      grow(axon, deflect([Math.cos(a) * 0.8, -0.5, Math.sin(a) * 0.8], 0.2), 0.2, 1, 2);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.006,
      nodeIntensity: (i) => (i === 0 ? 1 : 0.62),
      fill: 0.3
    });

    // Soma.
    const somaStart = Math.floor(n * 0.9);
    for (let i = somaStart; i < n; i += 1) {
      built.pos[i * 3] = A.gaussian(rand) * 0.07;
      built.pos[i * 3 + 1] = -0.05 + A.gaussian(rand) * 0.07;
      built.pos[i * 3 + 2] = A.gaussian(rand) * 0.07;
      built.intensity[i] = 1;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* A cell: membrane, nucleus, organelles, cytoskeleton. */
  const cellFigure = (n) => {
    const rand = A.makeRandom(770077);
    // Few, faint spokes: the cytoskeleton should read behind the membrane and
    // nucleus, not turn the cell into a starburst.
    const SPOKES = 16;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < SPOKES; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / SPOKES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const dir = [
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ];
      const inner = nodes.length;
      nodes.push([dir[0] * 0.3, dir[1] * 0.3, dir[2] * 0.3]);
      const outer = nodes.length;
      nodes.push([dir[0] * 0.93, dir[1] * 0.93, dir[2] * 0.93]);
      edges.push(inner, outer);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.006,
      nodeIntensity: (i) => (i % 2 === 0 ? 0.5 : 0.3),
      fill: 0.13
    });

    const nucleusStart = Math.floor(n * 0.24);
    const organelleStart = Math.floor(n * 0.5);
    const membraneStart = Math.floor(n * 0.64);

    for (let i = nucleusStart; i < organelleStart; i += 1) {
      built.pos[i * 3] = A.gaussian(rand) * 0.16;
      built.pos[i * 3 + 1] = A.gaussian(rand) * 0.16;
      built.pos[i * 3 + 2] = A.gaussian(rand) * 0.16;
      built.intensity[i] = 1;
    }

    const centres = [];
    for (let k = 0; k < 6; k += 1) {
      const phi = Math.acos(1 - (2 * (k + 0.5)) / 6);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (k + 0.5);
      centres.push([
        0.58 * Math.sin(phi) * Math.cos(theta),
        0.58 * Math.cos(phi),
        0.58 * Math.sin(phi) * Math.sin(theta)
      ]);
    }
    for (let i = organelleStart; i < membraneStart; i += 1) {
      const c = centres[i % centres.length];
      built.pos[i * 3] = c[0] + A.gaussian(rand) * 0.09;
      built.pos[i * 3 + 1] = c[1] + A.gaussian(rand) * 0.09;
      built.pos[i * 3 + 2] = c[2] + A.gaussian(rand) * 0.09;
      built.intensity[i] = 0.72;
    }

    for (let i = membraneStart; i < n; i += 1) {
      const phi = Math.acos(1 - (2 * ((i - membraneStart) + 0.5)) / (n - membraneStart));
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 1 + A.gaussian(rand) * 0.012;
      built.pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      built.pos[i * 3 + 1] = r * Math.cos(phi);
      built.pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      built.intensity[i] = 0.38;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* =======================================
     Capability-audit figures
     ======================================= */

  /* Two readout surfaces at one budget: the sanctioned output above, the
     internal layer below, and the measured distance between them. */
  const gapFigure = (n) => {
    const rand = A.makeRandom(2402);
    const COLS = 11;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < COLS; i += 1) {
      for (let j = 0; j < COLS; j += 1) {
        const x = ((i / (COLS - 1)) - 0.5) * 1.7;
        const z = ((j / (COLS - 1)) - 0.5) * 1.7;
        if (Math.hypot(x, z) > 0.92) continue;
        const upper = nodes.length;
        nodes.push([x, 0.52, z]);
        const lower = nodes.length;
        nodes.push([x, -0.52, z]);
        // Risers make the gap itself the thing you see.
        if ((i + j) % 2 === 0) edges.push(upper, lower);
      }
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.008,
      // Sanctioned surface sparse and dim; the internal layer dense and bright.
      nodeIntensity: (i) => (i % 2 === 0 ? 0.3 : 1),
      fill: 0.16
    });

    // Thicken the lower surface, so the two planes read as unequal.
    const denseStart = Math.floor(n * 0.62);
    for (let i = denseStart; i < n; i += 1) {
      const a = rand() * TAU;
      const r = Math.sqrt(rand()) * 0.9;
      built.pos[i * 3] = Math.cos(a) * r;
      built.pos[i * 3 + 1] = -0.52 + A.gaussian(rand) * 0.035;
      built.pos[i * 3 + 2] = Math.sin(a) * r;
      built.intensity[i] = 0.82;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* Containment giving way: a bounded mass with part of it pulled out. */
  const recoverabilityFigure = (n) => {
    const rand = A.makeRandom(9931);
    const RING = 30;
    const nodes = [];
    const edges = [];

    // The boundary, broken over one arc.
    for (let i = 0; i < RING; i += 1) {
      const a = (i / RING) * TAU;
      nodes.push([Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0]);
      const gap = a > 5.1 && a < 6.05;
      if (i > 0 && !gap) edges.push(i - 1, i);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.006,
      nodeIntensity: () => 0.34,
      fill: 0.22
    });

    const held = Math.floor(n * 0.34);
    const escaped = Math.floor(n * 0.78);

    // Still contained.
    for (let i = held; i < escaped; i += 1) {
      const a = rand() * TAU;
      const r = Math.sqrt(rand()) * 0.62;
      built.pos[i * 3] = Math.cos(a) * r;
      built.pos[i * 3 + 1] = Math.sin(a) * r;
      built.pos[i * 3 + 2] = A.gaussian(rand) * 0.16;
      built.intensity[i] = 0.5;
    }

    // Pulled out through the break, brightening as it goes.
    for (let i = escaped; i < n; i += 1) {
      const t = rand();
      const a = 5.58 + A.gaussian(rand) * 0.13;
      const r = 0.7 + t * 0.95;
      built.pos[i * 3] = Math.cos(a) * r;
      built.pos[i * 3 + 1] = Math.sin(a) * r;
      built.pos[i * 3 + 2] = A.gaussian(rand) * 0.07;
      built.intensity[i] = 0.55 + t * 0.45;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* A sieve: six gates, and most of what enters does not come out. */
  const standardFigure = (n) => {
    const rand = A.makeRandom(60606);
    const GATES = 6;
    const PER = 22;
    const nodes = [];
    const edges = [];

    for (let g = 0; g < GATES; g += 1) {
      const y = 0.92 - (g / (GATES - 1)) * 1.84;
      const radius = 0.78 - g * 0.085;
      const first = nodes.length;
      for (let i = 0; i < PER; i += 1) {
        const a = (i / PER) * TAU;
        nodes.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
        if (i > 0) edges.push(first + i - 1, first + i);
      }
      edges.push(first + PER - 1, first);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.005,
      nodeIntensity: (i) => 0.34 + 0.4 * (Math.floor(i / PER) / (GATES - 1)),
      fill: 0.2
    });

    // The candidates. Each one stops at the gate that rejects it; a few reach
    // the bottom, and those are the ones bright enough to see.
    const streamStart = Math.floor(n * 0.56);
    for (let i = streamStart; i < n; i += 1) {
      const roll = rand();
      const survived = roll > 0.78 ? GATES - 1 : Math.floor(Math.pow(roll, 0.7) * (GATES - 1));
      const y = 0.92 - (survived / (GATES - 1)) * 1.84 + 0.06 + A.gaussian(rand) * 0.03;
      const a = rand() * TAU;
      const r = Math.sqrt(rand()) * (0.62 - survived * 0.07);
      built.pos[i * 3] = Math.cos(a) * r;
      built.pos[i * 3 + 1] = y;
      built.pos[i * 3 + 2] = Math.sin(a) * r;
      built.intensity[i] = survived === GATES - 1 ? 1 : 0.24;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* The coverage grid: axes against modalities, mostly still empty. */
  const coverageFigure = (n) => {
    const rand = A.makeRandom(101010);
    const AXES = 10;
    const MODES = 5;
    const DEPTH = 3;
    const nodes = [];
    const edges = [];

    for (let a = 0; a < AXES; a += 1) {
      for (let m = 0; m < MODES; m += 1) {
        const x = ((a / (AXES - 1)) - 0.5) * 1.9;
        const y = ((m / (MODES - 1)) - 0.5) * 1.0;
        const index = nodes.length;
        nodes.push([x, y, 0]);
        if (a > 0) edges.push(index - MODES, index);
        if (m > 0) edges.push(index - 1, index);
      }
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.004,
      // Only the corner of the grid that has cards behind it is lit.
      nodeIntensity: (i) => (Math.floor(i / MODES) < 2 && i % MODES < 1 ? 1 : 0.22),
      fill: 0.12
    });

    // The filled cells get real depth; the rest stay a flat lattice.
    const fillStart = Math.floor(n * 0.86);
    for (let i = fillStart; i < n; i += 1) {
      const a = Math.floor(rand() * 2);
      const x = ((a / (AXES - 1)) - 0.5) * 1.9;
      built.pos[i * 3] = x + A.gaussian(rand) * 0.05;
      built.pos[i * 3 + 1] = -0.5 + A.gaussian(rand) * 0.05;
      built.pos[i * 3 + 2] = (rand() - 0.5) * 0.4 * DEPTH * 0.3;
      built.intensity[i] = 0.9;
    }

    A.fit(built.pos, n, 1);
    return built;
  };

  /* =======================================
     Model-organism figures
     ======================================= */

  /* A toy beside a real specimen: a tidy planted lattice on one side, the
     traced animal on the other. */
  const thesisFigure = (n) => {
    const rand = A.makeRandom(13579);
    const nodes = [];
    const edges = [];
    const SIDE = 4;

    // The toy: a perfect little cube, entirely of your own making.
    for (let i = 0; i < SIDE; i += 1) {
      for (let j = 0; j < SIDE; j += 1) {
        for (let k = 0; k < SIDE; k += 1) {
          const index = nodes.length;
          nodes.push([
            -0.92 + (i / (SIDE - 1) - 0.5) * 0.5,
            (j / (SIDE - 1) - 0.5) * 0.5,
            (k / (SIDE - 1) - 0.5) * 0.5
          ]);
          if (i > 0) edges.push(index - SIDE * SIDE, index);
          if (j > 0) edges.push(index - SIDE, index);
          if (k > 0) edges.push(index - 1, index);
        }
      }
    }

    // The organism: irregular, and not yours.
    const CORD = 20;
    const cordStart = nodes.length;
    for (let i = 0; i < CORD; i += 1) {
      const t = i / (CORD - 1);
      nodes.push([0.34 + t * 0.92, Math.sin(t * 2.6) * 0.14 + 0.08, A.gaussian(rand) * 0.05]);
      if (i > 0) edges.push(cordStart + i - 1, cordStart + i);
      if (i % 3 === 0 && i > 0) {
        const side = i % 6 === 0 ? 1 : -1;
        const g = nodes.length;
        nodes.push([0.34 + t * 0.92, Math.sin(t * 2.6) * 0.14 - 0.22, side * 0.2]);
        edges.push(cordStart + i, g);
      }
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.007,
      nodeIntensity: (i) => (i < SIDE * SIDE * SIDE ? 0.36 : 1),
      fill: 0.24
    });

    A.fit(built.pos, n, 1);
    return built;
  };

  /* Everything traced: a dense graph with no unvisited part. */
  const exhaustiveFigure = (n) => {
    const rand = A.makeRandom(24680);
    const NODES = 40;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < NODES; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      nodes.push([
        Math.sin(phi) * Math.cos(theta) * 0.88,
        Math.cos(phi) * 0.88,
        Math.sin(phi) * Math.sin(theta) * 0.88
      ]);
    }
    // Every pair. The point is that nothing is left out.
    for (let i = 0; i < NODES; i += 1) {
      for (let j = i + 1; j < NODES; j += 1) edges.push(i, j);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.004,
      nodeIntensity: () => 1,
      fill: 0.14
    });

    A.fit(built.pos, n, 1);
    return built;
  };

  /* Two independent structures, and the correspondences that survive between
     them: the model on one side, the experiment on the other. */
  const groundTruthFigure = (n) => {
    const rand = A.makeRandom(97531);
    const PAIRS = 16;
    const nodes = [];
    const edges = [];

    for (let i = 0; i < PAIRS; i += 1) {
      const t = i / (PAIRS - 1) - 0.5;
      const left = nodes.length;
      nodes.push([-0.62, t * 1.65, A.gaussian(rand) * 0.1]);
      const right = nodes.length;
      nodes.push([0.62, t * 1.65 + A.gaussian(rand) * 0.09, A.gaussian(rand) * 0.1]);
      // Only some correspondences hold; the rest are claims that failed.
      if (rand() < 0.42) edges.push(left, right);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.006,
      nodeIntensity: (i) => (i % 2 === 0 ? 0.9 : 0.55),
      fill: 0.42
    });

    A.fit(built.pos, n, 1);
    return built;
  };

  /* A tensor network: a chain of cores with bond legs and free indices, the
     computation sitting in the structure rather than in the input. */
  const tensorFigure = (n) => {
    const rand = A.makeRandom(86420);
    const CORES = 7;
    const nodes = [];
    const edges = [];
    const cores = [];

    for (let i = 0; i < CORES; i += 1) {
      const x = (i / (CORES - 1) - 0.5) * 1.75;
      const index = nodes.length;
      cores.push(index);
      nodes.push([x, 0, 0]);
      if (i > 0) edges.push(cores[i - 1], index);

      // Free indices, up and down.
      const up = nodes.length;
      nodes.push([x, 0.52, 0]);
      edges.push(index, up);
      const down = nodes.length;
      nodes.push([x, -0.52, 0]);
      edges.push(index, down);

      // A second rank of bonds behind the chain.
      const back = nodes.length;
      nodes.push([x, 0, 0.46]);
      edges.push(index, back);
      if (i > 0) edges.push(back - 4, back);
    }

    const built = fromGraph(nodes, edges, n, {
      rand,
      jitter: 0.005,
      nodeIntensity: (i) => (cores.indexOf(i) >= 0 ? 1 : 0.42),
      fill: 0.3
    });

    A.fit(built.pos, n, 1);
    return built;
  };

  // Two renderers can live on one page; the geometry is identical, so build it
  // once and hand out the same set.
  const cache = new Map();

  window.BiodynFigures = {
    build: (n) => {
      if (!cache.has(n)) cache.set(n, buildAll(n));
      return cache.get(n);
    }
  };

  function buildAll(n) {
    return ({
      cases: [modelOrganism(n), cutawayAudit(n), extraction(n)],
      organisms: {
        thesis: thesisFigure(n),
        exhaustive: exhaustiveFigure(n),
        groundtruth: groundTruthFigure(n),
        tensor: tensorFigure(n)
      },
      audits: {
        gap: gapFigure(n),
        recoverability: recoverabilityFigure(n),
        standard: standardFigure(n),
        coverage: coverageFigure(n)
      },
      applications: {
        grn: grnFigure(n),
        longevity: longevityFigure(n),
        neuro: neuroFigure(n),
        cell: cellFigure(n)
      }
    });
  }
})();
