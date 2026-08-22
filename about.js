/* ========================================
   BIODYN, About, "Turntable"
   One figure. Hovering a case turns it a third
   of a revolution into that case's figure;
   opening an application turns it again into
   that application's figure. Drag to rotate.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const F = window.BiodynFigures;
  const canvas = document.getElementById('ttCanvas');
  const root = document.getElementById('ttRoot');
  if (!A || !F || !canvas || !root) return;

  const body = document.body;
  // Embedded on the main page the tokens live on a scoped section, not on body.
  const scope = root.closest('.ab-scope') || body;
  const ctx = canvas.getContext('2d');
  const chamber = document.getElementById('ttChamber');
  const rail = document.getElementById('ttRail');
  const titleEl = document.getElementById('ttTitle');
  const bodyEl = document.getElementById('ttBody');
  const moreBtn = document.getElementById('ttMore');
  const detail = document.getElementById('ttDetail');
  const detailInner = document.getElementById('ttDetailInner');

  const N = 900;
  const CAMERA = 3.15;
  const TURN_MS = 1150;
  const THIRD = (Math.PI * 2) / 3;
  const PITCH = [0.26, -0.14, 0.34];

  const FIGURES = F.build(N);
  const CASE_FIGURES = FIGURES.cases;
  const APP_FIGURES = FIGURES.applications;
  const AUDIT_FIGURES = FIGURES.audits;
  const ORGANISM_FIGURES = FIGURES.organisms;

  /* Which detail set a case shows, and which figure map goes with it. */
  const AREA_SETS = {
    0: { areas: A.ORGANISM_AREAS, figures: ORGANISM_FIGURES, heading: 'Why this is the right venue' },
    1: { areas: A.AUDIT_AREAS, figures: AUDIT_FIGURES, heading: 'The instrument: SONDE' },
    2: { areas: A.APPLICATIONS, figures: APP_FIGURES, heading: 'Where this has already produced results' }
  };

  /* ---------------------------------------
     Morph + rotation state
     --------------------------------------- */

  let fromFigure = CASE_FIGURES[0];
  let toFigure = CASE_FIGURES[0];
  let progress = 1;
  let progressStart = 0;

  let turnFrom = 0;
  let turnTo = 0;
  let pitchFrom = PITCH[0];
  let pitchTo = PITCH[0];
  let rollDir = 1;

  let colourFrom = [87, 216, 234];
  let colourTo = [87, 216, 234];

  let current = 0;

  let spin = 0;
  let dragYaw = 0;
  let dragPitch = 0;
  let velocityYaw = 0;
  let velocityPitch = 0;
  let dragging = false;
  let lastPointer = null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = false;
  let inView = true;
  let frameHandle = 0;
  let lastFrame = 0;

  let manual = false;
  let virtualNow = 0;
  const clock = () => (manual ? virtualNow : performance.now());

  const order = new Array(N);
  const depth = new Float32Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const ss = new Float32Array(N);
  const sa = new Float32Array(N);
  const vec = [0, 0, 0];

  const CHANNEL_RGB = [[87, 216, 234], [226, 107, 176], [111, 223, 164]];

  const refreshChannels = () => {
    const previous = scope.dataset.channel;
    ['1', '2', '3'].forEach((channel, i) => {
      scope.dataset.channel = channel;
      CHANNEL_RGB[i] = A.hexToRgb(A.readVar(scope, '--ab-ch', '#57d8ea'));
    });
    scope.dataset.channel = previous || '1';
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };

  /* Freezes whatever is on screen and starts a new turn toward `figure`. */
  const morphTo = (figure, channelIndex, direction) => {
    if (figure === toFigure && progress >= 1) return;

    const eased = A.easeInOut(progress);
    if (progress < 1) {
      const pos = new Float32Array(N * 3);
      const intensity = new Float32Array(N);
      for (let i = 0; i < N * 3; i += 1) {
        pos[i] = fromFigure.pos[i] + (toFigure.pos[i] - fromFigure.pos[i]) * eased;
      }
      for (let i = 0; i < N; i += 1) {
        intensity[i] = fromFigure.intensity[i]
          + (toFigure.intensity[i] - fromFigure.intensity[i]) * eased;
      }
      fromFigure = { pos, intensity, edges: null };
      colourFrom = [
        colourFrom[0] + (colourTo[0] - colourFrom[0]) * eased,
        colourFrom[1] + (colourTo[1] - colourFrom[1]) * eased,
        colourFrom[2] + (colourTo[2] - colourFrom[2]) * eased
      ];
      turnFrom += (turnTo - turnFrom) * eased;
      pitchFrom += (pitchTo - pitchFrom) * eased;
    } else {
      fromFigure = toFigure;
      colourFrom = colourTo;
      turnFrom = turnTo;
      pitchFrom = pitchTo;
    }

    toFigure = figure;
    colourTo = CHANNEL_RGB[channelIndex];
    rollDir = direction >= 0 ? 1 : -1;
    turnTo = turnFrom + THIRD * (direction || 1);
    pitchTo = PITCH[channelIndex];
    progress = 0;
    progressStart = clock();
    start();
  };

  /* ---------------------------------------
     Render
     --------------------------------------- */

  const renderFrame = (now) => {
    if (width === 0 || height === 0) return false;

    const reduced = A.prefersReducedMotion();
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;

    if (progress < 1) {
      progress = reduced ? 1 : A.clamp01((now - progressStart) / TURN_MS);
    }

    if (!dragging) {
      // Momentum from the last drag, then back to a slow ambient turn.
      dragYaw += velocityYaw;
      dragPitch += velocityPitch;
      velocityYaw *= 0.94;
      velocityPitch *= 0.94;
      if (Math.abs(velocityYaw) < 0.00002) velocityYaw = 0;
      if (Math.abs(velocityPitch) < 0.00002) velocityPitch = 0;
      if (!reduced) spin += dt * 0.15;
    }
    dragPitch = Math.max(-1.15, Math.min(1.15, dragPitch));

    const eased = A.easeInOut(progress);
    const turn = turnFrom + (turnTo - turnFrom) * eased;
    const pitch = pitchFrom + (pitchTo - pitchFrom) * eased;
    const roll = reduced ? 0 : Math.sin(Math.PI * progress) * 0.17 * rollDir;

    const brightfield = A.isBrightfield();
    const rgb = [
      colourFrom[0] + (colourTo[0] - colourFrom[0]) * eased,
      colourFrom[1] + (colourTo[1] - colourFrom[1]) * eased,
      colourFrom[2] + (colourTo[2] - colourFrom[2]) * eased
    ];
    const sprite = A.getSprite(rgb, brightfield);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = brightfield ? 'source-over' : 'lighter';

    const yaw = spin + turn + dragYaw;
    const totalPitch = pitch + dragPitch;
    const cxPix = width / 2;
    const cyPix = height / 2;
    const span = Math.min(width, height);
    const focal = span * 1.3;
    const unit = span * 0.0049;

    const a = fromFigure;
    const b = toFigure;

    for (let i = 0; i < N; i += 1) {
      const x = a.pos[i * 3] + (b.pos[i * 3] - a.pos[i * 3]) * eased;
      const y = a.pos[i * 3 + 1] + (b.pos[i * 3 + 1] - a.pos[i * 3 + 1]) * eased;
      const z = a.pos[i * 3 + 2] + (b.pos[i * 3 + 2] - a.pos[i * 3 + 2]) * eased;
      const inten = a.intensity[i] + (b.intensity[i] - a.intensity[i]) * eased;

      A.rotate(x, y, z, yaw, totalPitch, roll, vec);
      const persp = focal / (CAMERA + vec[2]);
      sx[i] = cxPix + vec[0] * persp;
      sy[i] = cyPix - vec[1] * persp;
      depth[i] = vec[2];

      const near = 1 - (vec[2] + 1.2) / 2.6;
      ss[i] = unit * (0.55 + inten * 0.85) * (persp / (focal / CAMERA));
      sa[i] = Math.max(0, Math.min(1, inten * (0.22 + near * 0.5)));
      order[i] = i;
    }

    order.sort((p, q) => depth[q] - depth[p]);

    const strokeSkeleton = (figure, weight) => {
      if (!figure || !figure.edges || weight <= 0.01) return;
      const edges = figure.edges;
      ctx.lineWidth = 1;
      const base = brightfield ? 0.26 : 0.15;
      ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${base * weight})`;
      ctx.beginPath();
      for (let e = 0; e < edges.length; e += 2) {
        ctx.moveTo(sx[edges[e]], sy[edges[e]]);
        ctx.lineTo(sx[edges[e + 1]], sy[edges[e + 1]]);
      }
      ctx.stroke();
    };

    if (a !== b) strokeSkeleton(a, 1 - eased);
    strokeSkeleton(b, eased);

    for (let k = 0; k < N; k += 1) {
      const i = order[k];
      if (ss[i] <= 0.05) continue;
      ctx.globalAlpha = brightfield ? sa[i] * 1.15 : sa[i];
      const d = ss[i] * 3.4;
      ctx.drawImage(sprite, sx[i] - d / 2, sy[i] - d / 2, d, d);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    return !reduced || progress < 1 || velocityYaw !== 0 || velocityPitch !== 0;
  };

  const loop = (now) => {
    frameHandle = 0;
    if (!running) return;
    if (renderFrame(now)) {
      frameHandle = requestAnimationFrame(loop);
    } else {
      running = false;
    }
  };

  function start() {
    if (!inView) return;
    if (width === 0 || height === 0) resize();
    if (manual) { renderFrame(virtualNow); return; }
    if (document.hidden) {
      progress = 1;
      lastFrame = 0;
      renderFrame(performance.now());
      return;
    }
    if (running) return;
    running = true;
    lastFrame = 0;
    frameHandle = requestAnimationFrame(loop);
  }

  const stop = () => {
    running = false;
    if (frameHandle) cancelAnimationFrame(frameHandle);
    frameHandle = 0;
  };

  /* ---------------------------------------
     Drag to rotate
     --------------------------------------- */

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    velocityYaw = 0;
    velocityPitch = 0;
    canvas.classList.add('is-dragging');
    chamber.classList.add('is-touched');
    canvas.setPointerCapture(event.pointerId);
    start();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !lastPointer) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    const stepYaw = dx * 0.0072;
    const stepPitch = dy * 0.0058;
    dragYaw += stepYaw;
    dragPitch += stepPitch;
    velocityYaw = stepYaw * 0.55;
    velocityPitch = stepPitch * 0.55;
    start();
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    lastPointer = null;
    canvas.classList.remove('is-dragging');
    if (event && event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    start();
  };

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('keydown', (event) => {
    const step = 0.16;
    if (event.key === 'ArrowLeft') { dragYaw -= step; event.preventDefault(); }
    else if (event.key === 'ArrowRight') { dragYaw += step; event.preventDefault(); }
    else if (event.key === 'ArrowUp') { dragPitch -= step; event.preventDefault(); }
    else if (event.key === 'ArrowDown') { dragPitch += step; event.preventDefault(); }
    else return;
    chamber.classList.add('is-touched');
    start();
  });

  /* ---------------------------------------
     Detail
     --------------------------------------- */

  const makeRefs = (papers) => {
    const ul = document.createElement('ul');
    ul.className = 'ab-refs';
    papers.forEach((paper) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = paper.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = paper.title;
      const venue = document.createElement('span');
      venue.className = 'ab-venue';
      venue.textContent = paper.venue;
      li.append(link, venue);
      ul.appendChild(li);
    });
    return ul;
  };

  let detailOpen = false;
  let activeApp = 0;

  const renderPanel = (index) => {
    const set = AREA_SETS[current];
    const app = set.areas[index];
    const items = app.papers || app.links || [];
    const panel = document.createElement('div');
    panel.className = 'tt-panel is-entering';
    panel.id = 'ttAppPanel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `ttAppTab${index}`);

    const title = document.createElement('h3');
    title.className = 'tt-panel-title';
    title.textContent = app.title;

    const note = document.createElement('p');
    note.className = 'tt-panel-note';
    note.textContent = app.note;

    panel.append(title, note, makeRefs(items));
    return panel;
  };

  const appTabs = [];

  const selectApp = (index, { force = false } = {}) => {
    if (index === activeApp && !force) return;
    const direction = index > activeApp ? 1 : -1;
    activeApp = index;

    appTabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });

    // Swap the node so the grow-in animation replays. The pinned bar above it
    // does not move, so switching areas never scrolls the page.
    const existing = document.getElementById('ttAppPanel');
    const panel = renderPanel(index);
    if (existing) existing.replaceWith(panel); else detailInner.appendChild(panel);

    const set = AREA_SETS[current];
    morphTo(set.figures[set.areas[index].key], current, direction);
  };

  const buildDetail = (caseIndex) => {
    detailInner.innerHTML = '';
    appTabs.length = 0;

    const bar = document.createElement('div');
    bar.className = 'tt-detail-bar';

    const head = document.createElement('div');
    head.className = 'tt-detail-head';
    const title = document.createElement('h2');
    title.className = 'tt-detail-title';
    const set = AREA_SETS[caseIndex];
    title.textContent = set ? set.heading : A.CASES[caseIndex].title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tt-close';
    close.textContent = 'Close';
    close.addEventListener('click', () => toggleDetail(false));
    head.append(title, close);
    bar.appendChild(head);

    if (!set) {
      detailInner.appendChild(bar);
      const pending = A.PENDING[caseIndex + 1];
      const wrap = document.createElement('div');
      wrap.className = 'tt-panel is-entering';
      const mark = document.createElement('p');
      mark.className = 'ab-pending-mark';
      wrap.appendChild(mark);
      mark.textContent = 'In preparation';
      pending.paragraphs.forEach((text) => {
        const para = document.createElement('p');
        para.className = 'ab-prose';
        para.innerHTML = text;
        wrap.appendChild(para);
      });
      detailInner.appendChild(wrap);
      return;
    }

    const tablist = document.createElement('div');
    tablist.className = 'tt-tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Application areas');

    set.areas.forEach((app, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tt-tab';
      tab.id = `ttAppTab${index}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'ttAppPanel');
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      tab.innerHTML = '<span class="tt-tab-name"></span>';
      tab.querySelector('.tt-tab-name').textContent = app.tab;
      tab.addEventListener('click', () => selectApp(index));
      tablist.appendChild(tab);
      appTabs.push(tab);
    });

    tablist.addEventListener('keydown', (event) => {
      const index = appTabs.indexOf(document.activeElement);
      if (index === -1) return;
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % appTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + appTabs.length) % appTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = appTabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        selectApp(next);
        appTabs[next].focus();
      }
    });

    bar.appendChild(tablist);
    detailInner.appendChild(bar);

    activeApp = -1;
    selectApp(0, { force: true });
  };

  function toggleDetail(open) {
    detailOpen = open;
    root.classList.toggle('is-open', open);
    detail.setAttribute('aria-hidden', String(!open));
    moreBtn.setAttribute('aria-expanded', String(open));

    if (open) {
      buildDetail(current);
    } else {
      morphTo(CASE_FIGURES[current], current, -1);
      moreBtn.focus();
    }
    start();
  }

  moreBtn.addEventListener('click', () => toggleDetail(!detailOpen));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && detailOpen) toggleDetail(false);
  });

  /* ---------------------------------------
     Cases
     --------------------------------------- */

  const tabs = [];

  const paint = (index) => {
    const item = A.CASES[index];
    titleEl.textContent = item.title;
    bodyEl.innerHTML = item.body;
  };

  function select(index) {
    if (index === current) return;
    const direction = (((index - current) % 3) + 3) % 3 === 2 ? -1 : 1;

    current = index;
    scope.dataset.channel = String(index + 1);
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });

    paint(index);
    morphTo(CASE_FIGURES[index], index, direction);
    if (detailOpen) buildDetail(index);
  }

  // Hovering is the primary way to move between cases on a pointer device.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let hoverTimer = 0;

  A.CASES.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tt-rail-item' + (index === 0 ? ' is-active' : '');
    button.id = `ttTab${item.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    button.dataset.channel = String(item.id);
    button.innerHTML = `<span class="tt-rail-num">${item.numeral}</span>`
      + `<span class="tt-rail-name"></span>`;
    button.querySelector('.tt-rail-name').textContent = item.short;

    button.addEventListener('click', () => select(index));
    button.addEventListener('focus', () => select(index));

    if (canHover) {
      button.addEventListener('pointerenter', () => {
        // A short delay so sweeping the cursor across the rail does not fire
        // every case on the way past.
        window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(() => select(index), 90);
      });
      button.addEventListener('pointerleave', () => window.clearTimeout(hoverTimer));
    }

    rail.appendChild(button);
    tabs.push(button);
  });

  rail.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      event.preventDefault();
      select(next);
      tabs[next].focus();
    }
  });

  /* ---------------------------------------
     Lifecycle
     --------------------------------------- */

  refreshChannels();
  scope.dataset.channel = '1';
  colourFrom = CHANNEL_RGB[0];
  colourTo = CHANNEL_RGB[0];
  paint(0);
  resize();

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { resize(); start(); }).observe(chamber);
  }
  window.addEventListener('resize', () => { resize(); start(); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0.02 }).observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); return; }
    resize();
    start();
  });

  new MutationObserver(() => {
    refreshChannels();
    colourFrom = CHANNEL_RGB[current];
    colourTo = CHANNEL_RGB[current];
    scope.dataset.channel = String(current + 1);
    start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  A.exposeStepper((deltaMs) => {
    if (!manual) { manual = true; stop(); virtualNow = performance.now(); lastFrame = 0; }
    virtualNow += (deltaMs || 16);
    renderFrame(virtualNow);
    return { progress: +progress.toFixed(3), current, activeApp, detailOpen, dragYaw: +dragYaw.toFixed(3) };
  });

  start();
})();
