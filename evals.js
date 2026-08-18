/* ========================================
   PROBE, renders content/evals.json
   The pages compute nothing. Everything shown here, including the unflattering
   parts, comes from result cards emitted by the harness.
   ======================================== */

(() => {
  const DATA_URL = 'content/evals.json';

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

    const W = 940, H = 460;
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

    // error bars and points
    pts.forEach((p) => {
      const x = X(xOf(p));
      if (p.ci95) {
        svg.appendChild(svgEl('line', {
          x1: x, x2: x, y1: Y(p.ci95[0]), y2: Y(p.ci95[1]), class: 'ev-chart-err',
        }));
      }
      svg.appendChild(svgEl('circle', { cx: x, cy: Y(p.best), r: 6, class: 'ev-chart-pt' }));
    });

    // Labels, placed so they do not collide. Two models released weeks apart sit
    // almost on top of each other on a date axis, and overlapping text is worse
    // than no text: it is unreadable and looks like a rendering fault.
    //
    // Widths are measured rather than estimated. A guess at characters times a
    // constant was wrong for this font and left one pair overlapping, which is
    // exactly the sort of nearly-right that survives review.
    const LAB_H = 13;
    const OFFSETS = [-16, 22, -32, 38, -48, 54];
    // On a size axis two models can sit at exactly the same parameter count, and
    // labelling both "650M" tells the reader nothing about which is which. Add
    // the family only where the size alone is ambiguous, so the common case
    // stays short.
    const sizeCounts = {};
    pts.forEach((p) => {
      const k = shortParams(p.params);
      sizeCounts[k] = (sizeCounts[k] || 0) + 1;
    });

    pts.forEach((p) => {
      const size = shortParams(p.params);
      const text = byDate
        ? `${p.family} ${size}`
        : (sizeCounts[size] > 1 && p.family ? `${p.family} ${size}` : size);
      const node = svgEl('text', {
        x: X(xOf(p)), y: Y(p.best) + OFFSETS[0],
        class: 'ev-chart-label', 'text-anchor': 'middle',
      });
      node.textContent = text;
      svg.appendChild(node);
      jobs.push({
        node, x: X(xOf(p)), y: Y(p.best), anchor: 'middle',
        offsets: OFFSETS, leader: true,
      });
    });

    const wrap = el('div', 'ev-chart-wrap');
    wrap.appendChild(svg);
    container.appendChild(wrap);

    // Now the SVG is laid out, so text can be measured.
    const overlaps = (a, b) =>
      !(a.x2 < b.x1 - 3 || a.x1 > b.x2 + 3 || a.y2 < b.y1 - 2 || a.y1 > b.y2 + 2);
    const placed = [];
    jobs.forEach((job) => {
      let w = 60;
      try { w = job.node.getComputedTextLength() || w; } catch (e) { /* no layout */ }
      const span = (yy) => (job.anchor === 'start'
        ? { x1: job.x, x2: job.x + w }
        : { x1: job.x - w / 2, x2: job.x + w / 2 });

      // Search vertically first, then sideways. Vertical-only placement runs out
      // when several models share an x -- three at 650M, two at 1.2B -- and the
      // old code then fell back to offsets[0], the candidate most likely to
      // collide, which guaranteed an overlap on exactly the crowded charts that
      // needed placement most. Now every candidate is scored and the least-bad
      // one wins if none is clean.
      const areaOf = (box) => placed.reduce((acc, b) => {
        const ox = Math.min(box.x2, b.x2) - Math.max(box.x1, b.x1);
        const oy = Math.min(box.y2, b.y2) - Math.max(box.y1, b.y1);
        return acc + (ox > 0 && oy > 0 ? ox * oy : 0);
      }, 0);

      const candidates = [];
      for (const cand of job.offsets) {
        for (const dx of [0, w / 2 + 10, -(w / 2 + 10)]) {
          const yy = job.y + cand;
          if (yy < M.t + 10 || yy > M.t + ih + 40) continue;
          const base = span(yy);
          const box = { x1: base.x1 + dx, x2: base.x2 + dx, y1: yy - LAB_H, y2: yy + 3 };
          if (box.x1 < 2 || box.x2 > W - 4) continue;
          candidates.push({ dy: cand, dx, yy, box, cost: areaOf(box) + Math.abs(cand) * 0.4 + Math.abs(dx) * 0.8 });
        }
      }
      candidates.sort((a, b) => a.cost - b.cost);
      const pick = candidates[0] || {
        dy: job.offsets[0], dx: 0, yy: job.y + job.offsets[0],
        box: { ...span(job.y + job.offsets[0]), y1: job.y + job.offsets[0] - LAB_H, y2: job.y + job.offsets[0] + 3 },
      };
      const dy = pick.dy;
      const yy = pick.yy;
      placed.push(pick.box);
      job.node.setAttribute('y', String(yy));
      if (pick.dx) {
        job.node.setAttribute('x', String(job.x + pick.dx));
        // Displaced sideways, so it needs a line back to its point.
        svg.appendChild(svgEl('line', {
          x1: job.x, y1: job.y, x2: job.x + pick.dx - Math.sign(pick.dx) * (w / 2 + 2), y2: yy - 4,
          class: 'ev-chart-leader',
        }));
      }

      // A reference label nudged off its line needs a tick back to it, or it
      // reads as belonging to the wrong line.
      if (job.tether != null && Math.abs(dy) > 2) {
        svg.appendChild(svgEl('line', {
          x1: job.x - 6, y1: job.tether, x2: job.x - 2, y2: yy - 4,
          class: 'ev-chart-leader',
        }));
      }
      if (job.leader && Math.abs(dy) > 26) {
        const leader = svgEl('line', {
          x1: job.x, y1: job.y + Math.sign(dy) * 8,
          x2: job.x, y2: yy + (dy < 0 ? 4 : -10),
          class: 'ev-chart-leader',
        });
        svg.insertBefore(leader, svg.firstChild);
      }
    });

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
