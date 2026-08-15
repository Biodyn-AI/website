/* ========================================
   BIODYN, Hero cell, geometry
   A eukaryotic cell assembled from one function
   per organelle. Each returns skeleton nodes and
   the edges between them in cell-local space,
   where the plasma membrane sits at radius 1.

   The assembler lays the skeleton down first,
   then spends whatever budget is left scattering
   points along the wiring, weighted by edge
   length so a long microtubule gets as dense a
   line as a short crista.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  if (!A) return;

  const TAU = Math.PI * 2;

  /* Landmarks. Every organelle is written against these, so moving one here
     moves it everywhere it is referenced. */
  const NUCLEUS = [-0.20, 0.08, 0.00];
  const NUCLEUS_R = 0.34;

  /* ---------------------------------------
     Organelles
     Each is a pure function of its own seeded
     PRNG, returning skeleton nodes as
     [x, y, z, intensity] and a flat list of
     index pairs between them.
     --------------------------------------- */

  const plasmaMembrane = (rand) => {
    const nodes = [], edges = [];
    const N = 150;
    const ga = Math.PI * (3 - Math.sqrt(5));
    const p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2, p3 = rand() * Math.PI * 2;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const uy = 1 - (2 * i + 1) / N;
      const ring = Math.sqrt(Math.max(0, 1 - uy * uy));
      const th = ga * i;
      const ux = Math.cos(th) * ring, uz = Math.sin(th) * ring;
      const lat = Math.asin(Math.max(-1, Math.min(1, uy)));
      const lon = Math.atan2(uz, ux);
      const wob = 0.020 * Math.sin(2 * lon + p1) * Math.cos(lat)
                + 0.010 * Math.sin(3 * lat + p2)
                + 0.006 * Math.sin(5 * lon + 2 * lat + p3);
      const r = 0.964 + wob;
      const x = ux * r, y = uy * r, z = uz * r;
      const inten = 0.19 + 0.09 * (0.5 + 0.5 * Math.sin(4 * lon + 2 * lat + p2)) + 0.02 * rand();
      nodes.push([x, y, z, Math.max(0.18, Math.min(0.30, inten))]);
      pts.push([x, y, z]);
    }
    const seen = {};
    const addEdge = (a, b) => {
      if (a === b) return;
      const k = a < b ? a + ',' + b : b + ',' + a;
      if (seen[k]) return;
      seen[k] = 1;
      edges.push(a, b);
    };
    for (let i = 0; i < N; i++) {
      const d = [];
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2];
        d.push([dx * dx + dy * dy + dz * dz, j]);
      }
      d.sort((a, b) => a[0] - b[0]);
      addEdge(i, d[0][1]);
      if (rand() < 0.72) addEdge(i, d[1][1]);
      if (rand() < 0.46) addEdge(i, d[2][1]);
    }
    return { nodes, edges };
  };

  const actinCortex = (rand) => {
    const nodes = [], edges = [];
    const fil = [];
    const nFil = 26;
    for (let f = 0; f < nFil; f++) {
      const uz = 2 * rand() - 1;
      const ur = Math.sqrt(Math.max(0, 1 - uz * uz));
      const ua = rand() * Math.PI * 2;
      const ax = ur * Math.cos(ua), ay = ur * Math.sin(ua), az = uz;
      let hx = 0, hy = 0, hz = 1;
      if (Math.abs(az) > 0.9) { hx = 1; hz = 0; }
      let bx = ay * hz - az * hy, by = az * hx - ax * hz, bz = ax * hy - ay * hx;
      const bl = Math.sqrt(bx * bx + by * by + bz * bz);
      bx /= bl; by /= bl; bz /= bl;
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
      const roll = rand() * Math.PI * 2;
      const dx = bx * Math.cos(roll) + cx * Math.sin(roll);
      const dy = by * Math.cos(roll) + cy * Math.sin(roll);
      const dz = bz * Math.cos(roll) + cz * Math.sin(roll);
      const n = 5 + Math.floor(rand() * 5);
      const span = 0.22 + rand() * 0.26;
      const rBase = 0.885 + rand() * 0.06;
      const idx = [];
      for (let k = 0; k < n; k++) {
        const t = span * (k / (n - 1));
        const bend = 0.05 * Math.sin(Math.PI * k / (n - 1));
        const ct = Math.cos(t), stt = Math.sin(t);
        let px = ax * ct + dx * stt, py = ay * ct + dy * stt, pz = az * ct + dz * stt;
        const pl = Math.sqrt(px * px + py * py + pz * pz);
        px /= pl; py /= pl; pz /= pl;
        let r = rBase + (rand() - 0.5) * 0.02 + bend * 0.12;
        if (r > 0.968) r = 0.968;
        if (r < 0.882) r = 0.882;
        const i0 = nodes.length;
        nodes.push([px * r, py * r, pz * r, 0.36 + 0.13 * rand()]);
        idx.push(i0);
        if (k > 0) edges.push(idx[k - 1], idx[k]);
      }
      fil.push(idx);
    }
    const own = [];
    for (let f = 0; f < fil.length; f++) for (let k = 0; k < fil[f].length; k++) own[fil[f][k]] = f;
    const cand = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (own[i] === own[j]) continue;
        const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.0169) cand.push([d2, i, j]);
      }
    }
    cand.sort((a, b) => a[0] - b[0]);
    const used = [], pairSeen = {};
    let links = 0;
    for (let c = 0; c < cand.length && links < 46; c++) {
      const i = cand[c][1], j = cand[c][2];
      if ((used[i] || 0) >= 2 || (used[j] || 0) >= 2) continue;
      const pk = own[i] < own[j] ? own[i] + ':' + own[j] : own[j] + ':' + own[i];
      if ((pairSeen[pk] || 0) >= 2) continue;
      pairSeen[pk] = (pairSeen[pk] || 0) + 1;
      used[i] = (used[i] || 0) + 1;
      used[j] = (used[j] || 0) + 1;
      edges.push(i, j);
      links++;
    }
    return { nodes, edges };
  };

  const nuclearEnvelope = (rand) => {
    const nodes = [], edges = [];
    const cx = -0.18, cy = 0.06, cz = 0.02;
    const R = 0.40;
    const dirOf = (i, n, spin) => {
      const y = 1 - (2 * i + 1) / n;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const t = i * 2.399963229728653 + spin;
      return [Math.cos(t) * r, y, Math.sin(t) * r];
    };
    const wob = (u) => 1
      + 0.026 * Math.sin(3 * Math.atan2(u[2], u[0]) + 1.1)
      + 0.018 * Math.sin(2 * Math.asin(Math.max(-1, Math.min(1, u[1]))) - 0.6);
    // Two shells for the double membrane, each meshed to its nearest
    // neighbours. A scattered shell reads as a haze; only a meshed one reads
    // as a closed boundary, and the boundary is the whole point of a nucleus.
    const N = 156;
    const shells = [[R, 0.82], [R * 1.08, 0.90]];
    for (let s = 0; s < 2; s += 1) {
      const base = nodes.length;
      const pts = [];
      for (let i = 0; i < N; i += 1) {
        const u = dirOf(i, N, s * 0.9);
        const rr = shells[s][0] * wob(u) * (1 + (rand() - 0.5) * 0.008);
        nodes.push([cx + u[0] * rr, cy + u[1] * rr, cz + u[2] * rr, shells[s][1] + rand() * 0.05]);
        pts.push([u[0] * rr, u[1] * rr, u[2] * rr]);
      }
      for (let i = 0; i < N; i += 1) {
        const d = [];
        for (let j = 0; j < N; j += 1) {
          if (j === i) continue;
          const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2];
          d.push([dx * dx + dy * dy + dz * dz, j]);
        }
        d.sort((a, b) => a[0] - b[0]);
        edges.push(base + i, base + d[0][1]);
        edges.push(base + i, base + d[1][1]);
        if (rand() < 0.55) edges.push(base + i, base + d[2][1]);
      }
    }
    // Pores punched through the envelope. Nothing else in the cell looks like
    // a ring sitting in a membrane, so this is what names the organelle.
    const PORES = 24;
    for (let p = 0; p < PORES; p += 1) {
      const u = dirOf(p, PORES, 0.7 + rand() * 0.05);
      let hx = 0, hy = 1, hz = 0;
      if (Math.abs(u[1]) > 0.9) { hx = 1; hy = 0; }
      let t1x = u[1] * hz - u[2] * hy, t1y = u[2] * hx - u[0] * hz, t1z = u[0] * hy - u[1] * hx;
      const l = Math.hypot(t1x, t1y, t1z) || 1;
      t1x /= l; t1y /= l; t1z /= l;
      const t2x = u[1] * t1z - u[2] * t1y, t2y = u[2] * t1x - u[0] * t1z, t2z = u[0] * t1y - u[1] * t1x;
      const rr = R * 1.05 * wob(u);
      const px = cx + u[0] * rr, py = cy + u[1] * rr, pz = cz + u[2] * rr;
      const base = nodes.length;
      const ring = 7, rad = 0.038;
      for (let k = 0; k < ring; k += 1) {
        const a = (k / ring) * Math.PI * 2;
        const ca = Math.cos(a) * rad, sa = Math.sin(a) * rad;
        nodes.push([px + t1x * ca + t2x * sa, py + t1y * ca + t2y * sa, pz + t1z * ca + t2z * sa, 1]);
        edges.push(base + k, base + ((k + 1) % ring));
      }
    }
    return { nodes, edges };
  };

  const nucleolus = (rand) => {
    const nodes = [], edges = [];
    const cx = -0.24, cy = 0.00, cz = 0.08;
    const R = 0.125;
    // Dense and tangled, so it reads as the solid body it is against the open
    // chromatin around it.
    for (let c = 0; c < 7; c += 1) {
      const base = nodes.length;
      let x = (rand() - 0.5) * R * 0.7;
      let y = (rand() - 0.5) * R * 0.7;
      let z = (rand() - 0.5) * R * 0.7;
      let dx = rand() - 0.5, dy = rand() - 0.5, dz = rand() - 0.5;
      const steps = 13;
      for (let k = 0; k < steps; k += 1) {
        dx += (rand() - 0.5) * 0.9; dy += (rand() - 0.5) * 0.9; dz += (rand() - 0.5) * 0.9;
        const dl = Math.hypot(dx, dy, dz) || 1;
        x += (dx / dl) * R * 0.30; y += (dy / dl) * R * 0.30; z += (dz / dl) * R * 0.30;
        const rl = Math.hypot(x, y, z);
        if (rl > R) { x *= R / rl; y *= R / rl; z *= R / rl; dx = -dx; dy = -dy; dz = -dz; }
        nodes.push([cx + x, cy + y, cz + z, 0.9 + rand() * 0.1]);
        if (k > 0) edges.push(base + k - 1, base + k);
      }
    }
    return { nodes, edges };
  };

  const chromatin = (rand) => {
    const nodes = [], edges = [];
    const cx = -0.18, cy = 0.06, cz = 0.02;
    const LIM = 0.365;
    const NO = [-0.24 - cx, 0.00 - cy, 0.08 - cz];
    for (let w = 0; w < 11; w += 1) {
      const base = nodes.length;
      let a = rand() * Math.PI * 2, b = Math.acos(2 * rand() - 1);
      let rr = 0.16 + rand() * 0.16;
      let x = Math.sin(b) * Math.cos(a) * rr;
      let y = Math.cos(b) * rr;
      let z = Math.sin(b) * Math.sin(a) * rr;
      let dx = rand() - 0.5, dy = rand() - 0.5, dz = rand() - 0.5;
      const steps = 24 + Math.floor(rand() * 7);
      let placed = 0;
      for (let k = 0; k < steps; k += 1) {
        dx += (rand() - 0.5) * 0.55; dy += (rand() - 0.5) * 0.55; dz += (rand() - 0.5) * 0.55;
        const dl = Math.hypot(dx, dy, dz) || 1;
        x += (dx / dl) * 0.040; y += (dy / dl) * 0.040; z += (dz / dl) * 0.040;
        const rl = Math.hypot(x, y, z);
        if (rl > LIM) { x *= LIM / rl; y *= LIM / rl; z *= LIM / rl; dx = -dx; dy = -dy; dz = -dz; }
        // stay out of the nucleolus
        const nd = Math.hypot(x - NO[0], y - NO[1], z - NO[2]);
        if (nd < 0.145) continue;
        nodes.push([cx + x, cy + y, cz + z, 0.26 + rand() * 0.10]);
        if (placed > 0) edges.push(nodes.length - 2, nodes.length - 1);
        placed += 1;
      }
    }
    return { nodes, edges };
  };

  const roughER = (rand) => {
    const nodes = [], edges = [];
    const cx = -0.18, cy = 0.06, cz = 0.02;
    // Three sheets on one flank of the nucleus rather than five shells wrapping
    // it. Wrapping put a second layer of material right against the envelope,
    // which is where the nucleus stopped having a visible edge. Polarised ER is
    // also closer to what a real cell looks like.
    const RADII = [0.56, 0.68, 0.80];
    for (let s = 0; s < RADII.length; s += 1) {
      const R = RADII[s];
      const base = nodes.length;
      const US = 9, VS = 7;
      const a0 = -0.55 + s * 0.16;
      const aSpan = 1.5;
      const p0 = -0.62, pSpan = 1.24;
      const idx = [];
      for (let u = 0; u < US; u += 1) {
        idx.push([]);
        for (let v = 0; v < VS; v += 1) {
          const az = a0 + (u / (US - 1)) * aSpan;
          const po = p0 + (v / (VS - 1)) * pSpan;
          const ripple = 1 + 0.035 * Math.sin(u * 1.3 + s * 2.1) + 0.025 * Math.sin(v * 1.7);
          const rr = R * ripple;
          const x = Math.cos(po) * Math.cos(az) * rr;
          const y = Math.sin(po) * rr;
          const z = Math.cos(po) * Math.sin(az) * rr;
          const i0 = nodes.length;
          nodes.push([cx + x, cy + y, cz + z, 0.46 + rand() * 0.08]);
          idx[u].push(i0);
          if (u > 0) edges.push(idx[u - 1][v], i0);
          if (v > 0) edges.push(idx[u][v - 1], i0);
        }
      }
      // Ribosomes on the outer face: small, bright, unconnected. The stipple is
      // what distinguishes rough ER from every other sheet in the cell.
      for (let k = 0; k < 46; k += 1) {
        const az = a0 + rand() * aSpan;
        const po = p0 + rand() * pSpan;
        const rr = R * (1.035 + rand() * 0.02);
        nodes.push([
          cx + Math.cos(po) * Math.cos(az) * rr,
          cy + Math.sin(po) * rr,
          cz + Math.cos(po) * Math.sin(az) * rr,
          0.95
        ]);
      }
    }
    return { nodes, edges };
  };

  const smoothER = (rand) => {
    const nodes = [], edges = [];
    const norm = (v) => {
      const d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
      return [v[0] / d, v[1] / d, v[2] / d];
    };
    const rot = (v, ax, ang) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      const dp = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2];
      const cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
      return [
        v[0] * c + cr[0] * s + ax[0] * dp * (1 - c),
        v[1] * c + cr[1] * s + ax[1] * dp * (1 - c),
        v[2] * c + cr[2] * s + ax[2] * dp * (1 - c)
      ];
    };
    const perp = (v) => {
      const a = Math.abs(v[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
      const c = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
      return norm(c);
    };
    const fit = (p) => {
      let x = p[0], y = p[1], z = p[2];
      if (x < 0.06) x = 0.06 + (0.06 - x) * 0.3;
      let d = Math.sqrt(x * x + y * y + z * z) || 1;
      if (d > 0.88) { const k = 0.88 / d; x *= k; y *= k; z *= k; d = 0.88; }
      if (d < 0.55) { const k = 0.55 / d; x *= k; y *= k; z *= k; }
      return [x, y, z];
    };
    const tips = [];
    const roots = [
      [0.26, 0.22, 0.16],
      [0.30, -0.06, -0.20],
      [0.22, -0.20, 0.26]
    ];
    const grow = (start, dir, len, gen) => {
      const n = 4 + Math.floor(rand() * 3);
      let p = start.slice();
      let d = norm(dir);
      let prev = -1;
      const step = len / n;
      for (let i = 0; i < n; i++) {
        const wob = norm([d[0] + (rand() - 0.5) * 0.5, d[1] + (rand() - 0.5) * 0.5, d[2] + (rand() - 0.5) * 0.5]);
        d = norm([d[0] * 0.65 + wob[0] * 0.35, d[1] * 0.65 + wob[1] * 0.35, d[2] * 0.65 + wob[2] * 0.35]);
        p = fit([p[0] + d[0] * step, p[1] + d[1] * step, p[2] + d[2] * step]);
        const idx = nodes.length;
        nodes.push([p[0], p[1], p[2], 0.55 + rand() * 0.15]);
        if (prev >= 0) edges.push(prev, idx);
        prev = idx;
      }
      if (gen >= 3) { tips.push([prev, p]); return; }
      const kids = (gen < 2 && rand() < 0.20) ? 3 : 2;
      const ax = perp(d);
      for (let c = 0; c < kids; c++) {
        const roll = (c / kids) * Math.PI * 2 + rand() * 0.8;
        const axis = norm(rot(ax, d, roll));
        const nd = rot(d, axis, 0.70 + (rand() - 0.5) * 0.20);
        const childStart = p;
        const childIdx = nodes.length;
        grow(childStart, nd, len * 0.75, gen + 1);
        if (childIdx < nodes.length) edges.push(prev, childIdx);
      }
    };
    for (let r = 0; r < roots.length; r++) {
      const s = fit(roots[r]);
      const outward = norm([s[0] + (rand() - 0.5) * 0.4, s[1] + (rand() - 0.5) * 0.4, s[2] + (rand() - 0.5) * 0.4]);
      grow(s, outward, 0.30, 0);
    }
    for (let i = 0; i < tips.length; i++) {
      for (let j = i + 1; j < tips.length; j++) {
        const a = tips[i][1], b = tips[j][1];
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dd < 0.20 && rand() < 0.45) edges.push(tips[i][0], tips[j][0]);
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const golgiApparatus = (rand) => {
    const nodes = [], edges = [];
    const gx = 0.12, gy = -0.32, gz = 0.05;
    let ax = -0.5486, ay = 0.7980, az = -0.2494;
    const al = Math.sqrt(ax * ax + ay * ay + az * az);
    ax /= al; ay /= al; az /= al;
    let ux = -az, uy = 0, uz = ax;
    const ul = Math.sqrt(ux * ux + uy * uy + uz * uz);
    ux /= ul; uy /= ul; uz /= ul;
    const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;
    const NC = 6, SP = 0.035, CR = 0.45, NA = 16;
    const rings = [0.42, 0.74, 1.0];
    const phs = [];
    for (let i = 0; i < NC; i++) {
      const t = (i - (NC - 1) / 2) * SP - 0.01;
      const rad = 0.13 + 0.06 * (i / (NC - 1));
      const base = nodes.length;
      const ph = rand() * 6.283185;
      phs.push(ph);
      for (let r = 0; r < rings.length; r++) {
        const rf = rings[r] * rad;
        for (let k = 0; k < NA; k++) {
          const th = ph + k * 6.283185 / NA;
          const wob = 1 + 0.055 * Math.sin(3 * th + i * 1.7);
          const px = rf * Math.cos(th) * wob;
          const py = rf * 0.72 * Math.sin(th) * wob;
          const d = Math.sqrt(px * px + py * py);
          const sag = CR - Math.sqrt(Math.max(0, CR * CR - d * d));
          const ta = t - sag + (rand() - 0.5) * 0.003;
          const X = gx + ax * ta + ux * px + vx * py;
          const Y = gy + ay * ta + uy * px + vy * py;
          const Z = gz + az * ta + uz * px + vz * py;
          nodes.push([X, Y, Z, r === rings.length - 1 ? 0.8 : 0.6]);
        }
      }
      for (let r = 0; r < rings.length; r++) {
        for (let k = 0; k < NA; k++) {
          edges.push(base + r * NA + k, base + r * NA + (k + 1) % NA);
          if (r < rings.length - 1) edges.push(base + r * NA + k, base + (r + 1) * NA + k);
        }
      }
      if (i > 0) {
        const prev = base - rings.length * NA;
        const step = 6.283185 / NA;
        for (let k = 0; k < NA; k += 4) {
          let kk = Math.round((phs[i - 1] + k * step - ph) / step) % NA;
          if (kk < 0) kk += NA;
          edges.push(prev + 2 * NA + k, base + 2 * NA + kk);
        }
      }
    }
    return { nodes, edges };
  };

  const vesicles = (rand) => {
    const nodes = [], edges = [];
    const gx = 0.12, gy = -0.32, gz = 0.05;
    let ax = -0.5486, ay = 0.7980, az = -0.2494;
    const al = Math.sqrt(ax * ax + ay * ay + az * az);
    ax /= al; ay /= al; az /= al;
    let ux = -az, uy = 0, uz = ax;
    const ul = Math.sqrt(ux * ux + uy * uy + uz * uz);
    ux /= ul; uy /= ul; uz /= ul;
    const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;
    const tx0 = gx - ax * 0.20, ty0 = gy - ay * 0.20, tz0 = gz - az * 0.20;
    const shell = (cx, cy, cz, rad) => {
      const base = nodes.length;
      const tl = rand() * 3.14159, sp = rand() * 3.14159;
      const c1 = Math.cos(tl), s1 = Math.sin(tl), c2 = Math.cos(sp), s2 = Math.sin(sp);
      for (let ring = 0; ring < 2; ring++) {
        const pz = (ring === 0 ? 0.58 : -0.58) * rad;
        const rr = 0.815 * rad;
        for (let k = 0; k < 4; k++) {
          const th = (k + (ring === 0 ? 0 : 0.5)) * 1.570796;
          const px = rr * Math.cos(th), py = rr * Math.sin(th);
          const y1 = py * c1 - pz * s1, z1 = py * s1 + pz * c1;
          const x2 = px * c2 - z1 * s2, z2 = px * s2 + z1 * c2;
          nodes.push([cx + x2, cy + y1, cz + z2, 0.75]);
        }
      }
      for (let k = 0; k < 4; k++) {
        edges.push(base + k, base + (k + 1) % 4);
        edges.push(base + 4 + k, base + 4 + (k + 1) % 4);
        edges.push(base + k, base + 4 + k);
        edges.push(base + (k + 1) % 4, base + 4 + k);
      }
    };
    const ok = (x, y, z, rad) => {
      const dn = Math.sqrt((x + 0.20) * (x + 0.20) + (y - 0.08) * (y - 0.08) + z * z);
      const dr = Math.sqrt(x * x + y * y + z * z);
      const dgx = x - gx, dgy = y - gy, dgz = z - gz;
      const along = dgx * ax + dgy * ay + dgz * az;
      const perp = Math.sqrt(Math.max(0, dgx * dgx + dgy * dgy + dgz * dgz - along * along));
      const inStack = along < 0.14 && along > -0.155 && perp < 0.21;
      return dn > 0.40 + rad && dr + rad < 0.98 && dr > 0.33 && !inStack;
    };
    const place = (fn) => {
      for (let a = 0; a < 60; a++) {
        const p = fn();
        if (ok(p[0], p[1], p[2], p[3])) { shell(p[0], p[1], p[2], p[3]); return; }
      }
    };
    for (let i = 0; i < 7; i++) {
      place(() => {
        const rad = 0.020 + rand() * 0.010;
        const t = -(0.155 + rand() * 0.10);
        const rr = rand() * 0.13;
        const th = rand() * 6.283185;
        const px = rr * Math.cos(th), py = rr * Math.sin(th);
        return [gx + ax * t + ux * px + vx * py, gy + ay * t + uy * px + vy * py, gz + az * t + uz * px + vz * py, rad];
      });
    }
    const lanes = [];
    for (let L = 0; L < 3; L++) {
      const th = rand() * 6.283185, el = 0.35 + rand() * 0.9;
      const dx = Math.sin(el) * Math.cos(th), dy = -0.30 - 0.70 * Math.abs(Math.cos(el)), dz = Math.sin(el) * Math.sin(th);
      const dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
      lanes.push([dx / dl, dy / dl, dz / dl]);
    }
    for (let i = 0; i < 10; i++) {
      const L = lanes[i % 3];
      place(() => {
        const rad = 0.022 + rand() * 0.013;
        const s = 0.22 + (Math.floor(i / 3) + rand()) * 0.22;
        const ex = L[0] * 0.85, ey = L[1] * 0.85, ez = L[2] * 0.85;
        const j = 0.055;
        return [tx0 + (ex - tx0) * s + (rand() - 0.5) * j,
                ty0 + (ey - ty0) * s + (rand() - 0.5) * j,
                tz0 + (ez - tz0) * s + (rand() - 0.5) * j, rad];
      });
    }
    for (let i = 0; i < 5; i++) {
      place(() => {
        const rad = 0.020 + rand() * 0.012;
        const L = lanes[i % 3];
        const th = rand() * 6.283185, sp = 0.30 + rand() * 0.55;
        const dx = L[0] + (rand() - 0.5) * 2 * sp, dy = L[1] + (rand() - 0.5) * 2 * sp, dz = L[2] + (rand() - 0.5) * 2 * sp;
        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const rr = 0.900 + rand() * 0.035;
        return [dx / dl * rr, dy / dl * rr, dz / dl * rr, rad];
      });
    }
    return { nodes, edges };
  };

  const mitochondria = (rand) => {
    const nodes = [], edges = [];
    const SITES = [
      [0.34, -0.52, 0.12], [0.52, 0.30, -0.10], [-0.30, -0.56, -0.14],
      [0.60, -0.06, 0.20], [-0.52, 0.48, 0.10]
    ];
    for (let m = 0; m < SITES.length; m += 1) {
      const c = SITES[m];
      const L = 0.21, RAD = 0.088;
      // a random orthonormal frame
      let ax = rand() - 0.5, ay = rand() - 0.5, az = rand() - 0.5;
      const al = Math.hypot(ax, ay, az) || 1;
      ax /= al; ay /= al; az /= al;
      let hx = 0, hy = 1, hz = 0;
      if (Math.abs(ay) > 0.9) { hx = 1; hy = 0; }
      let ux = ay * hz - az * hy, uy = az * hx - ax * hz, uz = ax * hy - ay * hx;
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul; uy /= ul; uz /= ul;
      const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;
      const at = (t, r, a) => [
        c[0] + ax * t + (ux * Math.cos(a) + vx * Math.sin(a)) * r,
        c[1] + ay * t + (uy * Math.cos(a) + vy * Math.sin(a)) * r,
        c[2] + az * t + (uz * Math.cos(a) + vz * Math.sin(a)) * r
      ];
      // outer membrane, a capsule drawn as rings so the silhouette is a
      // stadium and not a cloud
      const RINGS = 9, SEG = 10;
      const ringIdx = [];
      for (let i = 0; i < RINGS; i += 1) {
        const f = i / (RINGS - 1);
        const t = (f - 0.5) * 2 * L;
        const r = RAD * Math.sqrt(Math.max(0, 1 - Math.pow((f - 0.5) * 2, 6)));
        const row = [];
        for (let k = 0; k < SEG; k += 1) {
          const p = at(t, r, (k / SEG) * Math.PI * 2);
          const i0 = nodes.length;
          nodes.push([p[0], p[1], p[2], 0.38 + rand() * 0.06]);
          row.push(i0);
          if (k > 0) edges.push(i0 - 1, i0);
        }
        edges.push(row[SEG - 1], row[0]);
        if (i > 0) for (let k = 0; k < SEG; k += 1) edges.push(ringIdx[i - 1][k], row[k]);
        ringIdx.push(row);
      }
      // cristae: bright shelves folded across the interior, the one feature
      // that says mitochondrion
      const CR = 8;
      for (let cnum = 0; cnum < CR; cnum += 1) {
        const t = (-0.78 + (cnum / (CR - 1)) * 1.56) * L;
        const base = nodes.length;
        const pts = 7;
        for (let k = 0; k < pts; k += 1) {
          const g = k / (pts - 1);
          const zig = (k % 2 === 0 ? 1 : -1) * 0.30;
          const r = RAD * 0.86 * Math.sin(Math.PI * g);
          const a = 0.4 + g * Math.PI * 1.15;
          const p = at(t + zig * L * 0.16, r, a);
          nodes.push([p[0], p[1], p[2], 0.98]);
          if (k > 0) edges.push(base + k - 1, base + k);
        }
      }
    }
    return { nodes, edges };
  };

  const smallBodies = (rand) => {
    const nodes = [];
    const edges = [];
    const NUC = [-0.20, 0.08, 0.00];
    const GOL = [0.12, -0.32, 0.05];
    const CEN = [0.10, 0.34, -0.06];
    const gap = (c, p) => Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]);
    const dirRand = () => {
      const z = 2 * rand() - 1;
      const a = 2 * Math.PI * rand();
      const s = Math.sqrt(Math.max(0, 1 - z * z));
      return [s * Math.cos(a), s * Math.sin(a), z];
    };
    const placed = [];
    for (let m = 0; m < 9; m++) {
      const R = 0.035 + rand() * 0.020;
      let c = null;
      for (let t = 0; t < 90; t++) {
        const d = dirRand();
        const rr = 0.60 + rand() * 0.26;
        const cand = [d[0] * rr, d[1] * rr, d[2] * rr];
        if (gap(cand, NUC) < 0.44) continue;
        if (gap(cand, GOL) < 0.26) continue;
        if (gap(cand, CEN) < 0.24) continue;
        let ok = true;
        for (let k = 0; k < placed.length; k++) if (gap(cand, placed[k]) < 0.17) ok = false;
        if (!ok) continue;
        c = cand;
        break;
      }
      if (!c) {
        const ang = 0.4 + m * 0.698;
        c = [0.72 * Math.cos(ang), 0.55 * Math.sin(ang), 0.34 * Math.cos(ang * 2.3)];
      }
      let cl = Math.hypot(c[0], c[1], c[2]);
      const lim = 0.95 - R;
      if (cl > lim) { const f = lim / cl; c = [c[0] * f, c[1] * f, c[2] * f]; }
      placed.push(c);

      const base0 = nodes.length;
      const N = 14;
      const shell = [];
      const spin = rand() * 6.283;
      for (let i = 0; i < N; i++) {
        const z = 1 - (2 * (i + 0.5)) / N;
        const rr = Math.sqrt(Math.max(0, 1 - z * z));
        const th = i * 2.399963 + spin;
        const jit = R * (0.94 + rand() * 0.10);
        shell.push([rr * Math.cos(th) * jit, rr * Math.sin(th) * jit, z * jit]);
        nodes.push([c[0] + rr * Math.cos(th) * jit, c[1] + rr * Math.sin(th) * jit, c[2] + z * jit, 0.46 + rand() * 0.10]);
      }
      const seen = {};
      for (let i = 0; i < N; i++) {
        const order = [];
        for (let j = 0; j < N; j++) {
          if (j === i) continue;
          const dx = shell[i][0] - shell[j][0], dy = shell[i][1] - shell[j][1], dz = shell[i][2] - shell[j][2];
          order.push([dx * dx + dy * dy + dz * dz, j]);
        }
        order.sort((a, b) => a[0] - b[0]);
        for (let k = 0; k < 3; k++) {
          const j = order[k][1];
          const key = Math.min(i, j) * 100 + Math.max(i, j);
          if (seen[key]) continue;
          seen[key] = 1;
          edges.push(base0 + i, base0 + j);
        }
      }
      const e1 = dirRand();
      const tx = Math.abs(e1[0]) < 0.9 ? 1 : 0;
      const tz = Math.abs(e1[0]) < 0.9 ? 0 : 1;
      let e2 = [e1[1] * tz, e1[2] * tx - e1[0] * tz, -e1[1] * tx];
      const e2n = Math.hypot(e2[0], e2[1], e2[2]);
      e2 = [e2[0] / e2n, e2[1] / e2n, e2[2] / e2n];
      const e3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const tet = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
      nodes.push([c[0], c[1], c[2], 0.88 + rand() * 0.08]);
      for (let i = 0; i < 4; i++) {
        const t = tet[i];
        const rr = R * (0.36 + rand() * 0.12) / Math.sqrt(3);
        const p = [
          (e1[0] * t[0] + e2[0] * t[1] + e3[0] * t[2]) * rr,
          (e1[1] * t[0] + e2[1] * t[1] + e3[1] * t[2]) * rr,
          (e1[2] * t[0] + e2[2] * t[1] + e3[2] * t[2]) * rr
        ];
        nodes.push([c[0] + p[0], c[1] + p[1], c[2] + p[2], 0.82 + rand() * 0.08]);
        let best = 0, bd = 1e9;
        for (let q = 0; q < N; q++) {
          const dx = shell[q][0] - p[0], dy = shell[q][1] - p[1], dz = shell[q][2] - p[2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < bd) { bd = d2; best = q; }
        }
        edges.push(base0 + N + 1 + i, base0 + best);
        edges.push(base0 + N, base0 + N + 1 + i);
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const microtubules = (rand) => {
    const nodes = [];
    const edges = [];
    const cx = 0.10, cy = 0.34, cz = -0.06;
    const nx = -0.20, ny = 0.08, nz = 0.00;
    let ax = nx - cx, ay = ny - cy, az = nz - cz;
    const al = Math.sqrt(ax * ax + ay * ay + az * az);
    ax /= al; ay /= al; az /= al;
    const cc = cx * cx + cy * cy + cz * cz;
    const sampleDir = () => {
      for (let k = 0; k < 32; k++) {
        const u = rand() * 2 - 1;
        const ph = rand() * Math.PI * 2;
        const s = Math.sqrt(Math.max(0, 1 - u * u));
        const dx = s * Math.cos(ph), dy = s * Math.sin(ph), dz = u;
        const d = dx * ax + dy * ay + dz * az;
        if (rand() < Math.pow((1 - d) * 0.5, 0.8)) return [dx, dy, dz];
      }
      return [-ax, -ay, -az];
    };
    const nMT = 24;
    for (let m = 0; m < nMT; m++) {
      const dir = sampleDir();
      const dx = dir[0], dy = dir[1], dz = dir[2];
      let ux = 0, uy = 0, uz = 1;
      if (Math.abs(dz) > 0.9) { ux = 1; uy = 0; uz = 0; }
      let e1x = uy * dz - uz * dy, e1y = uz * dx - ux * dz, e1z = ux * dy - uy * dx;
      const e1l = Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z);
      e1x /= e1l; e1y /= e1l; e1z /= e1l;
      const e2x = dy * e1z - dz * e1y, e2y = dz * e1x - dx * e1z, e2z = dx * e1y - dy * e1x;
      const ca = rand() * Math.PI * 2;
      const px = Math.cos(ca) * e1x + Math.sin(ca) * e2x;
      const py = Math.cos(ca) * e1y + Math.sin(ca) * e2y;
      const pz = Math.cos(ca) * e1z + Math.sin(ca) * e2z;
      const bend = 0.03 + rand() * 0.07;
      const R = 0.62 + rand() * 0.28;
      const b = cx * dx + cy * dy + cz * dz;
      const tEnd = -b + Math.sqrt(Math.max(1e-6, b * b - (cc - R * R)));
      const t0 = 0.030;
      const n = 9 + Math.floor(rand() * 6);
      const base = nodes.length;
      for (let j = 0; j < n; j++) {
        const s = j / (n - 1);
        const t = t0 + (tEnd - t0) * s;
        const w = bend * s * s;
        let x = cx + dx * t + px * w;
        let y = cy + dy * t + py * w;
        let z = cz + dz * t + pz * w;
        const qx = x - nx, qy = y - ny, qz = z - nz;
        const qd = Math.sqrt(qx * qx + qy * qy + qz * qz);
        if (qd < 0.365) {
          const f = 0.365 / (qd + 1e-6);
          x = nx + qx * f; y = ny + qy * f; z = nz + qz * f;
        }
        const rr = Math.sqrt(x * x + y * y + z * z);
        if (rr > 0.95) { const f = 0.95 / rr; x *= f; y *= f; z *= f; }
        nodes.push([x, y, z, 0.85 - 0.40 * s]);
        if (j > 0) edges.push(base + j - 1, base + j);
      }
    }
    return { nodes: nodes, edges: edges };
  };

  const centrosome = (rand) => {
    const nodes = [];
    const edges = [];
    const px = 0.10, py = 0.34, pz = -0.06;
    const nux = -0.20, nuy = 0.08, nuz = 0.00;
    let gx = px - nux, gy = py - nuy, gz = pz - nuz;
    const gl = Math.sqrt(gx * gx + gy * gy + gz * gz);
    gx /= gl; gy /= gl; gz /= gl;
    let a1x = 0.62, a1y = -0.28, a1z = 0.73;
    const a1l = Math.sqrt(a1x * a1x + a1y * a1y + a1z * a1z);
    a1x /= a1l; a1y /= a1l; a1z /= a1l;
    const gd = gx * a1x + gy * a1y + gz * a1z;
    let a2x = gx - gd * a1x, a2y = gy - gd * a1y, a2z = gz - gd * a1z;
    const a2l = Math.sqrt(a2x * a2x + a2y * a2y + a2z * a2z);
    a2x /= a2l; a2y /= a2l; a2z /= a2l;
    const a3x = a1y * a2z - a1z * a2y;
    const a3y = a1z * a2x - a1x * a2z;
    const a3z = a1x * a2y - a1y * a2x;
    const buildCentriole = (ox, oy, oz, axx, axy, axz, u1x, u1y, u1z, u2x, u2y, u2z, mother) => {
      const R = 0.022;
      const half = 0.025;
      const ringStart = nodes.length;
      for (let i = 0; i < 9; i++) {
        const th = i * (Math.PI * 2 / 9) + (rand() - 0.5) * 0.06;
        const rx = Math.cos(th) * u1x + Math.sin(th) * u2x;
        const ry = Math.cos(th) * u1y + Math.sin(th) * u2y;
        const rz = Math.cos(th) * u1z + Math.sin(th) * u2z;
        const tx = -Math.sin(th) * u1x + Math.cos(th) * u2x;
        const ty = -Math.sin(th) * u1y + Math.cos(th) * u2y;
        const tz = -Math.sin(th) * u1z + Math.cos(th) * u2z;
        for (let k = 0; k < 3; k++) {
          const f = k - 1;
          const skew = 0.007 * f;
          nodes.push([
            ox + axx * half * f + rx * R + tx * skew,
            oy + axy * half * f + ry * R + ty * skew,
            oz + axz * half * f + rz * R + tz * skew,
            0.95
          ]);
        }
      }
      for (let i = 0; i < 9; i++) {
        const b = ringStart + i * 3;
        const nb = ringStart + ((i + 1) % 9) * 3;
        edges.push(b, b + 1, b + 1, b + 2);
        edges.push(b, nb, b + 1, nb + 1, b + 2, nb + 2);
      }
      const hub = nodes.length;
      nodes.push([ox - axx * half, oy - axy * half, oz - axz * half, 0.9]);
      for (let i = 0; i < 9; i++) {
        const trip = ringStart + i * 3;
        const si = nodes.length;
        nodes.push([
          (nodes[hub][0] + nodes[trip][0]) * 0.5,
          (nodes[hub][1] + nodes[trip][1]) * 0.5,
          (nodes[hub][2] + nodes[trip][2]) * 0.5,
          0.8
        ]);
        edges.push(hub, si, si, trip);
      }
      if (mother) {
        for (let i = 0; i < 9; i++) {
          const th = i * (Math.PI * 2 / 9);
          const rx = Math.cos(th) * u1x + Math.sin(th) * u2x;
          const ry = Math.cos(th) * u1y + Math.sin(th) * u2y;
          const rz = Math.cos(th) * u1z + Math.sin(th) * u2z;
          const dIdx = nodes.length;
          nodes.push([
            ox + axx * (half + 0.012) + rx * 0.034,
            oy + axy * (half + 0.012) + ry * 0.034,
            oz + axz * (half + 0.012) + rz * 0.034,
            0.7
          ]);
          edges.push(ringStart + i * 3 + 2, dIdx);
          const sIdx = nodes.length;
          nodes.push([
            ox + axx * (half * 0.35) + rx * 0.032,
            oy + axy * (half * 0.35) + ry * 0.032,
            oz + axz * (half * 0.35) + rz * 0.032,
            0.6
          ]);
          edges.push(ringStart + i * 3 + 1, sIdx);
        }
      }
      return ringStart;
    };
    const m0 = buildCentriole(px, py, pz, a1x, a1y, a1z, a2x, a2y, a2z, a3x, a3y, a3z, true);
    const d0x = px - a1x * 0.022 + a2x * 0.064;
    const d0y = py - a1y * 0.022 + a2y * 0.064;
    const d0z = pz - a1z * 0.022 + a2z * 0.064;
    const d0 = buildCentriole(d0x, d0y, d0z, a2x, a2y, a2z, a1x, a1y, a1z, a3x, a3y, a3z, false);
    for (let i = 0; i < 3; i++) {
      const s = m0 + ((i * 3) % 9) * 3 + 1;
      const t = d0 + ((i * 3 + 1) % 9) * 3 + 1;
      const mi = nodes.length;
      nodes.push([
        (nodes[s][0] + nodes[t][0]) * 0.5 + (rand() - 0.5) * 0.006,
        (nodes[s][1] + nodes[t][1]) * 0.5 + (rand() - 0.5) * 0.006,
        (nodes[s][2] + nodes[t][2]) * 0.5 + (rand() - 0.5) * 0.006,
        0.55
      ]);
      edges.push(s, mi, mi, t);
    }
    for (let i = 0; i < 50; i++) {
      const u = rand() * 2 - 1;
      const ph = rand() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      const rr = 0.030 + Math.pow(rand(), 0.6) * 0.028;
      let x = px + s * Math.cos(ph) * rr + a2x * 0.018;
      let y = py + s * Math.sin(ph) * rr + a2y * 0.018;
      let z = pz + u * rr + a2z * 0.018;
      const qx = x - nux, qy = y - nuy, qz = z - nuz;
      const qd = Math.sqrt(qx * qx + qy * qy + qz * qz);
      if (qd < 0.36) {
        const f = 0.36 / (qd + 1e-6);
        x = nux + qx * f; y = nuy + qy * f; z = nuz + qz * f;
      }
      nodes.push([x, y, z, 0.34 + rand() * 0.10]);
    }
    return { nodes: nodes, edges: edges };
  };

  /* Every organelle is written against the landmarks above, but a few sample
     radii that reach past the membrane's own wobble. Rather than patch each
     one, the cap is enforced here: the membrane keeps its radius because it is
     the boundary, and everything else is pulled inside it. */
  /* gain multiplies an organelle's intensity. The cell was legible as a whole
     but its parts were not, because everything competed at once. Structure
     that carries the anatomy is pushed up, and the membrane and cortex, which
     are context rather than content, are pushed down. */
  const PARTS = [
    { fn: plasmaMembrane, seed: 1201, cap: 1.00, gain: 0.56, hue: 1, rim: true },
    { fn: actinCortex, seed: 1307, cap: 0.90, gain: 0.22, hue: 1 },
    { fn: nuclearEnvelope, seed: 2411, cap: 0.90, gain: 1.10, hue: 4, rim: true },
    { fn: nucleolus, seed: 2557, cap: 0.90, gain: 1.00, hue: 4 },
    { fn: chromatin, seed: 2663, cap: 0.90, gain: 1.15, hue: 4 },
    { fn: roughER, seed: 3719, cap: 0.88, gain: 0.92, hue: 2 },
    { fn: smoothER, seed: 3821, cap: 0.88, gain: 0.72, hue: 2 },
    { fn: golgiApparatus, seed: 4133, cap: 0.90, gain: 1.05, hue: 2 },
    { fn: vesicles, seed: 4271, cap: 0.90, gain: 0.80, hue: 2 },
    { fn: mitochondria, seed: 5051, cap: 0.90, gain: 0.92, hue: 3 },
    { fn: smallBodies, seed: 5167, cap: 0.90, gain: 0.85, hue: 3 },
    { fn: microtubules, seed: 6089, cap: 0.90, gain: 0.45, hue: 1 },
    { fn: centrosome, seed: 6197, cap: 0.90, gain: 0.72, hue: 1 },
  ];

  /* Cells are not spheres, and the assembled cloud is. This maps it onto a
     textbook animal cell: wider than it is tall, flattened front to back, and
     lumpy rather than smooth. It runs on the finished cloud, after the infill,
     so every organelle follows the cell's shape instead of each one having to
     know the shape itself. */
  const shapeCell = (pos, count) => {
    for (let i = 0; i < count; i += 1) {
      let x = pos[i * 3] * 0.90;
      let y = pos[i * 3 + 1] * 1.22;
      let z = pos[i * 3 + 2] * 0.70;
      const r = Math.hypot(x, y, z);
      if (r > 1e-6) {
        const theta = Math.atan2(z, x);
        const phi = Math.asin(Math.max(-1, Math.min(1, y / r)));
        const lump = 1
          + 0.075 * Math.sin(2 * theta + 0.7)
          + 0.052 * Math.sin(3 * phi - 1.2)
          + 0.034 * Math.sin(3 * theta + 2 * phi + 2.4);
        x *= lump; y *= lump; z *= lump;
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
  };

  const capRadius = (node, cap) => {
    const r = Math.hypot(node[0], node[1], node[2]);
    if (r <= cap || r === 0) return node;
    const k = cap / r;
    return [node[0] * k, node[1] * k, node[2] * k, node[3]];
  };

  /* ---------------------------------------
     Assembly
     --------------------------------------- */

  let cache = null;

  const build = (n) => {
    if (cache && cache.n === n) return cache.figure;

    const nodes = [];
    const edges = [];
    /* Per node: which closed shell it belongs to, so the renderer can brighten
       those where they turn edge-on, and which colour group it is in. */
    const shellOf = [];
    const hueOf = [];
    let shellId = 1;

    PARTS.forEach((part) => {
      const rand = A.makeRandom(part.seed);
      let out;
      try {
        out = part.fn(rand);
      } catch (error) {
        return;
      }
      if (!out || !out.nodes || !out.nodes.length) return;
      const offset = nodes.length;
      const localCount = out.nodes.length;
      const cap = part.cap === undefined ? 0.9 : part.cap;
      const gain = part.gain === undefined ? 1 : part.gain;
      const shell = part.rim ? shellId : 0;
      if (part.rim) shellId += 1;
      for (let i = 0; i < localCount; i += 1) {
        const nd = out.nodes[i];
        const inten = (nd[3] === undefined ? 0.7 : nd[3]) * gain;
        nodes.push(capRadius([nd[0], nd[1], nd[2], inten > 1 ? 1 : inten], cap));
        shellOf.push(shell);
        hueOf.push(part.hue === undefined ? 1 : part.hue);
      }
      const localEdges = out.edges || [];
      for (let e = 0; e + 1 < localEdges.length; e += 2) {
        const a = localEdges[e];
        const b = localEdges[e + 1];
        /* An organelle that miscounts its own indices should lose its wiring,
           not corrupt the figure. */
        if (a >= 0 && a < localCount && b >= 0 && b < localCount) {
          edges.push(a + offset, b + offset);
        }
      }
    });

    /* The skeleton is the anatomy, so it is never what gets cut. A budget
       below it would truncate the tail of the parts list, which is to say it
       would silently drop the microtubules and the centrosome. Only the
       infill scales. */
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

    /* Edges that point past the budget cannot be drawn, so drop them rather
       than letting the renderer read undefined coordinates. */
    const usable = [];
    for (let e = 0; e + 1 < edges.length; e += 2) {
      if (edges[e] < nodeCount && edges[e + 1] < nodeCount) {
        usable.push(edges[e], edges[e + 1]);
      }
    }

    const edgeCount = usable.length / 2;
    const fillStart = nodeCount;
    const fillTotal = total - fillStart;

    if (edgeCount > 0 && fillTotal > 0) {
      /* Cumulative wire length, so fill points land uniformly along the
         skeleton rather than uniformly per edge. */
      const cumulative = new Float64Array(edgeCount);
      let running = 0;
      for (let e = 0; e < edgeCount; e += 1) {
        const a = usable[e * 2];
        const b = usable[e * 2 + 1];
        running += Math.hypot(
          nodes[b][0] - nodes[a][0],
          nodes[b][1] - nodes[a][1],
          nodes[b][2] - nodes[a][2]
        );
        cumulative[e] = running;
      }

      const rand = A.makeRandom(90210);
      const wire = running || 1;

      for (let i = fillStart; i < total; i += 1) {
        const pick = rand() * wire;
        let lo = 0;
        let hi = edgeCount - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < pick) lo = mid + 1; else hi = mid;
        }
        const a = nodes[usable[lo * 2]];
        const b = nodes[usable[lo * 2 + 1]];
        const t = rand();
        pos[i * 3] = a[0] + (b[0] - a[0]) * t + A.gaussian(rand) * 0.004;
        pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + A.gaussian(rand) * 0.004;
        pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + A.gaussian(rand) * 0.004;
        /* Dimmer than the nodes they connect, so structure stays legible
           against its own infill. */
        intensity[i] = Math.min(a[3], b[3]) * 0.38;
        shellOf[i] = 0;
        hueOf[i] = hueOf[usable[lo * 2]] || 1;
      }
    } else {
      for (let i = fillStart; i < total; i += 1) intensity[i] = 0;
    }

    shapeCell(pos, total);
    A.fit(pos, total, 1);

    /* Normals are derived here rather than in the organelle functions because
       the cell shaping and the fit both move the points; a normal computed
       before either would point the wrong way. */
    const normal = new Float32Array(total * 3);
    const shell = new Uint8Array(total);
    const hue = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) hue[i] = hueOf[i] || 1;
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

    const figure = { pos, intensity, edges: usable, n: total, normal, shell, hue };
    cache = { n, figure };
    return figure;
  };

  window.BiodynCell = { build, NUCLEUS, NUCLEUS_R, TAU, PARTS };
})();
