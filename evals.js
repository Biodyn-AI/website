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
    ['Ceiling', 'ceiling'],
    ['Beats baseline', 'beats'],
    ['Null p', 'null_p'],
    ['CI95', 'ci95'],
  ];

  function renderLeaderboard(container, board, task) {
    container.innerHTML = '';

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
      if (r.gap_separated_from_zero === true) gapTd.classList.add('is-best');
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
      const nf = el('span', `ev-flag ${r.survives_null ? 'ok' : 'bad'}`, fmt(r.null_p));
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

  function renderTrend(container, trend, opts = {}) {
    container.innerHTML = '';
    const pts = (trend.points || []).filter((p) => p.params && p.best != null);
    if (pts.length < 2) {
      // An empty chart should say what it is waiting for, not just that it is
      // empty. A reader who knows the ladder is mid-run reads this as progress;
      // "no data" reads as a broken page.
      const n = pts.length;
      setEmpty(
        container,
        `The scaling ladder is still being measured: ${n} model${n === 1 ? '' : 's'} `
        + 'has a result so far, and a curve needs at least three. Each additional '
        + 'model is one run on the same task and protocol.'
      );
      return;
    }

    const W = 940, H = 460;
    const M = { t: 28, r: 168, b: 62, l: 62 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    const xs = pts.map((p) => Math.log10(p.params));
    const refVals = (trend.references || []).map((r) => r.best).filter((v) => v != null);
    const ysAll = pts.map((p) => p.best)
      .concat(refVals)
      .concat(trend.ceiling != null ? [trend.ceiling] : []);

    const xMin = Math.floor(Math.min(...xs)) - 0.15;
    const xMax = Math.ceil(Math.max(...xs)) + 0.15;
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

    // x ticks, one per decade
    for (let d = Math.ceil(xMin); d <= Math.floor(xMax); d++) {
      const lab = svgEl('text', { x: X(d), y: M.t + ih + 26, class: 'ev-chart-tick', 'text-anchor': 'middle' });
      lab.textContent = shortParams(Math.pow(10, d));
      svg.appendChild(lab);
    }

    // horizontal reference lines: what the model has to clear
    const hline = (value, label, cls) => {
      if (value == null || value < yMin || value > yMax) return;
      svg.appendChild(svgEl('line', {
        x1: M.l, x2: M.l + iw, y1: Y(value), y2: Y(value), class: cls,
      }));
      const tx = svgEl('text', { x: M.l + iw + 10, y: Y(value) + 4, class: 'ev-chart-note' });
      tx.textContent = label;
      svg.appendChild(tx);
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

    // error bars, points, labels
    pts.forEach((p) => {
      const x = X(Math.log10(p.params));
      if (p.ci95) {
        svg.appendChild(svgEl('line', {
          x1: x, x2: x, y1: Y(p.ci95[0]), y2: Y(p.ci95[1]), class: 'ev-chart-err',
        }));
      }
      svg.appendChild(svgEl('circle', { cx: x, cy: Y(p.best), r: 6, class: 'ev-chart-pt' }));
      const lab = svgEl('text', { x: x, y: Y(p.best) - 15, class: 'ev-chart-label', 'text-anchor': 'middle' });
      lab.textContent = shortParams(p.params);
      svg.appendChild(lab);
    });

    // axis titles
    const xt = svgEl('text', { x: M.l + iw / 2, y: H - 12, class: 'ev-chart-axis', 'text-anchor': 'middle' });
    xt.textContent = opts.xLabel || 'Model size (parameters, log scale)';
    svg.appendChild(xt);
    const yt = svgEl('text', {
      x: -(M.t + ih / 2), y: 18, class: 'ev-chart-axis',
      'text-anchor': 'middle', transform: 'rotate(-90)',
    });
    yt.textContent = opts.yLabel || 'Accuracy';
    svg.appendChild(yt);

    const wrap = el('div', 'ev-chart-wrap');
    wrap.appendChild(svg);
    container.appendChild(wrap);

    // the same numbers, reachable without the picture
    const tbl = el('table', 'ev-table ev-sr');
    const head = el('tr');
    ['Model', 'Parameters', trend.metric].forEach((h) => head.appendChild(el('th', null, h)));
    tbl.appendChild(head);
    pts.forEach((p) => {
      const tr = el('tr');
      tr.appendChild(el('td', null, p.model));
      tr.appendChild(el('td', null, String(p.params)));
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


  // --- boot --------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', async () => {
    const targets = {
      trend: document.getElementById('evTrend'),
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
          yLabel: 'Accuracy identifying transcription factors',
        });
      } else {
        setEmpty(targets.trend, 'No trend data in the payload yet.');
      }
    }
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
        block.appendChild(el('h3', 'ev-h2', tid));
        const body = el('div');
        block.appendChild(body);
        targets.boards.appendChild(block);
        renderLeaderboard(body, data.leaderboards[tid], taskById[tid]);
      });
    }
  });
})();
