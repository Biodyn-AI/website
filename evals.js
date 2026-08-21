/* ========================================
   PROBE, renders content/evals.json
   The pages compute nothing. Everything shown here, including the unflattering
   parts, comes from result cards emitted by the harness.
   ======================================== */

(() => {
  const DATA_URL = 'content/evals.json?v=15';

  const fmt = (v, digits = 3) =>
    v === null || v === undefined || Number.isNaN(v) ? 'n/a' : Number(v).toFixed(digits);

  const signed = (v, digits = 3) =>
    v === null || v === undefined ? 'n/a' : (v >= 0 ? '+' : '') + Number(v).toFixed(digits);

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  const setEmpty = (node, msg) => {
    if (!node) return;
    node.innerHTML = '';
    node.appendChild(el('p', 'ev-empty', msg));
  };

  // --- leaderboard -------------------------------------------------------

  const COLUMNS = [
    ['Model', 'model'],
    ['Zero-shot', 'zero_shot'],
    ['B behavioural', 'behavioural'],
    ['P probe', 'probe'],
    ['F elicited', 'elicited'],
    ['Gap P−B', 'elicitation_gap'],
    ['Gap 95% CI (paired)', 'gap_ci95'],
    ['Best baseline', 'best_baseline'],
    ['Cheap-readout reference', 'ceiling'],
    ['Beats baseline', 'beats'],
    ['Null p', 'null_p'],
    ['CI95', 'ci95'],
  ];

  function renderLeaderboard(container, board, task) {
    container.innerHTML = '';
    // On a nuisance task (donor invariance) a gap separated from zero means the
    // internals leak MORE of the thing we want hidden, and a surviving null means
    // the leak is real. Both are adverse findings. Styling them as wins, which is
    // what a direction-blind renderer does, turned the SC4 board into a clean
    // sweep for models that concentrate donor identity in their internals.
    const higherIsBetter = board.higher_is_better !== false;

    const caption = el('p', 'ev-sub');
    caption.textContent = task
      ? `${task.metric} on ${task.dataset_id}. Axes: ${(task.axis_labels || task.axis).join(', ')}.`
      : '';
    if (caption.textContent) container.appendChild(caption);

    const scroll = el('div', 'ev-scroll');
    const table = el('table', 'ev-table');

    const thead = el('thead');
    const hr = el('tr');
    COLUMNS.forEach(([label]) => hr.appendChild(el('th', null, label)));
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el('tbody');
    board.rows.forEach((r) => {
      const tr = el('tr');
      tr.appendChild(el('td', 'ev-model', r.model));

      [r.zero_shot, r.behavioural, r.probe, r.elicited].forEach((v) => {
        const td = el('td', 'ev-num', fmt(v));
        if (v !== null && v === r.best) td.classList.add('is-best');
        tr.appendChild(td);
      });

      const gapTd = el('td', 'ev-num', signed(r.elicitation_gap));
      if (r.gap_separated_from_zero === true) {
        gapTd.classList.add(higherIsBetter ? 'is-best' : 'is-adverse');
      }
      tr.appendChild(gapTd);

      // A gap whose paired interval spans zero is shown, but marked. Reporting
      // the point estimate alone is how small differences become claims.
      const gapCi = el('td', 'ev-num ev-dim');
      if (r.gap_structural_zero) {
        // The best layer *is* the sanctioned surface, so there is no gap to
        // measure. Flagging this "spans zero" would dilute the warning on rows
        // where a gap was measured and came out uncertain.
        gapCi.appendChild(el('span', 'ev-flag', 'no internals'));
      } else if (r.gap_ci95) {
        gapCi.textContent = `${signed(r.gap_ci95[0])} to ${signed(r.gap_ci95[1])}`;
        if (r.gap_separated_from_zero === false) {
          gapCi.appendChild(document.createElement('br'));
          gapCi.appendChild(el('span', 'ev-flag warn', 'spans zero'));
        }
      } else {
        gapCi.textContent = 'n/a';
      }
      tr.appendChild(gapCi);

      tr.appendChild(el('td', 'ev-num ev-dim', fmt(r.best_baseline)));
      tr.appendChild(el('td', 'ev-num ev-dim', fmt(r.ceiling)));

      const beats = el('td');
      const flag = el('span', `ev-flag ${r.beats_baseline ? 'ok' : 'bad'}`,
        r.beats_baseline ? 'yes' : 'no');
      beats.appendChild(flag);
      tr.appendChild(beats);

      const nullTd = el('td');
      // Surviving the null is good news only when the measured thing is desirable.
      const nullOk = higherIsBetter ? r.survives_null : !r.survives_null;
      const nf = el('span', `ev-flag ${nullOk ? 'ok' : 'warn'}`, fmt(r.null_p));
      nullTd.appendChild(nf);
      tr.appendChild(nullTd);

      tr.appendChild(el('td', 'ev-num ev-dim',
        r.ci95 ? `${fmt(r.ci95[0], 2)} to ${fmt(r.ci95[1], 2)}` : 'n/a'));

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    if (board.note) {
      container.appendChild(el('p', 'ev-note', board.note));
    }

    const flagged = board.rows.filter((r) => r.caveats && r.caveats.length);
    if (flagged.length) {
      const wrap = el('div', 'ev-note');
      wrap.appendChild(el('strong', null, 'Flagged by the harness'));
      const ul = el('ul', 'ev-caveats');
      flagged.forEach((r) => {
        r.caveats.forEach((c) => ul.appendChild(el('li', null, `${r.model}, ${c}`)));
      });
      wrap.appendChild(ul);
      container.appendChild(wrap);
    }
  }


  // --- trend chart -------------------------------------------------------
  // The headline figure. Rendered from the payload so it cannot drift from the
  // cards, and mirrored into a visually hidden table so the numbers are
  // reachable without reading an SVG.

  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };

  const shortParams = (p) =>
    p >= 1e9 ? `${(p / 1e9).toFixed(p >= 1e10 ? 0 : 1)}B`
      : p >= 1e6 ? `${Math.round(p / 1e6)}M`
      : `${Math.round(p / 1e3)}K`;

  const yearOf = (d) => {
    if (!d) return null;
    const [y, m] = String(d).split('-');
    return Number(y) + (Number(m || 6) - 0.5) / 12;
  };

  // --- small geometry, used to place labels and to route leader lines ------

  // How far along a ray before it enters a box, or null if it never does.
  // Used to stop a leader line just short of the text it points at.
  const rayEnter = (ox, oy, ux, uy, b) => {
    let tmin = -Infinity, tmax = Infinity;
    const slab = (o, u, lo, hi) => {
      if (Math.abs(u) < 1e-9) return o >= lo && o <= hi;
      let t1 = (lo - o) / u, t2 = (hi - o) / u;
      if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      return true;
    };
    if (!slab(ox, ux, b.x1, b.x2)) return null;
    if (!slab(oy, uy, b.y1, b.y2)) return null;
    return tmax >= Math.max(tmin, 0) ? Math.max(tmin, 0) : null;
  };

  const segHitsBox = (x1, y1, x2, y2, b) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (!len) return false;
    const t = rayEnter(x1, y1, dx / len, dy / len, b);
    return t != null && t <= len;
  };

  const segHitsSeg = (ax, ay, bx, by, cx, cy, dx2, dy2) => {
    const d = (bx - ax) * (dy2 - cy) - (by - ay) * (dx2 - cx);
    if (Math.abs(d) < 1e-9) return false;
    const t = ((cx - ax) * (dy2 - cy) - (cy - ay) * (dx2 - cx)) / d;
    const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return t > 0 && t < 1 && u > 0 && u < 1;
  };

  const distToSeg = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };

  function renderTrend(container, trend, opts = {}) {
    container.innerHTML = '';
    const byDate = opts.xMode === 'date';
    let pts = (trend.points || []).filter((p) => p.params && p.best != null)
      // Untrained control models share the architecture but not the training, so
      // they are a separate arm rather than rungs on this ladder. Plotting them
      // here would imply one trend through two different populations.
      .filter((p) => !/-random$/.test(p.model));

    if (byDate) {
      // A trend against time is only about time if size is held roughly fixed.
      // Without the band this would be a scaling curve wearing a date axis.
      const [lo, hi] = opts.sizeBand || [0, Infinity];
      pts = pts.filter((p) => p.release_date && p.params >= lo && p.params <= hi);
    }
    if (pts.length < 2) {
      // An empty chart should say what it is waiting for, not just that it is
      // empty. A reader who knows the ladder is mid-run reads this as progress;
      // "no data" reads as a broken page.
      const n = pts.length;
      setEmpty(
        container,
        byDate
          ? `Only ${n} model of comparable size has a measured release date so far. `
            + 'A trend against time needs at least three, held at similar size so '
            + 'that it is a statement about vintage rather than about scale.'
          : `The scaling ladder is still being measured: ${n} model${n === 1 ? '' : 's'} `
            + 'has a result so far, and a curve needs at least three. Each additional '
            + 'model is one run on the same task and protocol.'
      );
      return;
    }

    // Taller than it looks like it needs to be, on purpose. The y-axis has to
    // reach down to the no-model baseline and the ceiling (0.765 and 0.785) to
    // show them, while every real model scores above 0.88 -- so the data lives
    // in the top third and the bottom half is empty. That squeeze is the real
    // source of the label crowding: seven models between 420M and 1.2B are
    // pressed into a band about 50px tall, and no placement algorithm can undo
    // that. More height is the one change that gives every label more room
    // without moving a single point or hiding a name.
    const W = 940, H = 560;
    const M = { t: 28, r: 168, b: 62, l: 62 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    const xOf = (p) => (byDate ? yearOf(p.release_date) : Math.log10(p.params));
    const xs = pts.map(xOf);
    const refVals = (trend.references || []).map((r) => r.best).filter((v) => v != null);
    const ysAll = pts.map((p) => p.best)
      .concat(refVals)
      .concat(trend.ceiling != null ? [trend.ceiling] : []);

    const xPad = byDate ? 0.45 : 0.15;
    const xMin = Math.floor(Math.min(...xs)) - xPad;
    const xMax = Math.ceil(Math.max(...xs)) + xPad;
    let yMin = Math.min(...ysAll), yMax = Math.max(...ysAll);
    const padY = Math.max(0.04, (yMax - yMin) * 0.25);
    yMin = Math.max(0, yMin - padY); yMax = Math.min(1, yMax + padY);

    const X = (v) => M.l + ((v - xMin) / (xMax - xMin)) * iw;
    const Y = (v) => M.t + ih - ((v - yMin) / (yMax - yMin)) * ih;

    const svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`, class: 'ev-chart',
      role: 'img', 'aria-labelledby': 'evTrendTitle evTrendDesc',
    });
    const title = svgEl('title', { id: 'evTrendTitle' });
    title.textContent = opts.title || 'Capability against model size';
    const desc = svgEl('desc', { id: 'evTrendDesc' });
    desc.textContent =
      `${pts.length} models plotted by parameter count against ${trend.metric}.`;
    svg.append(title, desc);

    // gridlines and y ticks
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + (i / yTicks) * (yMax - yMin);
      svg.appendChild(svgEl('line', {
        x1: M.l, x2: M.l + iw, y1: Y(v), y2: Y(v), class: 'ev-chart-grid',
      }));
      const lab = svgEl('text', { x: M.l - 12, y: Y(v) + 4, class: 'ev-chart-tick', 'text-anchor': 'end' });
      lab.textContent = v.toFixed(2);
      svg.appendChild(lab);
    }

    // x ticks: one per decade of parameters, or one per year
    for (let d = Math.ceil(xMin); d <= Math.floor(xMax); d++) {
      const lab = svgEl('text', { x: X(d), y: M.t + ih + 26, class: 'ev-chart-tick', 'text-anchor': 'middle' });
      lab.textContent = byDate ? String(d) : shortParams(Math.pow(10, d));
      svg.appendChild(lab);
    }

    // Horizontal reference lines: what the model has to clear, and what the data
    // allows. Their labels go through the same placement pass as the point
    // labels, because these two values can be almost identical (here the
    // no-model baseline and the ceiling differ by 0.002) and their labels then
    // land on top of each other in the right margin.
    const jobs = [];
    const hline = (value, label, cls) => {
      if (value == null || value < yMin || value > yMax) return;
      svg.appendChild(svgEl('line', {
        x1: M.l, x2: M.l + iw, y1: Y(value), y2: Y(value), class: cls,
      }));
      const node = svgEl('text', {
        x: M.l + iw + 10, y: Y(value) + 4, class: 'ev-chart-note',
      });
      node.textContent = label;
      svg.appendChild(node);
      jobs.push({
        node, x: M.l + iw + 10, y: Y(value) + 4, anchor: 'start',
        offsets: [0, -13, 13, -26, 26], tether: Y(value),
      });
    };
    if (refVals.length) {
      const best = Math.max(...refVals);
      hline(best, `no-model baseline ${best.toFixed(3)}`, 'ev-chart-ref');
    }
    hline(trend.ceiling, `ceiling ${Number(trend.ceiling).toFixed(3)}`, 'ev-chart-ceiling');

    // least-squares fit in log-parameter space
    if (pts.length >= 3) {
      const ys = pts.map((p) => p.best);
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
      const my = ys.reduce((a, b) => a + b, 0) / ys.length;
      let num = 0, den = 0;
      xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
      const slope = den ? num / den : 0;
      const at = (x) => my + slope * (x - mx);
      svg.appendChild(svgEl('line', {
        x1: X(xMin), y1: Y(at(xMin)), x2: X(xMax), y2: Y(at(xMax)), class: 'ev-chart-fit',
      }));
      container.dataset.slope = slope.toFixed(4);
    }

    // Leaders live in their own layer, drawn before the points, so a line that
    // runs to the centre of a dot disappears under the dot instead of crossing it.
    const leaderLayer = svgEl('g', { class: 'ev-chart-leaders' });
    svg.appendChild(leaderLayer);

    // error bars and points
    const ptXY = pts.map((p) => ({ x: X(xOf(p)), y: Y(p.best) }));
    // Kept, because a leader drawn straight up or down from a point runs along
    // its own interval bar and vanishes into it. The bar is the reason the
    // obvious placement is the wrong one here.
    const bars = [];
    pts.forEach((p, i) => {
      const x = ptXY[i].x;
      if (p.ci95) {
        const a = Y(p.ci95[0]), b = Y(p.ci95[1]);
        bars.push({ x, y1: Math.min(a, b), y2: Math.max(a, b) });
        svg.appendChild(svgEl('line', {
          x1: x, x2: x, y1: a, y2: b, class: 'ev-chart-err',
        }));
      }
      svg.appendChild(svgEl('circle', { cx: x, cy: ptXY[i].y, r: 6, class: 'ev-chart-pt' }));
    });

    // Labels. There are two separate failures here and overlap is only one of
    // them. The other is association: a label can sit in perfectly clear space
    // and still be useless, because it is nearly equidistant between two points
    // and so names neither. That is the failure this chart had. Seven models
    // fall between 400M and 1.2B, three of them at exactly 650M and two at
    // 1.2B, and on a log axis those collapse into one column. It cannot be
    // nudged away: inside a cluster that tight, a label is unambiguous by
    // proximity only if its own point is at least twice as near as the
    // runner-up, which would mean sitting on the dot.
    //
    // So the rule is: place by cost, then measure whether proximity actually
    // settled it, and draw a leader wherever it did not. The threshold is the
    // measured ratio, not a guess at how far the label moved -- a label nudged
    // 20px in open country needs no line, and one nudged 20px inside the
    // cluster needs one.
    const CLEAR_RATIO = 2.2;

    // Eight directions, edge-anchored: the offset is the gap between the point
    // and the near edge of the text, not the text's centre, so a wide label
    // never lands on top of the point it names.
    const DIRS = [
      { ux: 0, uy: -1, anchor: 'middle', pen: 0 },
      { ux: 0, uy: 1, anchor: 'middle', pen: 1 },
      // Mostly vertical but stepped sideways: this is what lets a label leave a
      // column of points without its leader running down the column.
      { ux: 0.34, uy: -0.94, anchor: 'start', pen: 3 },
      { ux: -0.34, uy: -0.94, anchor: 'end', pen: 3 },
      { ux: 0.34, uy: 0.94, anchor: 'start', pen: 3 },
      { ux: -0.34, uy: 0.94, anchor: 'end', pen: 3 },
      { ux: 0.72, uy: -0.72, anchor: 'start', pen: 4 },
      { ux: -0.72, uy: -0.72, anchor: 'end', pen: 4 },
      { ux: 0.72, uy: 0.72, anchor: 'start', pen: 4 },
      { ux: -0.72, uy: 0.72, anchor: 'end', pen: 4 },
      { ux: 1, uy: 0, anchor: 'start', pen: 6 },
      { ux: -1, uy: 0, anchor: 'end', pen: 6 },
    ];
    // Rings run further than the label needs in the sparse case because the
    // crowded case needs somewhere to go. Seven of these twelve models sit
    // between 420M and 1.2B, and no amount of nudging inside 82px separates
    // seven labels -- they just form a tidier knot. The chart has a large
    // empty band below the data (the y-axis runs down to the baseline and
    // ceiling references), so the long rings let a crowded label walk out into
    // it on a leader instead of fighting its neighbours for the same 40px.
    const RINGS = [11, 22, 34, 48, 64, 82, 104, 130, 158];

    // On a size axis two models can sit at exactly the same parameter count, and
    // labelling both "650M" tells the reader nothing about which is which. Add
    // the family only where the size alone is ambiguous, so the common case
    // stays short.
    const sizeCounts = {};
    pts.forEach((p) => {
      const k = shortParams(p.params);
      sizeCounts[k] = (sizeCounts[k] || 0) + 1;
    });

    const labelJobs = [];
    pts.forEach((p, i) => {
      const size = shortParams(p.params);
      const text = byDate
        ? `${p.family} ${size}`
        : (sizeCounts[size] > 1 && p.family ? `${p.family} ${size}` : size);
      const node = svgEl('text', {
        x: ptXY[i].x, y: ptXY[i].y - 20,
        class: 'ev-chart-label', 'text-anchor': 'middle',
      });
      node.textContent = text;
      svg.appendChild(node);
      labelJobs.push({ node, idx: i, x: ptXY[i].x, y: ptXY[i].y });
    });

    const wrap = el('div', 'ev-chart-wrap');
    wrap.appendChild(svg);
    container.appendChild(wrap);

    // Now the SVG is in the document, so text can be measured rather than
    // guessed. A guess at characters times a constant was wrong for this font
    // and left a pair overlapping, exactly the sort of nearly-right that
    // survives review.
    const LAB_H = 13;
    const placed = [];
    const areaOf = (box) => placed.reduce((acc, b) => {
      const ox = Math.min(box.x2, b.x2) - Math.max(box.x1, b.x1);
      const oy = Math.min(box.y2, b.y2) - Math.max(box.y1, b.y1);
      return acc + (ox > 0 && oy > 0 ? ox * oy : 0);
    }, 0);

    // Tick labels are furniture, but they are still text: a data label that
    // lands on one is as unreadable as one that lands on another data label.
    svg.querySelectorAll('.ev-chart-tick').forEach((t) => {
      try {
        const b = t.getBBox();
        if (b.width) placed.push({ x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height });
      } catch (e) { /* no layout */ }
    });

    // The two reference-line captions sit in the right margin and only need to
    // dodge each other; the no-model baseline and the ceiling differ by 0.02
    // here, so their captions would otherwise land on top of one another.
    jobs.forEach((job) => {
      let w = 60;
      try { w = job.node.getComputedTextLength() || w; } catch (e) { /* no layout */ }
      let best = null;
      for (const cand of job.offsets) {
        const yy = job.y + cand;
        const box = { x1: job.x, x2: job.x + w, y1: yy - LAB_H, y2: yy + 3 };
        if (box.x2 > W - 4) continue;
        const cost = areaOf(box) + Math.abs(cand) * 0.4;
        if (!best || cost < best.cost) best = { yy, box, cost, dy: cand };
      }
      if (!best) return;
      placed.push(best.box);
      job.node.setAttribute('y', String(best.yy));
      // A caption nudged off its line needs a tick back to it, or it reads as
      // belonging to the wrong line.
      if (job.tether != null && Math.abs(best.dy) > 2) {
        leaderLayer.appendChild(svgEl('line', {
          x1: job.x - 6, y1: job.tether, x2: job.x - 2, y2: best.yy - 4,
          class: 'ev-chart-leader',
        }));
      }
    });

    // Measure each label once, then hand out positions crowded-points-first.
    // Placing in data order let the isolated models take the easy slots and
    // left the cluster with whatever was over, which is backwards: the tight
    // group is the one with no choices.
    labelJobs.forEach((job) => {
      let w = 60, asc = 12, desc = 3;
      try {
        const b = job.node.getBBox();
        const base = parseFloat(job.node.getAttribute('y'));
        if (b.width) { w = b.width; asc = base - b.y; desc = (b.y + b.height) - base; }
      } catch (e) { /* no layout */ }
      job.w = w; job.asc = asc; job.desc = desc; job.h = asc + desc;
      job.crowd = ptXY.reduce((n, q, j) => (
        n + (j !== job.idx && Math.hypot(q.x - job.x, q.y - job.y) < 70 ? 1 : 0)
      ), 0);
    });

    const order = labelJobs.slice().sort((a, b) => (b.crowd - a.crowd) || (a.idx - b.idx));
    const fixed = placed.slice();          // ticks and reference captions, immovable
    let slot = new Array(labelJobs.length).fill(null);

    const boxFor = (job, d, g) => {
      const gx = d.ux * g, gy = d.uy * g;
      let y1;
      if (d.uy < 0) y1 = job.y + gy - job.h;
      else if (d.uy > 0) y1 = job.y + gy;
      else y1 = job.y - job.h / 2;
      let x1;
      if (d.anchor === 'middle') x1 = job.x - job.w / 2;
      else if (d.anchor === 'start') x1 = job.x + gx;
      else x1 = job.x + gx - job.w;
      return { x1, y1, x2: x1 + job.w, y2: y1 + job.h };
    };

    // Everything except this label. On the first pass the later slots are still
    // empty; on the passes after that they are all filled, which is what turns
    // one greedy sweep into something able to back out of a bad early choice.
    const context = (job) => {
      const boxes = fixed.slice();
      const segs = [];
      slot.forEach((s, j) => {
        if (!s || j === job.idx) return;
        boxes.push(s.box);
        if (s.seg) segs.push(s.seg);
      });
      return { boxes, segs };
    };

    const score = (job, d, g, ring, ctx) => {
      const box = boxFor(job, d, g);
      if (box.x1 < 4 || box.x2 > W - 4) return null;
      if (box.y1 < M.t - 6 || box.y2 > M.t + ih + 36) return null;

      // A label sitting on any dot, its own included, reads as a rendering
      // fault and hides the mark it is meant to explain.
      let onDot = 0;
      ptXY.forEach((q) => {
        if (q.x >= box.x1 - 5 && q.x <= box.x2 + 5 && q.y >= box.y1 - 5 && q.y <= box.y2 + 5) onDot++;
      });

      const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2;
      let own = Infinity, near = Infinity;
      ptXY.forEach((q, j) => {
        const dd = Math.hypot(q.x - cx, q.y - cy);
        if (j === job.idx) { own = dd; return; }
        if (dd < near) near = dd;
      });
      const ownNearest = own <= near;
      // The ratio the reader actually experiences: how much nearer this label's
      // own point is than the next one along.
      const ratio = own > 0 ? near / own : 1;
      const needsLeader = !(ownNearest && ratio >= CLEAR_RATIO);
      // A leader shorter than the dot it starts from is not a leader, so a
      // label that needs one has to stand at least one ring out.
      if (needsLeader && ring === 0) return null;

      // Compared with a margin, not edge to edge: the label carries a halo of
      // background colour so that whatever passes behind it stays legible, and
      // two labels touching would knock chunks out of each other.
      const overlap = ctx.boxes.reduce((acc, b) => {
        const ox = Math.min(box.x2 + 2.5, b.x2) - Math.max(box.x1 - 2.5, b.x1);
        const oy = Math.min(box.y2 + 2, b.y2) - Math.max(box.y1 - 2, b.y1);
        return acc + (ox > 0 && oy > 0 ? ox * oy : 0);
      }, 0);

      // Distance is charged twice over -- once for how far the text sits from
      // the mark it names, once for the length of line needed to say so -- so
      // the cheapest way to satisfy the association rule is to stay close, not
      // to run off into the empty half of the chart trailing a long wire.
      // Distance is charged less to a label whose own neighbourhood is full.
      // With a flat charge the cheapest seat is always the nearest one, so
      // every label in a knot picks a seat inside the knot and the knot
      // survives -- which is exactly what the first version of this shipped:
      // association was guaranteed by leaders, and the middle of the chart
      // still read as a pile. `crowd` counts the other marks within 70px, so
      // an isolated label still hugs its dot and only a crowded one is allowed
      // to travel.
      const relief = 1 / (1 + Math.min(job.crowd || 0, 6) * 0.45);
      let cost = overlap * 8 + onDot * 900 + ring * 3 * relief + d.pen + own * 0.55 * relief;
      if (!ownNearest) cost += 400;
      // Charged from both sides, or the pass order decides who wins: a label
      // pays for landing on somebody's leader exactly as a leader pays for
      // crossing somebody's label.
      ctx.segs.forEach((s) => {
        if (segHitsBox(s[0], s[1], s[2], s[3], box)) cost += 120;
      });
      let seg = null;
      if (needsLeader) {
        // The leader does not have to aim at the middle of the label, and it
        // must not: every point wears a tall vertical interval bar, so a line
        // drawn straight up or down from a dot is swallowed whole by the bar
        // and the reader sees no leader at all. Aiming at a corner of the text
        // instead slants the line clear of the bar while leaving the label
        // itself square above or below its point, where it reads best.
        const lat = Math.min(job.w / 2 - 5, 26);
        const aims = [];
        if (d.uy !== 0) {
          const ey = d.uy < 0 ? box.y2 + 3 : box.y1 - 3;
          [-1, 1].forEach((s) => aims.push([
            Math.max(box.x1 + 5, Math.min(box.x2 - 5, job.x + s * lat)), ey,
          ]));
        } else {
          const ex = d.ux > 0 ? box.x1 - 3 : box.x2 + 3;
          aims.push([ex, (box.y1 + box.y2) / 2]);
        }

        const routeCost = (aim) => {
          const vx = aim[0] - job.x, vy = aim[1] - job.y;
          const len = Math.hypot(vx, vy) || 1;
          const ux = vx / len, uy = vy / len;
          const s = [job.x + ux * 8.5, job.y + uy * 8.5, aim[0], aim[1]];
          const sl = Math.hypot(s[2] - s[0], s[3] - s[1]);
          if (sl < 6) return null;
          // Relieved for the same reason the ring is: in a knot the leader is
          // what buys the space, so charging it at the full rate re-creates
          // the knot the ring relief was meant to open. An uncrowded label
          // still pays full price and therefore still stays put.
          let c = 24 + sl * 1.6 * relief;
          const SAMPLES = 16;
          let buried = 0;
          for (let k = 0; k <= SAMPLES; k++) {
            const f = k / SAMPLES;
            const sx = s[0] + (s[2] - s[0]) * f;
            const sy = s[1] + (s[3] - s[1]) * f;
            if (bars.some((b) => Math.abs(sx - b.x) <= 2.5 && sy >= b.y1 - 1 && sy <= b.y2 + 1)) buried++;
          }
          c += (buried / (SAMPLES + 1)) * sl * 6;
          ctx.boxes.forEach((b) => {
            if (segHitsBox(s[0], s[1], s[2], s[3], b)) c += 260;
            // A leader that STOPS inside somebody else's label is a different
            // and worse fault than one that merely crosses it. Crossing is
            // clutter; stopping is a false statement -- the reader follows the
            // line from the dot and arrives at the wrong model's name, with no
            // cue that anything went wrong. It shipped exactly once, from
            // ESM-1b's dot into "Ankh 1.2B", because this was charged the same
            // 120 as a crossing and the endpoint landed 3px short of its own
            // label. Priced with `onDot` instead, since it is the same class of
            // error: the picture asserting something untrue.
            const ex = s[2], ey = s[3];
            if (ex >= b.x1 - 1 && ex <= b.x2 + 1 && ey >= b.y1 - 1 && ey <= b.y2 + 1) c += 1500;
          });
          ptXY.forEach((q, j) => {
            // Two models can score so nearly the same that their dots overlap --
            // ESM-1b and ESM2 at 650M land three pixels apart. Charging a leader
            // for grazing a dot that close to its own buys nothing and distorts
            // the rest of the layout, so only strangers further out count.
            if (j === job.idx) return;
            if (Math.hypot(q.x - job.x, q.y - job.y) < 16) return;
            if (distToSeg(q.x, q.y, s[0], s[1], s[2], s[3]) < 8) c += 150;
          });
          ctx.segs.forEach((o) => {
            if (segHitsSeg(s[0], s[1], s[2], s[3], o[0], o[1], o[2], o[3])) c += 90;
          });
          return { seg: s, c };
        };

        let route = null;
        aims.forEach((aim) => {
          const r = routeCost(aim);
          if (r && (!route || r.c < route.c)) route = r;
        });
        if (!route) return null;
        seg = route.seg;
        cost += route.c;
      }
      return { d, g, ring, box, cost, needsLeader, seg };
    };

    const solve = (job) => {
      const ctx = context(job);
      let best = null;
      DIRS.forEach((d) => RINGS.forEach((g, ring) => {
        const cand = score(job, d, g, ring, ctx);
        if (cand && (!best || cand.cost < best.cost)) best = cand;
      }));
      return best || {
        d: DIRS[0], g: RINGS[0], ring: 0, box: boxFor(job, DIRS[0], RINGS[0]),
        cost: 0, needsLeader: false, seg: null,
      };
    };

    // Sweep, then re-sweep with everyone else's choice visible. Keep whichever
    // sweep scored best overall, so a refinement pass can never leave the chart
    // worse than the sweep before it.
    let bestSlot = null, bestTotal = Infinity;
    for (let pass = 0; pass < 4; pass++) {
      order.forEach((job) => { slot[job.idx] = solve(job); });
      const total = labelJobs.reduce((acc, job) => {
        const s = slot[job.idx];
        const re = score(job, s.d, s.g, s.ring, context(job));
        return acc + (re ? re.cost : s.cost);
      }, 0);
      if (total < bestTotal - 1e-6) { bestTotal = total; bestSlot = slot.slice(); }
    }
    slot = bestSlot || slot;

    labelJobs.forEach((job) => {
      const s = slot[job.idx];
      const bx = s.d.anchor === 'start' ? s.box.x1
        : s.d.anchor === 'end' ? s.box.x2
          : job.x;
      job.node.setAttribute('x', String(bx));
      job.node.setAttribute('y', String(s.box.y1 + job.asc));
      job.node.setAttribute('text-anchor', s.d.anchor);
      if (!s.needsLeader || !s.seg) return;
      const line = svgEl('line', {
        x1: s.seg[0], y1: s.seg[1], x2: s.seg[2], y2: s.seg[3],
        class: 'ev-chart-leader',
      });
      // Recorded so the connection can be checked mechanically rather than by
      // eye, which is how the ambiguity got shipped in the first place.
      line.setAttribute('data-leader-for', String(job.idx));
      leaderLayer.appendChild(line);
    });

    // Verify the invariant rather than trust the cost function to have bought
    // it. The costs are soft -- a big number that can still be outweighed --
    // and the one fault this chart must never have is a leader ending inside
    // the wrong label, because that does not look like a bug to a reader, it
    // looks like an answer. So: check every leader against every foreign box
    // and, if one still lands wrong, shorten it to stop at the boundary of the
    // stranger it entered. A leader that stops short is merely unhelpful; a
    // leader that ends inside the wrong name is false.
    const finalBoxes = labelJobs.map((job) => slot[job.idx].box);
    let repaired = 0;
    labelJobs.forEach((job) => {
      const s = slot[job.idx];
      if (!s.needsLeader || !s.seg) return;
      const line = leaderLayer.querySelector(`[data-leader-for="${job.idx}"]`);
      if (!line) return;
      let [x1, y1, x2, y2] = s.seg;
      finalBoxes.forEach((b, j) => {
        if (j === job.idx) return;
        const inside = x2 >= b.x1 - 1 && x2 <= b.x2 + 1 && y2 >= b.y1 - 1 && y2 <= b.y2 + 1;
        if (!inside) return;
        // Walk back along the leader until it is clear of the box it ended in.
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        for (let back = 2; back <= len; back += 2) {
          const f = (len - back) / len;
          const nx = x1 + dx * f, ny = y1 + dy * f;
          if (!(nx >= b.x1 - 1 && nx <= b.x2 + 1 && ny >= b.y1 - 1 && ny <= b.y2 + 1)) {
            x2 = nx; y2 = ny; repaired += 1;
            break;
          }
        }
      });
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
    });
    // Readable from the DOM so the check can be run from outside, which is how
    // the original defect was found in the first place.
    svg.setAttribute('data-leader-repairs', String(repaired));

    // the same numbers, reachable without the picture
    const tbl = el('table', 'ev-table ev-sr');
    const head = el('tr');
    ['Model', byDate ? 'Released' : 'Parameters', trend.metric].forEach((h) => head.appendChild(el('th', null, h)));
    tbl.appendChild(head);
    pts.forEach((p) => {
      const tr = el('tr');
      tr.appendChild(el('td', null, p.model));
      tr.appendChild(el('td', null, byDate ? String(p.release_date) : String(p.params)));
      tr.appendChild(el('td', null, String(p.best)));
      tbl.appendChild(tr);
    });
    container.appendChild(tbl);
  }

  // --- coverage matrix ---------------------------------------------------

  function renderCoverage(container, coverage) {
    container.innerHTML = '';
    const axes = Object.keys(coverage.axis_labels || {});
    const modalities = ['single-cell', 'protein', 'dna', 'methylation', 'spatial', 'text'];

    const scroll = el('div', 'ev-scroll');
    const table = el('table', 'ev-matrix');

    const thead = el('thead');
    const hr = el('tr');
    hr.appendChild(el('th', null, ''));
    axes.forEach((a) => {
      const th = el('th', null, a);
      th.title = coverage.axis_labels[a];
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el('tbody');
    modalities.forEach((m) => {
      const tr = el('tr');
      const rh = el('th', null, m);
      rh.setAttribute('scope', 'row');
      tr.appendChild(rh);
      axes.forEach((a) => {
        const n = (coverage.grid[m] || {})[a] || 0;
        const td = el('td', n ? 'ev-cell-filled' : 'ev-cell-empty', n ? String(n) : '·');
        td.title = `${m} / ${coverage.axis_labels[a]}: ${n} card(s)`;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
  }

  // --- registry ----------------------------------------------------------

  function renderRegistry(container, data) {
    container.innerHTML = '';
    const evaluated = new Set(data.models.map((m) => m.id));
    const rows = [];

    data.models.forEach((m) =>
      rows.push({ id: m.id, modality: m.modality, status: `evaluated · ${m.n_cards} card(s)`, kind: 'ok' }));

    (data.registry.queued || []).forEach((m) => {
      if (evaluated.has(m.id)) return;
      rows.push({ id: m.id, modality: m.modality, status: `queued · ${m.status}`, kind: 'warn' });
    });

    rows.forEach((r) => {
      const row = el('div', 'ev-reg-row');
      row.appendChild(el('div', 'ev-reg-id', r.id));
      row.appendChild(el('div', 'ev-reg-mod', r.modality));
      const s = el('div');
      s.appendChild(el('span', `ev-flag ${r.kind}`, r.status));
      row.appendChild(s);
      container.appendChild(row);
    });
  }


  // --- plain language ----------------------------------------------------
  // The harness names things for reproducibility: `esm2-t36-3b-ur50d` pins one
  // exact checkpoint and nothing else. That is the right name inside a result
  // card and the wrong one on a page meant to be read, so the translation lives
  // here in the presentation layer and the data keeps its precise identifiers.

  const MODEL_NAMES = {
    'esm2-t6-8m-ur50d': ['ESM2', '8M'],
    'esm2-t12-35m-ur50d': ['ESM2', '35M'],
    'esm2-t30-150m-ur50d': ['ESM2', '150M'],
    'esm2-t33-650m-ur50d': ['ESM2', '650M'],
    'esm2-t36-3b-ur50d': ['ESM2', '3B'],
    'esm2-t48-15b-ur50d': ['ESM2', '15B'],
    'esm1b-t33-650m-ur50s': ['ESM-1b', '650M'],
    'esm1v-t33-650m-ur90s-1': ['ESM-1v', '650M'],
    protbert: ['ProtBert', '420M'],
    'ankh-base': ['Ankh base', '450M'],
    'ankh-large': ['Ankh large', '1.2B'],
    'prot-t5-xl': ['ProtT5-XL', '1.2B'],
    'amplify-350m': ['AMPLIFY', '350M'],
    'scgpt-whole-human': ['scGPT', '51M'],
    'geneformer-v2-104m': ['Geneformer V2', '104M'],
    // Control arm: same architecture and size, never pretrained. Named so it
    // cannot be mistaken for a real model at a glance.
    'esm2-t6-8m-ur50d-random': ['ESM2 8M, untrained', 'control'],
    'esm2-t12-35m-ur50d-random': ['ESM2 35M, untrained', 'control'],
    'esm2-t30-150m-ur50d-random': ['ESM2 150M, untrained', 'control'],
    'esm2-t33-650m-ur50d-random': ['ESM2 650M, untrained', 'control'],
    'composition-reference': ['Counting amino acids', 'no model'],
    'kmer-reference': ['Counting DNA words', 'no model'],
    'raw-expression': ['The measurements themselves', 'no model'],
    'pca-reference-32': ['Simple compression', 'no model'],
  };

  // Rows that are deliberately not models. They are the number everything else
  // has to beat, so they are shown rather than dropped, but shown apart.
  const REFERENCE_IDS = new Set([
    'composition-reference', 'raw-expression', 'pca-reference-32',
    'esm2-t6-8m-ur50d-random', 'esm2-t12-35m-ur50d-random',
    'esm2-t30-150m-ur50d-random', 'esm2-t33-650m-ur50d-random',
  ]);

  const prettyModel = (id) => MODEL_NAMES[id] || [id, ''];

  const TASK_META = {
    'pr1-tf-identity': {
      title: 'Recognising a genetic switch from sequence alone',
      plain: 'Is this protein a transcription factor, one of the switches that turn '
        + 'genes on and off?',
      scale: [0.5, 1],
      foot: '',
    },
    'pr2-tf-family': {
      title: 'Telling apart the kinds of genetic switch',
      plain: 'Which of seven families of DNA-binding machinery does this transcription '
        + 'factor use?',
      scale: [0, 1],
      foot: 'One striped row is a similarity lookup: copy the answer of the most '
        + 'similar protein already labelled. Here that is the hard bar.',
    },
    'pr3-fold-recognition': {
      title: 'Recognising a protein’s shape from a sequence unlike any it has seen',
      plain: 'What shape does this protein fold into, when nothing like it was in '
        + 'training?',
      scale: [0, 1],
      foot: '',
    },
    'dn1-enhancer-class': {
      title: 'Reading regulatory DNA',
      plain: 'Is this 400-letter window of human DNA a regulatory switch, and of which '
        + 'kind?',
      scale: [0, 1],
      foot: '',
    },
    'br1-viral-fitness': {
      title: 'Predicting what a mutation does to a virus',
      plain: 'Given one changed letter in a viral protein, say whether the virus '
        + 'still works. The measurements come from published laboratory experiments.',
      scale: [0, 1],
      foot: 'Three separate viruses are measured; the striped row is what you get '
        + 'from amino-acid counts with no model at all.',
    },
    'pr4-ec-number': {
      title: 'Naming what an enzyme does',
      plain: 'Given a protein, say which of fifteen chemical reactions it catalyses, '
        + 'with every related protein family held out of training.',
      scale: [0, 1],
      foot: '',
    },
    'sc1-celltype-transfer': {
      title: 'Naming a cell type in a person the model never saw',
      plain: 'What kind of cell is this, in a person the model never saw?',
      scale: [0, 1],
      foot: '',
    },
    'sc4-donor-invariance': {
      title: 'Not giving away whose sample it was',
      plain: 'How easily can you tell whose sample a cell came from? Shorter is better.',
      scale: [0, 1],
      foot: 'Shorter is better: the bar is how identifiable the donor was.',
      // On a lower-is-better task "did not beat the baseline" reads backwards,
      // so this task says what actually went wrong.
      failBase: 'gave the donor away more readily than using no model at all',
      higherBetter: false,
    },
  };

  const FAIL_BASE = 'did not beat the no-model comparison';

  const taskMeta = (tid, board) => TASK_META[tid] || {
    title: tid,
    plain: '',
    scale: [0, 1],
    foot: board && board.higher_is_better === false ? 'Shorter is better here.' : '',
  };

  // --- results, for reading ----------------------------------------------
  // The same cards the technical record is built from, reduced to the one
  // number a reader can act on and the comparison that makes it mean anything.

  function renderResults(container, data) {
    container.innerHTML = '';
    const order = ['pr1-tf-identity', 'sc1-celltype-transfer', 'sc4-donor-invariance'];
    const ids = order.filter((t) => (data.leaderboards || {})[t])
      .concat(Object.keys(data.leaderboards || {}).filter((t) => !order.includes(t)));

    if (!ids.length) {
      setEmpty(container, 'No results yet.');
      return;
    }

    ids.forEach((tid) => {
      const board = data.leaderboards[tid];
      const meta = taskMeta(tid, board);
      const trend = (data.trends || {})[tid] || {};
      const info = {};
      (trend.points || []).concat(trend.references || [])
        .forEach((p) => { info[p.model] = p; });

      const block = el('section', 'ev-result');
      block.appendChild(el('h3', 'ev-result-title', meta.title));
      if (meta.plain) block.appendChild(el('p', 'ev-result-plain', meta.plain));

      const [lo, hi] = meta.scale;
      const frac = (v) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

      const models = board.rows.filter((r) => !REFERENCE_IDS.has(r.model));
      const refs = board.rows.filter((r) => REFERENCE_IDS.has(r.model));
      const list = el('div', 'ev-rows');

      const addRow = (r, isRef) => {
        const row = el('div', `ev-row${isRef ? ' is-ref' : ''}`);
        const [name, size] = prettyModel(r.model);

        const nameCell = el('div', 'ev-row-name');
        nameCell.appendChild(el('span', 'ev-row-model', name));
        const bits = [];
        if (size) bits.push(size);
        const rd = (info[r.model] || {}).release_date;
        if (rd) bits.push(String(rd).split('-')[0]);
        if (bits.length) nameCell.appendChild(el('span', 'ev-row-sub', bits.join(' · ')));
        row.appendChild(nameCell);

        const track = el('div', 'ev-bar');
        const fill = el('div', 'ev-bar-fill');
        fill.style.width = `${(frac(r.best) * 100).toFixed(2)}%`;
        track.appendChild(fill);
        row.appendChild(track);

        row.appendChild(el('div', 'ev-row-val', fmt(r.best, 2)));
        list.appendChild(row);
      };

      models.forEach((r) => addRow(r, false));
      refs.forEach((r) => addRow(r, true));
      block.appendChild(list);

      // One plain sentence in place of a column of pass/fail flags. A model that
      // failed a check is named here rather than quietly dropped.
      const noBase = models.filter((r) => r.beats_baseline === false);
      const noNull = models.filter((r) => r.survives_null === false);
      const check = el('p', 'ev-result-check');
      if (!noBase.length && !noNull.length) {
        const good = (meta.higherBetter !== false);
        check.appendChild(el('span', good ? 'ev-tick' : 'ev-cross', good ? '✓' : '!'));
        check.appendChild(document.createTextNode(
          good
            ? ' All beat the no-model comparison and survived a shuffled-label test.'
            : ' Every model here makes the donor easier to identify than no model does,'
              + ' and a shuffled-label test confirms the leak is real rather than chance.'
        ));
      } else {
        const parts = [];
        const names = (rows) => rows.map((r) => prettyModel(r.model)[0]).join(', ');
        if (noBase.length) parts.push(`${names(noBase)} ${meta.failBase || FAIL_BASE}`);
        if (noNull.length) parts.push(`${names(noNull)} did not survive the shuffled-label test`);
        check.appendChild(el('span', 'ev-cross', '✗'));
        check.appendChild(document.createTextNode(` ${parts.join('; ')}.`));
      }
      block.appendChild(check);
      if (meta.foot) block.appendChild(el('p', 'ev-result-foot', meta.foot));

      container.appendChild(block);
    });
  }

  // --- coverage, for reading ---------------------------------------------

  const MODALITY_NAMES = {
    protein: ['Proteins', 'models that read a protein’s amino-acid sequence'],
    'single-cell': ['Single cells', 'models that read gene activity inside one cell'],
    dna: ['Genomes', 'models that read raw DNA'],
    methylation: ['Chemical marks on DNA', 'models that read methylation patterns'],
    spatial: ['Tissue maps', 'models that read where cells sit in a tissue'],
    text: ['Biology in language', 'models that describe cells in words'],
  };

  function renderCoveragePlain(container, data) {
    container.innerHTML = '';
    const grid = (data.coverage || {}).grid || {};
    const list = el('div', 'ev-cov');

    Object.entries(MODALITY_NAMES).forEach(([key, [name, what]]) => {
      const axes = grid[key] || {};
      const n = Object.values(axes).reduce((a, b) => Math.max(a, b), 0);
      const card = el('div', `ev-cov-item${n ? '' : ' is-empty'}`);
      const head = el('div', 'ev-cov-head');
      head.appendChild(el('span', 'ev-cov-name', name));
      head.appendChild(el('span', `ev-flag ${n ? 'ok' : 'warn'}`,
        n ? `${n} model${n === 1 ? '' : 's'}` : 'not started'));
      card.appendChild(head);
      card.appendChild(el('p', 'ev-cov-what', what));
      list.appendChild(card);
    });

    container.appendChild(list);
  }

  // --- boot --------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', async () => {
    const targets = {
      trend: document.getElementById('evTrend'),
      trendTime: document.getElementById('evTrendTime'),
      results: document.getElementById('evResults'),
      coveragePlain: document.getElementById('evCoveragePlain'),
      boards: document.getElementById('evBoards'),
      coverage: document.getElementById('evCoverage'),
      registry: document.getElementById('evRegistry'),
    };
    if (!Object.values(targets).some(Boolean)) return;

    let data;
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      const msg = `Could not load ${DATA_URL} (${err.message}). Results are generated by the PROBE harness.`;
      Object.values(targets).forEach((t) => setEmpty(t, msg));
      return;
    }

    data.registry = data.registry || {};

    if (targets.trend) {
      const tr = (data.trends || {})['pr1-tf-identity'];
      if (tr) {
        renderTrend(targets.trend, tr, {
          title: 'Protein model capability against model size',
          yLabel: 'Macro-F1 identifying transcription factors',
        });
      } else {
        setEmpty(targets.trend, 'No trend data in the payload yet.');
      }
    }
    if (targets.trendTime) {
      const tr = (data.trends || {})['pr1-tf-identity'];
      if (tr) {
        renderTrend(targets.trendTime, tr, {
          xMode: 'date',
          sizeBand: [300e6, 700e6],
          title: 'Protein model capability against release date, at comparable size',
          yLabel: 'Macro-F1 identifying transcription factors',
        });
      }
    }
    if (targets.results) renderResults(targets.results, data);
    if (targets.coveragePlain) renderCoveragePlain(targets.coveragePlain, data);
    if (targets.coverage) renderCoverage(targets.coverage, data.coverage);
    if (targets.registry) renderRegistry(targets.registry, data);

    if (targets.boards) {
      targets.boards.innerHTML = '';
      const taskById = Object.fromEntries(data.tasks.map((t) => [t.id, t]));
      const ids = Object.keys(data.leaderboards);
      if (!ids.length) {
        setEmpty(targets.boards, 'No result cards yet.');
        return;
      }
      ids.forEach((tid) => {
        const block = el('div');
        block.style.marginBottom = '48px';
        block.appendChild(el('h3', 'ev-h2', taskMeta(tid, data.leaderboards[tid]).title));
        block.appendChild(el('p', 'ev-task-id', tid));
        const body = el('div');
        block.appendChild(body);
        targets.boards.appendChild(block);
        renderLeaderboard(body, data.leaderboards[tid], taskById[tid]);
      });
    }
  });
})();
