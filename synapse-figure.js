/* ========================================
   BIODYN, Hero synapse
   A biological neuron on the left, an artificial
   network on the right, joined at the synapse.

   The two halves are drawn in deliberately
   different languages. The neuron is irregular,
   curved and tapering, and it is reused verbatim
   from the neuron figure. The network is a
   perfectly regular lattice of identical units on
   straight lines. That contrast is the whole
   argument: the same signal, two substrates, and
   Biodyn works on the seam between them.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const NEU = window.BiodynNeuron;
  if (!A || !NEU) return;

  const BIO = 1;
  const ART = 4;

  /* ---------------------------------------
     The artificial half
     --------------------------------------- */

  const LAYERS = [
    { x: 0.52, count: 5, spread: 0.34 },
    { x: 0.80, count: 7, spread: 0.46 },
    { x: 1.08, count: 5, spread: 0.34 },
    { x: 1.32, count: 3, spread: 0.18 }
  ];

  /* Units are identical and evenly spaced, which is the point: nothing in the
     left half repeats and nothing in the right half does not. */
  const network = (rand) => {
    const nodes = [];
    const edges = [];
    const layers = [];

    LAYERS.forEach((layer, li) => {
      const here = [];
      for (let k = 0; k < layer.count; k += 1) {
        const t = layer.count === 1 ? 0.5 : k / (layer.count - 1);
        const y = (t - 0.5) * 2 * layer.spread;
        const z = Math.sin(li * 1.7 + k * 0.9) * 0.10;
        const centre = nodes.length;
        nodes.push([layer.x, y, z, 1]);
        // a small ring around each unit, so it reads as a node and not a speck
        const R = 0.030;
        for (let s = 0; s < 8; s += 1) {
          const a = (s / 8) * Math.PI * 2;
          nodes.push([
            layer.x + Math.cos(a) * R * 0.55,
            y + Math.sin(a) * R,
            z + Math.cos(a) * R * 0.4,
            0.52
          ]);
          edges.push(centre + 1 + s, centre + 1 + ((s + 1) % 8));
        }
        here.push(centre);
      }
      layers.push(here);
    });

    /* Sparse, not complete. Every unit reaching every unit in the next layer
       is what a diagram says a network is, but drawn at this density it buries
       the layer structure it exists to show, so each unit keeps a few of its
       strongest connections. */
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
          edges.push(a, next[pick]);
        }
      });
    }

    return { nodes, edges, layers };
  };

  /* ---------------------------------------
     Assembly
     --------------------------------------- */

  let cache = null;

  const build = (n) => {
    if (cache && cache.n === n) return cache.figure;

    const nodes = [];
    const edges = [];
    const shellOf = [];
    const hueOf = [];
    let shellId = 1;

    /* The neuron is turned a quarter turn so the signal runs left to right,
       which is the direction a network diagram is read in. */
    const place = (p) => {
      const rx = -p[1];
      const ry = p[0];
      const rz = p[2];
      return [rx * 0.62 - 0.86, ry * 0.62, rz * 0.62];
    };

    const produced = {};
    let terminalTips = [];

    NEU.PARTS.forEach((part) => {
      const rand = A.makeRandom(part.seed + 13);
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
        if (part.name === 'boutons' && nd[3] > 0.9) terminalTips.push(nodes.length - 1);
      }

      const localEdges = out.edges || [];
      for (let e = 0; e + 1 < localEdges.length; e += 2) {
        const a = localEdges[e], b = localEdges[e + 1];
        if (a >= 0 && a < localCount && b >= 0 && b < localCount) {
          edges.push(a + offset, b + offset);
        }
      }
    });

    const net = network(A.makeRandom(5501));
    const netOffset = nodes.length;
    net.nodes.forEach((nd) => {
      nodes.push([nd[0], nd[1], nd[2], nd[3]]);
      shellOf.push(0);
      hueOf.push(ART);
    });
    for (let e = 0; e + 1 < net.edges.length; e += 2) {
      edges.push(net.edges[e] + netOffset, net.edges[e + 1] + netOffset);
    }

    /* The synapse itself: the boutons of the real axon terminating on the
       input units of the artificial one. These few edges are the entire idea,
       so they are drawn from the actual bouton nodes rather than implied. */
    const inputs = net.layers[0].map((i) => i + netOffset);
    const bridges = Math.min(terminalTips.length, 26);
    for (let k = 0; k < bridges; k += 1) {
      const from = terminalTips[Math.floor((k / bridges) * terminalTips.length)];
      const to = inputs[k % inputs.length];
      edges.push(from, to);
    }

    const nodeCount = nodes.length;
    const total = Math.max(n, nodeCount);
    const pos = new Float32Array(total * 3);
    const intensity = new Float32Array(total);

    for (let i = 0; i < nodeCount; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = nodes[i][3];
    }

    const usable = [];
    for (let e = 0; e + 1 < edges.length; e += 2) {
      if (edges[e] < nodeCount && edges[e + 1] < nodeCount) {
        usable.push(edges[e], edges[e + 1]);
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
        );
        cumulative[e] = running;
      }
      const rand = A.makeRandom(31337);
      const wire = running || 1;
      for (let i = fillStart; i < total; i += 1) {
        const pick = rand() * wire;
        let lo = 0, hi = edgeCount - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < pick) lo = mid + 1; else hi = mid;
        }
        const ia = usable[lo * 2];
        const a = nodes[ia], b = nodes[usable[lo * 2 + 1]];
        const t = rand();
        pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(rand) * 0.003;
        pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(rand) * 0.003;
        pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(rand) * 0.003;
        intensity[i] = Math.min(a[3], b[3]) * 0.4;
        shellOf[i] = 0;
        hueOf[i] = hueOf[ia] || BIO;
      }
    } else {
      for (let i = fillStart; i < total; i += 1) intensity[i] = 0;
    }

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

    const figure = {
      pos, intensity, edges: usable, n: total, normal, shell, hue,
      halfExtent: [hx, hy]
    };
    cache = { n, figure };
    return figure;
  };

  window.BiodynSynapse = { build };
})();
