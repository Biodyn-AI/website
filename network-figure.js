/* ========================================
   BIODYN, Hero field
   A small biological circuit in the left margin,
   an artificial network in the right margin, and
   a few faint axons crossing behind the text.

   The figure runs the full width of the hero and
   sits behind the copy, so the middle of the
   frame is not free real estate. Everything
   drawn there is dimmed by position rather than
   by hoping the geometry stays out of the way.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const NEU = window.BiodynNeuron;
  if (!A || !NEU) return;

  const BIO = 1;
  const ART = 4;

  /* Three neurons is a circuit; one is an illustration. They are cut down to
     the compartments that carry the silhouette, because at this size the
     interior detail costs points nobody can see. */
  const CIRCUIT_PARTS = [
    'soma', 'nucleus', 'dendrites', 'axon', 'myelin',
    'nodesOfRanvier', 'terminalArbor', 'boutons'
  ];

  /* The circuit sits on the right and its axons run leftward into the network.
     Mirroring the angle as well as the position is what keeps the axons
     pointing at the thing they synapse onto. */
  const NEURONS = [
    { scale: 0.32, angle: -1.5708, at: [1.06, 0.02], seedShift: 0 },
    { scale: 0.24, angle: -1.2566, at: [1.02, -0.50], seedShift: 601 },
    { scale: 0.23, angle: -1.8850, at: [1.00, 0.52], seedShift: 1201 }
  ];

  /* Input layer nearest the circuit, output furthest from it. */
  const LAYERS = [
    { x: -0.36, count: 6, spread: 0.42 },
    { x: -0.54, count: 8, spread: 0.54 },
    { x: -0.72, count: 8, spread: 0.54 },
    { x: -0.90, count: 6, spread: 0.42 },
    { x: -1.06, count: 3, spread: 0.20 }
  ];

  /* The copy sits in the middle of the frame. This is the corridor it gets. */
  const CORRIDOR = 0.50;
  /* The corridor is what keeps the copy readable. This was a blunt global
     discount on top of it, added while the dots were oversized and the whole
     field glowed; sharp dots do not need it. */
  const FIELD_DIM = 1;
  const BRIDGE_FLOOR = 0.5;

  const corridor = (x) => {
    const a = Math.abs(x);
    if (a >= CORRIDOR) return 1;
    return 0.05 + 0.95 * Math.pow(a / CORRIDOR, 2.6);
  };

  const network = (rand) => {
    const nodes = [];
    const edges = [];
    const layers = [];

    LAYERS.forEach((layer, li) => {
      const here = [];
      for (let k = 0; k < layer.count; k += 1) {
        const t = layer.count === 1 ? 0.5 : k / (layer.count - 1);
        const y = (t - 0.5) * 2 * layer.spread;
        const z = Math.sin((t - 0.5) * Math.PI) * 0.11;
        const centre = nodes.length;
        nodes.push([layer.x, y, z, 1]);
        /* A real circle in the plane facing the reader. The old ring squashed
           x to half of R while leaving y at full R, so every unit was an
           ellipse standing on its end. */
        const R = 0.050;
        const SEG = 22;
        for (let s = 0; s < SEG; s += 1) {
          const a = (s / SEG) * Math.PI * 2;
          nodes.push([
            layer.x + Math.cos(a) * R,
            y + Math.sin(a) * R,
            z,
            0.92
          ]);
          edges.push(centre + 1 + s, centre + 1 + ((s + 1) % SEG));
        }
        here.push(centre);
      }
      layers.push(here);
    });

    for (let li = 0; li + 1 < layers.length; li += 1) {
      const next = layers[li + 1];
      layers[li].forEach((a) => {
        const taken = {};
        const want = Math.min(3, next.length);
        for (let k = 0; k < want; k += 1) {
          let pick = Math.floor(rand() * next.length);
          for (let guard = 0; guard < 8 && taken[pick]; guard += 1) {
            pick = Math.floor(rand() * next.length);
          }
          taken[pick] = 1;
          const src = nodes[a], dst = nodes[next[pick]];
          let prev = a;
          for (let q = 1; q <= 7; q += 1) {
            const t = q / 8;
            nodes.push([
              src[0] + (dst[0] - src[0]) * t,
              src[1] + (dst[1] - src[1]) * t,
              src[2] + (dst[2] - src[2]) * t,
              0.34
            ]);
            edges.push(prev, nodes.length - 1);
            prev = nodes.length - 1;
          }
          edges.push(prev, next[pick]);
        }
      });
    }

    return { nodes, edges, layers };
  };

  let cache = null;

  const build = (n) => {
    if (cache && cache.n === n) return cache.figure;

    const nodes = [];
    const edges = [];
    const shellOf = [];
    const hueOf = [];
    /* The crossings are the one thing that is supposed to be in the corridor,
       so they are exempt from most of its discount. They are thin and sparse,
       which is what lets them cross type without fighting it. */
    const bridgeOf = [];
    let shellId = 1;

    const wanted = {};
    CIRCUIT_PARTS.forEach((name) => { wanted[name] = true; });

    const terminals = [];

    NEURONS.forEach((cell, ci) => {
      const ca = Math.cos(cell.angle), sa = Math.sin(cell.angle);
      const place = (p) => {
        const rx = p[0] * ca - p[1] * sa;
        const ry = p[0] * sa + p[1] * ca;
        return [
          rx * cell.scale + cell.at[0],
          ry * cell.scale + cell.at[1],
          p[2] * cell.scale
        ];
      };

      const produced = {};
      NEU.PARTS.forEach((part) => {
        if (!wanted[part.name]) return;
        const rand = A.makeRandom(part.seed + cell.seedShift);
        let out;
        try {
          out = part.from ? part.fn(rand, produced[part.from]) : part.fn(rand);
        } catch (error) {
          return;
        }
        if (part.name && out && out.nodes) produced[part.name] = out.nodes;
        if (!out || !out.nodes || !out.nodes.length) return;

        const offset = nodes.length;
        const localCount = out.nodes.length;
        const gain = part.gain === undefined ? 1 : part.gain;
        const shell = part.rim ? shellId : 0;
        if (part.rim) shellId += 1;

        for (let i = 0; i < localCount; i += 1) {
          const nd = out.nodes[i];
          const q = place(nd);
          const inten = (nd[3] === undefined ? 0.7 : nd[3]) * gain;
          nodes.push([q[0], q[1], q[2], inten > 1 ? 1 : inten]);
          shellOf.push(shell);
          hueOf.push(BIO);
          bridgeOf.push(0);
          if (part.name === 'boutons' && nd[3] > 0.9) {
            terminals.push({ index: nodes.length - 1, cell: ci, x: q[0], y: q[1], z: q[2] });
          }
        }

        const localEdges = out.edges || [];
        for (let e = 0; e + 1 < localEdges.length; e += 2) {
          const a = localEdges[e], b = localEdges[e + 1];
          if (a >= 0 && a < localCount && b >= 0 && b < localCount) {
            edges.push(a + offset, b + offset);
          }
        }
      });
    });

    const net = network(A.makeRandom(8803));
    const netOffset = nodes.length;
    net.nodes.forEach((nd) => {
      nodes.push([nd[0], nd[1], nd[2], nd[3]]);
      shellOf.push(0);
      hueOf.push(ART);
      bridgeOf.push(0);
    });
    for (let e = 0; e + 1 < net.edges.length; e += 2) {
      edges.push(net.edges[e] + netOffset, net.edges[e + 1] + netOffset);
    }

    /* The crossing. Only the terminals that already reach furthest right get a
       projection, and each is a slack curve rather than a straight line, so it
       reads as an axon finding its way across rather than as a ruled rule. */
    const inputs = net.layers[0].map((i) => i + netOffset);
    /* Taking the terminals that reach furthest took them all from whichever
       neuron happened to sit closest, and left the other two looking like
       decoration. Each neuron now sends its own. */
    const byCell = {};
    terminals.forEach((t) => {
      if (!byCell[t.cell]) byCell[t.cell] = [];
      byCell[t.cell].push(t);
    });
    const chosen = [];
    Object.keys(byCell).forEach((key) => {
      const group = byCell[key].sort((p, q) => p.x - q.x);
      const take = Math.min(3, group.length);
      for (let i = 0; i < take; i += 1) {
        chosen.push(group[Math.floor((i / take) * group.length)]);
      }
    });
    const crossings = chosen.length;
    const rand = A.makeRandom(4409);
    for (let k = 0; k < crossings; k += 1) {
      const from = chosen[k];
      const toIndex = inputs[k % inputs.length];
      const to = nodes[toIndex];
      const STEPS = 16;
      let prev = from.index;
      const sag = (rand() - 0.5) * 0.22;
      const drift = (rand() - 0.5) * 0.18;
      for (let s = 1; s < STEPS; s += 1) {
        const t = s / STEPS;
        const bow = Math.sin(Math.PI * t);
        const x = from.x + (to[0] - from.x) * t;
        const y = from.y + (to[1] - from.y) * t + sag * bow;
        const z = from.z + (to[2] - from.z) * t + drift * bow;
        nodes.push([x, y, z, 0.62]);
        shellOf.push(0);
        hueOf.push(BIO);
        bridgeOf.push(1);
        edges.push(prev, nodes.length - 1);
        prev = nodes.length - 1;
      }
      edges.push(prev, toIndex);
    }

    const nodeCount = nodes.length;
    /* The skeleton alone runs past the requested budget, so without this there
       is no fill at all and every balancing knob downstream is inert. */
    const total = Math.max(n, Math.round(nodeCount * 1.32));
    const pos = new Float32Array(total * 3);
    const intensity = new Float32Array(total);

    for (let i = 0; i < nodeCount; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = nodes[i][3];
    }

    const usable = [];
    const weightOf = [];
    for (let e = 0; e + 1 < edges.length; e += 2) {
      if (edges[e] < nodeCount && edges[e + 1] < nodeCount) {
        usable.push(edges[e], edges[e + 1]);
        weightOf.push(hueOf[edges[e]] === ART ? 8 : 1);
      }
    }

    const edgeCount = usable.length / 2;
    const fillStart = nodeCount;

    if (edgeCount > 0 && total > fillStart) {
      const cumulative = new Float64Array(edgeCount);
      let running = 0;
      for (let e = 0; e < edgeCount; e += 1) {
        const a = usable[e * 2], b = usable[e * 2 + 1];
        running += Math.hypot(
          nodes[b][0] - nodes[a][0],
          nodes[b][1] - nodes[a][1],
          nodes[b][2] - nodes[a][2]
        ) * weightOf[e];
        cumulative[e] = running;
      }
      /* Two pools rather than one. Weighting artificial edges up inside a
         single pool still left them at 527 points against 7000, because the
         circuit simply has far more wire; the artificial half now gets a fixed
         share of the budget regardless of how much wire each side owns. */
      let artWire = 0, bioWire = 0;
      for (let e = 0; e < edgeCount; e += 1) {
        const seg = e === 0 ? cumulative[0] : cumulative[e] - cumulative[e - 1];
        if (hueOf[usable[e * 2]] === ART) artWire += seg; else bioWire += seg;
      }
      const artShare = Math.round((total - fillStart) * 0.34);

      const fillRand = A.makeRandom(20609);
      const wire = running || 1;
      for (let i = fillStart; i < total; i += 1) {
        const wantArt = (i - fillStart) < artShare;
        let pick = fillRand() * wire;
        let lo = 0, hi = edgeCount - 1;
        for (let tries = 0; tries < 40; tries += 1) {
          lo = 0; hi = edgeCount - 1;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cumulative[mid] < pick) lo = mid + 1; else hi = mid;
          }
          if ((hueOf[usable[lo * 2]] === ART) === wantArt) break;
          pick = fillRand() * wire;
        }
        const ia = usable[lo * 2];
        const a = nodes[ia], b = nodes[usable[lo * 2 + 1]];
        const t = fillRand();
        pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(fillRand) * 0.003;
        pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(fillRand) * 0.003;
        pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(fillRand) * 0.003;
        intensity[i] = Math.min(a[3], b[3]) * 0.4;
        shellOf[i] = 0;
        hueOf[i] = hueOf[ia] || BIO;
        bridgeOf[i] = bridgeOf[ia] || 0;
      }
    } else {
      for (let i = fillStart; i < total; i += 1) intensity[i] = 0;
    }

    /* Fit to the bounding box on the wide axis, then hand the corridor its
       discount. Dimming after the fit means the corridor is measured in the
       frame the reader sees, not in whatever space the geometry was authored
       in. */
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < total; i += 1) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const half = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    const k = half > 0 ? 1 / half : 1;
    for (let i = 0; i < total; i += 1) {
      pos[i * 3] = (pos[i * 3] - cx) * k;
      pos[i * 3 + 1] = (pos[i * 3 + 1] - cy) * k;
      pos[i * 3 + 2] = (pos[i * 3 + 2] - cz) * k;
      /* A dendritic tree packs far more structure into its area than a lattice
         does, so equal treatment is not equal weight on the page. */
      const side = hueOf[i] === ART ? 1.18 : 0.74;
      intensity[i] *= FIELD_DIM * side;
      if (intensity[i] > 1) intensity[i] = 1;
    }

    const normal = new Float32Array(total * 3);
    const shell = new Uint8Array(total);
    const hue = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) hue[i] = hueOf[i] || BIO;

    for (let g = 1; g < shellId; g += 1) {
      let sx = 0, sy = 0, sz = 0, count = 0;
      for (let i = 0; i < total; i += 1) {
        if (shellOf[i] !== g) continue;
        sx += pos[i * 3]; sy += pos[i * 3 + 1]; sz += pos[i * 3 + 2]; count += 1;
      }
      if (!count) continue;
      sx /= count; sy /= count; sz /= count;
      for (let i = 0; i < total; i += 1) {
        if (shellOf[i] !== g) continue;
        const dx = pos[i * 3] - sx, dy = pos[i * 3 + 1] - sy, dz = pos[i * 3 + 2] - sz;
        const l = Math.hypot(dx, dy, dz) || 1;
        normal[i * 3] = dx / l; normal[i * 3 + 1] = dy / l; normal[i * 3 + 2] = dz / l;
        shell[i] = 1;
      }
    }

    let hx = 0, hy = 0;
    for (let i = 0; i < total; i += 1) {
      const ax = Math.abs(pos[i * 3]), ay = Math.abs(pos[i * 3 + 1]);
      if (ax > hx) hx = ax;
      if (ay > hy) hy = ay;
    }

    const bridge = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) bridge[i] = bridgeOf[i] ? 1 : 0;

    const figure = {
      pos, intensity, edges: usable, n: total, normal, shell, hue,
      /* The corridor is handed to the renderer rather than baked in. Baked, it
         is a region of the geometry, and the geometry turns: after a few
         seconds of rotation the protected zone had swung away and the neurons
         were crossing the headline at full brightness. Applied to the
         projected position it stays where the text is. */
      corridor: CORRIDOR,
      corridorFloor: 0.05,
      bridge,
      halfExtent: [hx, hy],
      /* Stop short of the edge fade so the dendrites end rather than dissolve. */
      fill: 0.40,
      /* About 26 degrees, turning the circuit toward the reader. The rotation
         then carries it slowly to flat and only afterwards behind, which buys
         roughly sixteen seconds of it facing front instead of none. */
      startYaw: -0.45,
      /* Each neuron here is roughly a third of the frame, so its detail is
         roughly a third the size the frame would imply. */
      dotScale: 0.42
    };
    cache = { n, figure };
    return figure;
  };

  window.BiodynField = { build };
})();
