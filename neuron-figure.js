/* ========================================
   BIODYN, Hero neuron, geometry
   A neuron assembled from one function per
   compartment, in the same point-cloud language
   as the cell figure.

   The cell version was legible only to people who
   already knew what they were looking at. A
   neuron has a silhouette almost nobody misreads:
   an arbor above, a body, a long process below,
   an arbor again at the end.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  if (!A) return;

  /* ---------------------------------------
     Compartments
     Each returns skeleton nodes as
     [x, y, z, intensity] plus a flat list of
     index pairs. A compartment that has to sit
     on another one takes the parent's nodes as
     a second argument, because placing it blind
     puts it in the gaps instead.
     --------------------------------------- */

  const soma = (rand) => {
    const nodes = [], edges = [];
    const N = 234, R = 0.16, GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const uy = 1 - (2 * i + 1) / N;
      const rr = Math.sqrt(Math.max(0, 1 - uy * uy));
      const th = GA * i + (rand() - 0.5) * 0.12;
      const ux = Math.cos(th) * rr, uz = Math.sin(th) * rr;
      let lat = 1 + 0.20 * Math.max(0, uy) * (1 - 0.30 * uy);
      if (uy < -0.30) { const q = (-uy - 0.30) / 0.70; lat *= 1 + 0.17 * Math.pow(q, 1.5); }
      const wob = 1 + (rand() - 0.5) * 0.05;
      nodes.push([
        R * ux * lat * wob,
        R * uy * (uy > 0 ? 0.90 : 1.08) * wob,
        R * uz * lat * wob * 0.95,
        0.30 + rand() * 0.05
      ]);
    }
    const seen = {};
    for (let i = 0; i < N; i++) {
      const a = nodes[i];
      const bi = [-1, -1, -1], bd = [9, 9, 9];
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const b = nodes[j];
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd[0]) { bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = bd[0]; bi[1] = bi[0]; bd[0] = d; bi[0] = j; }
        else if (d < bd[1]) { bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = d; bi[1] = j; }
        else if (d < bd[2]) { bd[2] = d; bi[2] = j; }
      }
      for (let k = 0; k < 3; k++) {
        const j = bi[k];
        if (j < 0) continue;
        const key = (i < j ? i : j) * 1000 + (i < j ? j : i);
        if (seen[key]) continue;
        seen[key] = 1;
        edges.push(i, j);
      }
    }
    const RINGS = 5, PER = 12, base = nodes.length;
    for (let s = 0; s < RINGS; s++) {
      const t = s / (RINGS - 1);
      const y = -0.150 - 0.090 * t;
      const r = 0.090 + (0.035 - 0.090) * Math.pow(t, 0.75);
      for (let k = 0; k < PER; k++) {
        const a = (k / PER) * Math.PI * 2 + s * 0.10;
        const w = 1 + (rand() - 0.5) * 0.06;
        nodes.push([
          Math.cos(a) * r * w,
          y + (rand() - 0.5) * 0.004,
          Math.sin(a) * r * w * 0.95,
          0.50 + rand() * 0.10
        ]);
      }
    }
    for (let s = 0; s < RINGS; s++) {
      for (let k = 0; k < PER; k++) {
        const i = base + s * PER + k;
        edges.push(i, base + s * PER + ((k + 1) % PER));
        if (s < RINGS - 1) edges.push(i, i + PER);
      }
    }
    return { nodes, edges };
  };

  const nucleus = (rand) => {
    const nodes = [], edges = [];
    const CY = 0.015, R = 0.085, N = 112, GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const uy = 1 - (2 * i + 1) / N;
      const rr = Math.sqrt(Math.max(0, 1 - uy * uy));
      const th = GA * i + (rand() - 0.5) * 0.12;
      const w = R * (1 + (rand() - 0.5) * 0.07);
      nodes.push([Math.cos(th) * rr * w, CY + uy * w * 0.97, Math.sin(th) * rr * w * 0.95, 0.58 + rand() * 0.08]);
    }
    const seen = {};
    for (let i = 0; i < N; i++) {
      const a = nodes[i];
      const bi = [-1, -1, -1], bd = [9, 9, 9];
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const b = nodes[j];
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd[0]) { bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = bd[0]; bi[1] = bi[0]; bd[0] = d; bi[0] = j; }
        else if (d < bd[1]) { bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = d; bi[1] = j; }
        else if (d < bd[2]) { bd[2] = d; bi[2] = j; }
      }
      for (let k = 0; k < 3; k++) {
        const j = bi[k];
        if (j < 0) continue;
        const key = (i < j ? i : j) * 1000 + (i < j ? j : i);
        if (seen[key]) continue;
        seen[key] = 1;
        edges.push(i, j);
      }
    }
    const base = nodes.length, M = 44, NR = 0.028, cx = 0.030, cy = CY + 0.026, cz = 0.014;
    for (let i = 0; i < M; i++) {
      const uy = 1 - (2 * i + 1) / M;
      const rr = Math.sqrt(Math.max(0, 1 - uy * uy));
      const th = GA * i + (rand() - 0.5) * 0.12;
      const w = NR * (0.62 + 0.38 * Math.pow(rand(), 0.35));
      nodes.push([cx + Math.cos(th) * rr * w, cy + uy * w, cz + Math.sin(th) * rr * w, 0.94 + rand() * 0.06]);
    }
    const seen2 = {};
    for (let i = 0; i < M; i++) {
      const a = nodes[base + i];
      const bi = [-1, -1, -1, -1], bd = [9, 9, 9, 9];
      for (let j = 0; j < M; j++) {
        if (j === i) continue;
        const b = nodes[base + j];
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd[0]) { bd[3] = bd[2]; bi[3] = bi[2]; bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = bd[0]; bi[1] = bi[0]; bd[0] = d; bi[0] = j; }
        else if (d < bd[1]) { bd[3] = bd[2]; bi[3] = bi[2]; bd[2] = bd[1]; bi[2] = bi[1]; bd[1] = d; bi[1] = j; }
        else if (d < bd[2]) { bd[3] = bd[2]; bi[3] = bi[2]; bd[2] = d; bi[2] = j; }
        else if (d < bd[3]) { bd[3] = d; bi[3] = j; }
      }
      for (let k = 0; k < 4; k++) {
        const j = bi[k];
        if (j < 0) continue;
        const key = (i < j ? i : j) * 1000 + (i < j ? j : i);
        if (seen2[key]) continue;
        seen2[key] = 1;
        edges.push(base + i, base + j);
      }
    }
    return { nodes, edges };
  };

  const nisslBodies = (rand) => {
    const nodes = [], edges = [];
    const ny = 0.015;
    const norm = (v) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
    const frame = (u) => {
      const a = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const v = norm([u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]);
      const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      return [v, w];
    };
    for (let s = 0; s < 5; s++) {
      const th = 2 * Math.PI * (s / 5) + 0.7 * rand(), cp = 1 - 2 * (0.15 + 0.7 * rand());
      const sp = Math.sqrt(Math.max(0, 1 - cp * cp));
      const n = norm([sp * Math.cos(th), cp, sp * Math.sin(th) * 0.65]);
      const fr = frame(n), u = fr[0], w = fr[1];
      const d = 0.103 + 0.010 * rand();
      const cx = n[0] * d, cy = ny + n[1] * d, cz = n[2] * d;
      const half = 0.023 + 0.004 * rand(), gap = 0.0115, bow = 0.005 * (rand() - 0.5);
      let prevCorner = -1;
      for (let k = 0; k < 4; k++) {
        const off = (k - 1.5) * gap, base = nodes.length;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const a = (i - 1) * half, b = (j - 1) * half;
            const lift = off + bow * (a * a + b * b) / (half * half) + 0.0015 * (rand() - 0.5);
            nodes.push([
              cx + u[0] * a + w[0] * b + n[0] * lift,
              cy + u[1] * a + w[1] * b + n[1] * lift,
              cz + u[2] * a + w[2] * b + n[2] * lift,
              0.55
            ]);
          }
        }
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            edges.push(base + i * 3 + j, base + i * 3 + j + 1);
            edges.push(base + j * 3 + i, base + (j + 1) * 3 + i);
          }
        }
        if (prevCorner >= 0) edges.push(prevCorner, base + 8);
        prevCorner = base + 8;
        for (let g = 0; g < 5; g++) {
          const gi = Math.min(8, Math.floor(rand() * 9)), sgn = rand() < 0.5 ? -1 : 1;
          const p = nodes[base + gi], rb = nodes.length;
          nodes.push([
            p[0] + n[0] * sgn * 0.006 + u[0] * 0.004 * (rand() - 0.5),
            p[1] + n[1] * sgn * 0.006 + u[1] * 0.004 * (rand() - 0.5),
            p[2] + n[2] * sgn * 0.006 + u[2] * 0.004 * (rand() - 0.5),
            0.95
          ]);
          edges.push(base + gi, rb);
        }
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const microtubuleHalo = (rand) => {
    const nodes = [];
    const edges = [];
    for (let s = 0; s < 90; s++) {
      let u = Math.pow(rand(), 1 / 3) * 0.105;
      // the nucleus fills the middle of the soma; half of these landed inside it
      if (u < 0.098) u = 0.098 + rand() * 0.045;
      const ct = rand() * 2 - 1;
      const st = Math.sqrt(1 - ct * ct);
      const ph = rand() * 6.2832;
      const x = u * st * Math.cos(ph);
      const y = u * ct * 1.12 + 0.012;
      const z = u * st * Math.sin(ph) * 0.85;
      const dct = rand() * 2 - 1;
      const dst = Math.sqrt(1 - dct * dct);
      const dph = rand() * 6.2832;
      const len = 0.018 + rand() * 0.024;
      nodes.push([x, y, z, 0.3]);
      nodes.push([
        x + dst * Math.cos(dph) * len,
        y + dct * len,
        z + dst * Math.sin(dph) * len * 0.8,
        0.3
      ]);
      edges.push(nodes.length - 2, nodes.length - 1);
    }
    return { nodes: nodes, edges: edges };
  };

  const dendrites = (rand) => {
    const nodes = [], edges = [];
    const ZS = 0.55;
    const add = (p, w) => { nodes.push([p[0], p[1], p[2] * ZS, w]); return nodes.length - 1; };
    const norm = (v) => { const m = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const perp = (d) => norm(cross(d, Math.abs(d[1]) < 0.88 ? [0, 1, 0] : [1, 0, 0]));
    const rot = (d, u, a) => { const c = Math.cos(a), s = Math.sin(a); return norm([d[0] * c + u[0] * s, d[1] * c + u[1] * s, d[2] * c + u[2] * s]); };
    const upAxis = (d) => norm([-d[0] * d[1], 1 - d[1] * d[1], -d[2] * d[1]]);
    const LEN = [0.300, 0.216, 0.156, 0.112];
    const TH = [0.055, 0.0341, 0.0211, 0.0131];
    const I0 = [0.90, 0.78, 0.68, 0.58];
    const I1 = [0.78, 0.68, 0.58, 0.48];
    // ring of 5 nodes girdling the segment axis, so proximal dendrites read as tubes
    const ring = (p, d, r, roll) => {
      const u = perp(d), v = cross(d, u), out = [];
      for (let k = 0; k < 5; k++) {
        const a = roll + k * 1.2566 + (rand() - 0.5) * 0.34, rr = r * (0.88 + rand() * 0.24);
        const c = Math.cos(a) * rr, s = Math.sin(a) * rr;
        out.push(add([p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s], 0.28));
      }
      for (let k = 0; k < 5; k++) edges.push(out[k], out[(k + 1) % 5]);
      return out;
    };
    const grow = (p0, d0, gen, parent) => {
      const L = LEN[gen], th = TH[gen], N = 4 + Math.floor(rand() * 3);
      const bendAx = perp(d0), bendPer = (rand() - 0.5) * 0.62 / N, upPer = (0.16 - gen * 0.03) / N, roll = rand() * 6.283;
      let d = [d0[0], d0[1], d0[2]], p = [p0[0], p0[1], p0[2]], prev = parent;
      const step = L / N, rings = [];
      for (let i = 0; i < N; i++) {
        d = rot(d, bendAx, bendPer);
        d = rot(d, upAxis(d), upPer);
        p = [p[0] + d[0] * step, p[1] + d[1] * step, p[2] + d[2] * step];
        const t = (i + 1) / N;
        const idx = add(p, I0[gen] + (I1[gen] - I0[gen]) * t);
        edges.push(prev, idx);
        prev = idx;
        if (gen === 0 && i < 3) rings.push([ring(p, d, th * (1 - 0.34 * t), roll), idx]);
        if (gen === 1 && i === (N >> 1)) rings.push([ring(p, d, th * (1 - 0.34 * t), roll), idx]);
      }
      for (const rg of rings) edges.push(rg[1], rg[0][0]);
      if (gen === 3) return;
      const n = rand() < 0.22 ? 3 : 2;
      const u = perp(d), v = cross(d, u), br = rand() * 6.283;
      for (let k = 0; k < n; k++) {
        const a = br + k * (6.283 / n) + (rand() - 0.5) * 0.5;
        const ax = [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)];
        let cd = rot(d, ax, 0.489 + rand() * 0.244);
        cd = norm([cd[0], cd[1] + 0.09, cd[2]]);
        if (cd[1] < -0.09) cd = norm([cd[0], -0.09, cd[2]]);
        grow(p, cd, gen + 1, prev);
      }
    };
    // Uneven on purpose. Evenly spaced primaries at matching elevations read
    // as a diagram of a neuron rather than as one.
    const elev = [1.46, 0.62, 1.02, -0.02, 0.30, 0.86];
    const azim = [0.24, 1.02, 2.21, 3.02, 4.35, 5.29];
    for (let i = 0; i < 6; i++) {
      const az = azim[i] + (rand() - 0.5) * 0.55;
      const el = elev[i] + (rand() - 0.5) * 0.34;
      const d = norm([Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)]);
      const p = [d[0] * 0.16, d[1] * 0.16, d[2] * 0.16];
      const root = add(p, 0.95);
      grow(p, d, 0, root);
    }
    return { nodes, edges };
  };

  const dendriticSpines = (rand, parent) => {
    const nodes = [], edges = [];
    if (!parent || !parent.length) return { nodes, edges };
    // Spines ride on real dendrite nodes. Placing them on an abstract shell,
    // which is all a blind function can do, scatters them into the gaps
    // between branches and reads as fog.
    const host = [];
    for (let i = 0; i < parent.length; i += 1) {
      const p = parent[i];
      const r = Math.hypot(p[0], p[1], p[2]);
      if (r > 0.40 && p[1] > -0.02) host.push(p);
    }
    if (!host.length) return { nodes, edges };
    const want = Math.min(170, host.length);
    for (let s = 0; s < want; s += 1) {
      const p = host[Math.floor(rand() * host.length)];
      const rl = Math.hypot(p[0], p[1], p[2]) || 1;
      let ox = p[0] / rl + (rand() - 0.5) * 1.1;
      let oy = p[1] / rl + (rand() - 0.5) * 1.1;
      let oz = p[2] / rl + (rand() - 0.5) * 1.1;
      const ol = Math.hypot(ox, oy, oz) || 1;
      ox /= ol; oy /= ol; oz /= ol;
      const len = 0.020 + rand() * 0.012;
      const base = nodes.length;
      nodes.push([p[0], p[1], p[2], 0.72]);
      nodes.push([p[0] + ox * len, p[1] + oy * len, p[2] + oz * len, 0.96]);
      edges.push(base, base + 1);
    }
    return { nodes, edges };
  };

  const neurofilaments = (rand) => {
    const nodes = [];
    const edges = [];
    // centre line of the axon, matched to the axon's own path
    const axonAt = (t) => {
      const y = -0.24 - 1.16 * t;
      const x = 0.05 * t * t + 0.016 * Math.sin(4.9 * t + 0.7);
      const z = 0.013 * Math.sin(3.6 * t + 1.5);
      return [x, y, z];
    };
    // five strands spiralling gently around the axon centre line
    for (let f = 0; f < 5; f++) {
      const base = (f / 5) * Math.PI * 2 + rand() * 0.5;
      const rad = 0.007 + rand() * 0.008;
      const ph = rand() * 6.2832;
      const twist = 1.2 + rand() * 2.0;
      for (let i = 0; i < 34; i++) {
        const t = i / 33;
        const p = axonAt(t);
        const a = base + twist * t + 0.55 * Math.sin(2.7 * t + ph);
        const jx = 0.004 * Math.sin(8.5 * t + ph);
        const jy = 0.003 * Math.sin(6.1 * t + ph * 1.7);
        nodes.push([
          p[0] + Math.cos(a) * rad + jx,
          p[1] + jy,
          p[2] + Math.sin(a) * rad * 0.8,
          0.4
        ]);
        if (i > 0) edges.push(nodes.length - 2, nodes.length - 1);
      }
    }
    // six shorter strands leaving the soma into the proximal dendrites
    const dirs = [
      [0.0, 1.0, 0.1], [-0.5, 0.86, -0.15], [0.52, 0.85, 0.12],
      [-0.84, 0.52, 0.1], [0.86, 0.48, -0.12], [-0.24, 0.96, -0.08]
    ];
    for (let f = 0; f < 6; f++) {
      const d = dirs[f];
      const L = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
      const ux = d[0] / L, uy = d[1] / L, uz = d[2] / L;
      const px = -uy, py = ux, pz = 0.0;
      const bend = (rand() - 0.5) * 0.10;
      const ph = rand() * 6.2832;
      const r0 = 0.07 + rand() * 0.03;
      const r1 = 0.40 + rand() * 0.05;
      for (let i = 0; i < 30; i++) {
        const t = i / 29;
        const r = r0 + (r1 - r0) * t;
        const b = bend * t * t + 0.006 * Math.sin(7.0 * t + ph);
        nodes.push([
          ux * r + px * b,
          uy * r + py * b,
          uz * r + pz * b + 0.008 * Math.sin(5.0 * t + ph),
          0.4
        ]);
        if (i > 0) edges.push(nodes.length - 2, nodes.length - 1);
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const axon = (rand) => {
    const nodes = [], edges = [];
    const cen = (t) => {
      return [
        0.05 * t * t * (3 - 2 * t),
        -0.24 - 1.18 * t,
        0
      ];
    };
    const N = 70;
    const path = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const c = cen(t);
      const w = Math.sin(Math.PI * t);
      const p = [
        c[0] + (rand() - 0.5) * 0.006 * w,
        c[1] + (rand() - 0.5) * 0.004,
        c[2] + (rand() - 0.5) * 0.006 * w
      ];
      path.push(p);
      nodes.push([p[0], p[1], p[2], 0.86 - 0.06 * t]);
      if (i > 0) edges.push(i - 1, i);
    }
    let prev = -1;
    for (let i = 0; i < N; i += 3) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(N - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
      const L = Math.hypot(tx, ty, tz) || 1;
      tx /= L; ty /= L; tz /= L;
      let ux = ty, uy = -tx, uz = 0;
      const M = Math.hypot(ux, uy, uz) || 1;
      ux /= M; uy /= M; uz /= M;
      const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
      const base = nodes.length, ph = rand() * 0.6;
      for (let k = 0; k < 4; k++) {
        const ang = ph + k * Math.PI * 0.5, r = 0.030 * (0.94 + rand() * 0.12);
        const ca = Math.cos(ang), sa = Math.sin(ang);
        nodes.push([
          path[i][0] + (ux * ca + vx * sa) * r,
          path[i][1] + (uy * ca + vy * sa) * r,
          path[i][2] + (uz * ca + vz * sa) * r,
          0.46
        ]);
      }
      for (let k = 0; k < 4; k++) edges.push(base + k, base + (k + 1) % 4);
      if (prev >= 0) for (let k = 0; k < 4; k++) edges.push(prev + k, base + k);
      prev = base;
    }
    return { nodes: nodes, edges: edges };
  };

  const myelin = (rand) => {
    const nodes = [], edges = [];
    const cen = (t) => {
      const s = Math.sin(Math.PI * t);
      return [
        0.05 * t * t * (3 - 2 * t) + 0.035 * Math.sin(2.5 * Math.PI * t) * s,
        -0.24 - 1.18 * t,
        0.045 * Math.sin(1.7 * Math.PI * t + 0.4) * s
      ];
    };
    const at = (y) => cen((-0.24 - y) / 1.18);
    const RING = 12, ROWS = 5;
    for (let s = 0; s < 7; s++) {
      const y0 = -0.36 - 0.14 * s, y1 = y0 - 0.10;
      const twist = rand() * 0.5;
      let prev = -1;
      for (let r = 0; r < ROWS; r++) {
        const f = r / (ROWS - 1);
        const y = y0 + (y1 - y0) * f;
        const c = at(y);
        const b = at(y - 0.004);
        let tx = b[0] - c[0], ty = b[1] - c[1], tz = b[2] - c[2];
        const L = Math.hypot(tx, ty, tz) || 1;
        tx /= L; ty /= L; tz /= L;
        let ux = ty, uy = -tx, uz = 0;
        const M = Math.hypot(ux, uy, uz) || 1;
        ux /= M; uy /= M; uz /= M;
        const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
        const rad = 0.062 * (0.82 + 0.18 * Math.sin(Math.PI * (0.18 + 0.64 * f)));
        const base = nodes.length;
        const inten = (r === 0 || r === ROWS - 1) ? 0.52 : 0.45;
        for (let k = 0; k < RING; k++) {
          const ang = twist + 0.12 * f + k * 2 * Math.PI / RING;
          const rr = rad * (0.97 + rand() * 0.06);
          const ca = Math.cos(ang), sa = Math.sin(ang);
          nodes.push([
            c[0] + (ux * ca + vx * sa) * rr,
            c[1] + (uy * ca + vy * sa) * rr,
            c[2] + (uz * ca + vz * sa) * rr,
            inten
          ]);
        }
        for (let k = 0; k < RING; k++) edges.push(base + k, base + (k + 1) % RING);
        if (prev >= 0) for (let k = 0; k < RING; k++) edges.push(prev + k, base + k);
        prev = base;
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const nodesOfRanvier = (rand) => {
    const nodes = [], edges = [];
    const cen = (t) => {
      const s = Math.sin(Math.PI * t);
      return [
        0.05 * t * t * (3 - 2 * t) + 0.035 * Math.sin(2.5 * Math.PI * t) * s,
        -0.24 - 1.18 * t,
        0.045 * Math.sin(1.7 * Math.PI * t + 0.4) * s
      ];
    };
    const at = (y) => cen((-0.24 - y) / 1.18);
    const RING = 7;
    for (let g = 0; g < 6; g++) {
      const y = -0.48 - 0.14 * g;
      const c = at(y);
      const b = at(y - 0.004);
      let tx = b[0] - c[0], ty = b[1] - c[1], tz = b[2] - c[2];
      const L = Math.hypot(tx, ty, tz) || 1;
      tx /= L; ty /= L; tz /= L;
      let ux = ty, uy = -tx, uz = 0;
      const M = Math.hypot(ux, uy, uz) || 1;
      ux /= M; uy /= M; uz /= M;
      const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
      const base = nodes.length, ph = rand() * 0.9;
      for (let k = 0; k < RING; k++) {
        const ang = ph + k * 2 * Math.PI / RING;
        const rr = 0.036 * (0.96 + rand() * 0.08);
        const ca = Math.cos(ang), sa = Math.sin(ang);
        nodes.push([
          c[0] + (ux * ca + vx * sa) * rr,
          c[1] + (uy * ca + vy * sa) * rr,
          c[2] + (uz * ca + vz * sa) * rr,
          1.0
        ]);
      }
      for (let k = 0; k < RING; k++) edges.push(base + k, base + (k + 1) % RING);
    }
    return { nodes: nodes, edges: edges };
  };

  const terminalArbor = (rand) => {
    const nodes = [];
    const edges = [];
    const add = (x, y, z) => {
      // brighter near the axon, fading into the tips, the way the dendrites do
      const t = Math.min(1, Math.max(0, (-1.42 - y) / 0.36));
      nodes.push([x, y, z, 0.88 - 0.30 * t]);
      return nodes.length - 1;
    };
    // grow one tapering segment chain from a parent node in direction (phi, tilt)
    const grow = (from, fromIdx, phi, tilt, len, count, droop) => {
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const dx = Math.cos(phi) * ct, dy = -st, dz = 0.5 * Math.sin(phi) * ct;
      let prev = fromIdx, ex = from[0], ey = from[1], ez = from[2];
      for (let k = 1; k <= count; k++) {
        const t = k / count;
        ex = from[0] + dx * len * t + (rand() - 0.5) * 0.007;
        ey = from[1] + dy * len * t - droop * t * t + (rand() - 0.5) * 0.005;
        ez = from[2] + dz * len * t + (rand() - 0.5) * 0.007;
        const idx = add(ex, ey, ez);
        edges.push(prev, idx);
        prev = idx;
      }
      return { p: [ex, ey, ez], i: prev, phi: phi };
    };
    const root = add(0.05, -1.42, 0);
    const trunk = grow([0.05, -1.42, 0], root, 0, Math.PI / 2, 0.045, 7, 0);
    const g1 = [];
    for (let i = 0; i < 4; i++) {
      const phi = (i + 0.5) * Math.PI * 0.5 + (rand() - 0.5) * 0.4;
      g1.push(grow(trunk.p, trunk.i, phi, 0.60 + (rand() - 0.5) * 0.12, 0.25, 12, 0.012));
    }
    const g2 = [];
    for (let i = 0; i < g1.length; i++) {
      const par = g1[i];
      for (let c = 0; c < 2; c++) {
        const phi = par.phi + (c === 0 ? -0.55 : 0.55) + (rand() - 0.5) * 0.25;
        g2.push(grow(par.p, par.i, phi, 0.48 + (rand() - 0.5) * 0.16, 0.182, 10, 0.010));
      }
    }
    for (let i = 0; i < g2.length; i++) {
      const par = g2[i];
      const kids = i % 2 === 0 ? 2 : 1;
      for (let c = 0; c < kids; c++) {
        const phi = par.phi + (kids === 1 ? 0 : (c === 0 ? -0.45 : 0.45)) + (rand() - 0.5) * 0.3;
        grow(par.p, par.i, phi, 0.30 + (rand() - 0.5) * 0.2, 0.108, 8, 0.008);
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const boutons = (rand, parent) => {
    const nodes = [], edges = [];
    if (!parent || !parent.length) return { nodes, edges };
    // Boutons cap the actual branch tips. Placed independently they sit in the
    // gaps between branches, which is exactly what a synaptic terminal must
    // not do.
    const tips = [];
    for (let i = 0; i < parent.length; i += 1) {
      if (parent[i][1] < -1.60) tips.push(parent[i]);
    }
    if (!tips.length) return { nodes, edges };
    const used = [];
    const want = Math.min(15, tips.length);
    for (let b = 0; b < want; b += 1) {
      let p = null;
      for (let attempt = 0; attempt < 24 && !p; attempt += 1) {
        const cand = tips[Math.floor(rand() * tips.length)];
        let ok = true;
        for (let u = 0; u < used.length; u += 1) {
          const d = Math.hypot(cand[0] - used[u][0], cand[1] - used[u][1], cand[2] - used[u][2]);
          if (d < 0.075) { ok = false; break; }
        }
        if (ok) p = cand;
      }
      if (!p) continue;
      used.push(p);
      const R = 0.030;
      const base = nodes.length;
      for (let k = 0; k < 9; k += 1) {
        const uy = 1 - (2 * k + 1) / 9;
        const rr = Math.sqrt(Math.max(0, 1 - uy * uy));
        const th = k * 2.39996;
        nodes.push([
          p[0] + Math.cos(th) * rr * R,
          p[1] + uy * R,
          p[2] + Math.sin(th) * rr * R * 0.8,
          0.58
        ]);
        if (k > 0) edges.push(base + k - 1, base + k);
      }
      edges.push(base + 8, base);
      // synaptic vesicles, which is what makes it a bouton and not a swelling
      for (let v = 0; v < 5; v += 1) {
        nodes.push([
          p[0] + (rand() - 0.5) * R * 1.1,
          p[1] + (rand() - 0.5) * R * 1.1,
          p[2] + (rand() - 0.5) * R * 0.9,
          1
        ]);
      }
    }
    return { nodes, edges };
  };

  const mitochondria = (rand) => {
    const nodes = [], edges = [];
    const HL = 0.045, R = 0.022;
    const norm = (v) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
    const frame = (u) => {
      const a = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const v = norm([u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]);
      const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      return [v, w];
    };
    const profile = (tn) => Math.sqrt(Math.max(0.08, 1 - 0.82 * tn * tn));
    const capsule = (cx, cy, cz, dx, dy, dz) => {
      const u = norm([dx, dy, dz]), fr = frame(u), v = fr[0], w = fr[1];
      const RINGS = 5, SEG = 6, base = nodes.length;
      for (let i = 0; i < RINGS; i++) {
        const tn = -1 + 2 * i / (RINGS - 1), r = R * profile(tn), ph = rand() * 1.0;
        for (let j = 0; j < SEG; j++) {
          const a = ph + 2 * Math.PI * j / SEG, ca = Math.cos(a) * r, sa = Math.sin(a) * r, tt = tn * HL;
          nodes.push([
            cx + u[0] * tt + v[0] * ca + w[0] * sa,
            cy + u[1] * tt + v[1] * ca + w[1] * sa,
            cz + u[2] * tt + v[2] * ca + w[2] * sa,
            0.45
          ]);
        }
      }
      for (let i = 0; i < RINGS; i++) {
        for (let j = 0; j < SEG; j++) {
          edges.push(base + i * SEG + j, base + i * SEG + (j + 1) % SEG);
          if (i < RINGS - 1) edges.push(base + i * SEG + j, base + (i + 1) * SEG + j);
        }
      }
      for (let k = 0; k < 4; k++) {
        const tn = -0.62 + 0.413 * k + 0.05 * (rand() - 0.5);
        const half = R * profile(tn) * 0.84, tilt = 0.22 * (rand() - 0.5);
        const ang = rand() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang);
        const cb = nodes.length, N = 5;
        for (let m = 0; m < N; m++) {
          const f = -1 + 2 * m / (N - 1), s = f * half, zz = (m % 2 ? 1 : -1) * R * 0.15;
          const px = ca * s - sa * zz, py = sa * s + ca * zz, tt = (tn + tilt * f * 0.5) * HL;
          nodes.push([
            cx + u[0] * tt + v[0] * px + w[0] * py,
            cy + u[1] * tt + v[1] * px + w[1] * py,
            cz + u[2] * tt + v[2] * px + w[2] * py,
            0.95
          ]);
        }
        for (let m = 0; m < N - 1; m++) edges.push(cb + m, cb + m + 1);
      }
    };
    for (let s = 0; s < 3; s++) {
      const th = 2 * Math.PI * (s / 3 + 0.11 * rand()), cp = 1 - 2 * (0.2 + 0.6 * rand());
      const sp = Math.sqrt(Math.max(0, 1 - cp * cp));
      const rr = norm([sp * Math.cos(th), cp, sp * Math.sin(th) * 0.7]);
      const d = 0.103 + 0.010 * rand();
      const g = [rand() - 0.5, rand() - 0.5, rand() - 0.5];
      const dot = g[0] * rr[0] + g[1] * rr[1] + g[2] * rr[2];
      const t = norm([g[0] - dot * rr[0], g[1] - dot * rr[1], g[2] - dot * rr[2]]);
      capsule(rr[0] * d, 0.015 + rr[1] * d, rr[2] * d, t[0], t[1], t[2]);
    }
    const axonX = (y) => 0.05 * ((-0.22 - y) / 1.20);
    for (let s = 0; s < 4; s++) {
      const y = -0.44 - 0.295 * s - 0.04 * rand();
      const off = (rand() - 0.5) * 0.026, offz = (rand() - 0.5) * 0.024;
      capsule(axonX(y) + off, y, offz, 0.042 + 0.10 * (rand() - 0.5), -1, 0.06 * (rand() - 0.5));
    }
    for (let s = 0; s < 2; s++) {
      const sgn = s === 0 ? -1 : 1;
      const x = sgn * (0.18 + 0.09 * rand()), y = -1.58 - 0.05 * rand(), z = (rand() - 0.5) * 0.16;
      capsule(x, y, z, sgn * (0.45 + 0.2 * rand()), -1, 0.12 * (rand() - 0.5));
    }
    return { nodes: nodes, edges: edges };
  };

  /* One accent. Four channels made the compartments legible but read as a
     stain rather than as a cell; structure is carried by brightness, density
     and the limb brightening on the closed surfaces instead. */
  const PARTS = [
    { fn: soma, seed: 1801, gain: 1.05, hue: 1, rim: true, name: 'soma' },
    { fn: nucleus, seed: 1907, gain: 0.66, hue: 1, rim: true, name: 'nucleus' },
    { fn: nisslBodies, seed: 2003, gain: 0.80, hue: 1, name: 'nisslBodies' },
    { fn: microtubuleHalo, seed: 2111, gain: 0.50, hue: 1, name: 'microtubuleHalo' },
    { fn: dendrites, seed: 2237, gain: 1.05, hue: 1, name: 'dendrites' },
    { fn: dendriticSpines, seed: 2341, gain: 0.95, hue: 1, from: 'dendrites', name: 'dendriticSpines' },
    { fn: neurofilaments, seed: 2447, gain: 0.55, hue: 1, name: 'neurofilaments' },
    { fn: axon, seed: 2551, gain: 1.00, hue: 1, name: 'axon' },
    { fn: myelin, seed: 2657, gain: 0.80, hue: 1, name: 'myelin' },
    { fn: nodesOfRanvier, seed: 2749, gain: 0.95, hue: 1, name: 'nodesOfRanvier' },
    { fn: terminalArbor, seed: 2861, gain: 1.00, hue: 1, name: 'terminalArbor' },
    { fn: boutons, seed: 2963, gain: 1.00, hue: 1, from: 'terminalArbor', name: 'boutons' },
    { fn: mitochondria, seed: 3079, gain: 1.00, hue: 1, name: 'mitochondria' },
  ];

  /* A neuron is long. Normalising on radius, the way the cell does, would put
     the terminal arbor off the canvas, so the bounding box is what gets fitted
     and the tall axis is what sets the scale. */
  const fitBox = (pos, count, target) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i += 1) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const half = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    const k = half > 0 ? target / half : 1;
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (pos[i * 3] - cx) * k;
      pos[i * 3 + 1] = (pos[i * 3 + 1] - cy) * k;
      pos[i * 3 + 2] = (pos[i * 3 + 2] - cz) * k;
    }
  };

  /* Real neurons lean and curve. Applying that to the assembled cloud rather
     than inside each compartment is what keeps the axon, its myelin, its
     filaments and its mitochondria on one path: they bend together because
     they are bent by the same function. */
  const organic = (pos, count) => {
    for (let i = 0; i < count; i += 1) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const t = Math.max(0, Math.min(1, (0.05 - y) / 1.85));
      let nx = x + 0.30 * t * t - 0.055 * Math.sin(t * 3.4);
      let nz = z + 0.13 * Math.sin(t * 2.1 + 0.5);
      const u = Math.max(0, Math.min(1, y / 0.95));
      nx -= 0.20 * u * u;
      nz += 0.07 * u * Math.sin(u * 2.7);
      const a = 0.20 * (y + 0.4);
      const ca = Math.cos(a), sa = Math.sin(a);
      pos[i * 3] = nx * ca - nz * sa;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = nx * sa + nz * ca;
    }
  };

  const clampNode = (node) => {
    const x = node[0] < -0.95 ? -0.95 : (node[0] > 0.95 ? 0.95 : node[0]);
    const z = node[2] < -0.55 ? -0.55 : (node[2] > 0.55 ? 0.55 : node[2]);
    const y = node[1] < -1.80 ? -1.80 : (node[1] > 1.00 ? 1.00 : node[1]);
    return [x, y, z, node[3]];
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

    const produced = {};

    PARTS.forEach((part) => {
      const rand = A.makeRandom(part.seed);
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
        const inten = (nd[3] === undefined ? 0.7 : nd[3]) * gain;
        nodes.push(clampNode([nd[0], nd[1], nd[2], inten > 1 ? 1 : inten]));
        shellOf.push(shell);
        hueOf.push(part.hue === undefined ? 1 : part.hue);
      }
      const localEdges = out.edges || [];
      for (let e = 0; e + 1 < localEdges.length; e += 2) {
        const a = localEdges[e], b = localEdges[e + 1];
        if (a >= 0 && a < localCount && b >= 0 && b < localCount) {
          edges.push(a + offset, b + offset);
        }
      }
    });

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
      const rand = A.makeRandom(71077);
      const wire = running || 1;
      for (let i = fillStart; i < total; i += 1) {
        const pick = rand() * wire;
        let lo = 0, hi = edgeCount - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < pick) lo = mid + 1; else hi = mid;
        }
        const a = nodes[usable[lo * 2]], b = nodes[usable[lo * 2 + 1]];
        const t = rand();
        pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(rand) * 0.003;
        pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(rand) * 0.003;
        pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(rand) * 0.003;
        intensity[i] = Math.min(a[3], b[3]) * 0.42;
        shellOf[i] = 0;
        hueOf[i] = hueOf[usable[lo * 2]] || 1;
      }
    } else {
      for (let i = fillStart; i < total; i += 1) intensity[i] = 0;
    }

    organic(pos, total);
    fitBox(pos, total, 1);

    const normal = new Float32Array(total * 3);
    const shell = new Uint8Array(total);
    const hue = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) hue[i] = hueOf[i] || 1;

    /* Normals for the closed compartments, derived after the fit because the
       fit moves the points. These are what let the renderer brighten a surface
       where it turns edge-on, which is the difference between a shell reading
       as a boundary and reading as a smudge. */
    for (let g = 1; g < shellId; g += 1) {
      let cx = 0, cy = 0, cz = 0, count = 0;
      for (let i = 0; i < total; i += 1) {
        if (shellOf[i] !== g) continue;
        cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; count += 1;
      }
      if (!count) continue;
      cx /= count; cy /= count; cz /= count;
      for (let i = 0; i < total; i += 1) {
        if (shellOf[i] !== g) continue;
        const dx = pos[i * 3] - cx, dy = pos[i * 3 + 1] - cy, dz = pos[i * 3 + 2] - cz;
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

  window.BiodynNeuron = { build, PARTS };
})();
