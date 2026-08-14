/* ========================================
   PROBE — renders content/evals.json
   The pages compute nothing. Everything shown here, including the unflattering
   parts, comes from result cards emitted by the harness.
   ======================================== */

(() => {
  const DATA_URL = 'content/evals.json';

  const fmt = (v, digits = 3) =>
    v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(digits);

  const signed = (v, digits = 3) =>
    v === null || v === undefined ? '—' : (v >= 0 ? '+' : '') + Number(v).toFixed(digits);

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

      tr.appendChild(el('td', 'ev-num', signed(r.elicitation_gap)));
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
        r.ci95 ? `${fmt(r.ci95[0], 2)}–${fmt(r.ci95[1], 2)}` : '—'));

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
        r.caveats.forEach((c) => ul.appendChild(el('li', null, `${r.model} — ${c}`)));
      });
      wrap.appendChild(ul);
      container.appendChild(wrap);
    }
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

  // --- strip -------------------------------------------------------------

  function renderStrip(container, data) {
    const stats = [
      ['Models evaluated', data.models.length],
      ['Tasks live', data.tasks.length],
      ['Result cards', data.generated_from_n_cards],
      ['Models queued', (data.registry.queued || []).length],
    ];
    container.innerHTML = '';
    stats.forEach(([label, value]) => {
      const d = el('div');
      d.appendChild(el('dt', null, label));
      d.appendChild(el('dd', null, String(value)));
      container.appendChild(d);
    });
  }

  // --- boot --------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', async () => {
    const targets = {
      strip: document.getElementById('evStrip'),
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

    if (targets.strip) renderStrip(targets.strip, data);
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
