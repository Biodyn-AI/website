/* ========================================
   BIODYN , The loop
   Five stages on a ring that genuinely closes:
   automation frees the capacity that starts the
   next round of discovery. Selecting a stage
   turns the ring to face it; a pulse runs the
   loop continuously so the direction is legible.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const scope = document.getElementById('methodology');
  const canvas = document.getElementById('cycleCanvas');
  const rail = document.getElementById('cycleRail');
  const panelHost = document.getElementById('cyclePanel');
  if (!A || !scope || !canvas || !rail) return;

  const STAGES = [
    {
      name: 'Discover',
      title: 'Find something worth testing',
      body: 'Scan models, datasets and literature for structure that looks real and is not yet '
        + 'accounted for. Most of what turns up at this stage is a correlation with a compute bill '
        + 'attached; the job is to state it as a claim precise enough that the next stage can kill it.'
    },
    {
      name: 'Stress test',
      title: 'Try hard to break it',
      body: 'Covariate-matched permutation nulls, expression-matched controls, depth-only baselines, '
        + 'and the obvious alternative explanations run before the interesting one. A finding that has '
        + 'not survived a deliberate attempt to destroy it is not a finding yet.'
    },
    {
      name: 'Replicate',
      title: 'See how far it generalises',
      body: 'Another dataset, another model, another donor cohort, sometimes another species. '
        + 'Donor-disjoint splits by default. This is where most surviving claims narrow to something '
        + 'smaller and truer than what was originally proposed.'
    },
    {
      name: 'Scale',
      title: 'Run the exhaustive version',
      body: 'Once a method holds, stop sampling. Ablate every head, sweep every layer, screen hundreds '
        + 'of hypotheses rather than arguing about which three to try. On models this size the '
        + 'exhaustive experiment is affordable, so it is the one worth running.'
    },
    {
      name: 'Automate',
      title: 'Make it cost nothing next time',
      body: 'Whatever survived becomes a pinned pipeline, a reusable command, an agent skill. The point '
        + 'is not tidiness: it is that automating a settled step frees the capacity that starts the '
        + 'next round of discovery, which is what closes this loop rather than ending it.'
    }
  ];

  const ctx = canvas.getContext('2d');
  const chamber = document.getElementById('cycleChamber');
  const COUNT = STAGES.length;
  const TAU = Math.PI * 2;
  const CAMERA = 3.3;
  const TURN_MS = 900;
  const RING_POINTS = 340;
  const STATION_POINTS = 34;
  const N = RING_POINTS + COUNT * STATION_POINTS;

  /* Ring path plus a cluster at each station. */
  const pos = new Float32Array(N * 3);
  const base = new Float32Array(N);
  const phaseOf = new Float32Array(N);
  const stationOf = new Int8Array(N);
  {
    const rand = A.makeRandom(2468);
    for (let i = 0; i < RING_POINTS; i += 1) {
      const t = i / RING_POINTS;
      const a = t * TAU;
      pos[i * 3] = Math.cos(a) * 0.95 + A.gaussian(rand) * 0.012;
      pos[i * 3 + 1] = A.gaussian(rand) * 0.012;
      pos[i * 3 + 2] = Math.sin(a) * 0.95 + A.gaussian(rand) * 0.012;
      base[i] = 0.24;
      phaseOf[i] = t;
      stationOf[i] = -1;
    }
    for (let s = 0; s < COUNT; s += 1) {
      const t = s / COUNT;
      const a = t * TAU;
      for (let k = 0; k < STATION_POINTS; k += 1) {
        const i = RING_POINTS + s * STATION_POINTS + k;
        pos[i * 3] = Math.cos(a) * 0.95 + A.gaussian(rand) * 0.085;
        pos[i * 3 + 1] = A.gaussian(rand) * 0.085;
        pos[i * 3 + 2] = Math.sin(a) * 0.95 + A.gaussian(rand) * 0.085;
        base[i] = 0.75;
        phaseOf[i] = t;
        stationOf[i] = s;
      }
    }
  }

  let active = 0;
  let yawFrom = 0;
  let yawTo = 0;
  let progress = 1;
  let progressStart = 0;
  let pulse = 0;
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
  let inView = false;
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

  let rgb = [87, 216, 234];
  const refreshColour = () => { rgb = A.hexToRgb(A.readVar(scope, '--ab-ch', '#57d8ea')); };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };

  const renderFrame = (now) => {
    if (width === 0 || height === 0) return false;
    const reduced = A.prefersReducedMotion();
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;

    if (progress < 1) progress = reduced ? 1 : A.clamp01((now - progressStart) / TURN_MS);
    if (!reduced && !dragging) pulse = (pulse + dt * 0.16) % 1;

    if (!dragging) {
      dragYaw += velocityYaw;
      dragPitch += velocityPitch;
      velocityYaw *= 0.94;
      velocityPitch *= 0.94;
      if (Math.abs(velocityYaw) < 0.00002) velocityYaw = 0;
      if (Math.abs(velocityPitch) < 0.00002) velocityPitch = 0;
    }
    dragPitch = Math.max(-1.0, Math.min(1.0, dragPitch));

    const yaw = yawFrom + (yawTo - yawFrom) * A.easeInOut(progress) + dragYaw;
    const pitch = 0.62 + dragPitch;

    const brightfield = A.isBrightfield();
    const sprite = A.getSprite(rgb, brightfield);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = brightfield ? 'source-over' : 'lighter';

    const cxPix = width / 2;
    const cyPix = height / 2;
    const span = Math.min(width, height);
    const focal = span * 1.5;
    const unit = span * 0.0052;

    for (let i = 0; i < N; i += 1) {
      let inten = base[i];
      // A pulse running the loop, so the direction of travel is visible.
      let d = Math.abs(phaseOf[i] - pulse);
      if (d > 0.5) d = 1 - d;
      inten += Math.max(0, 1 - d / 0.085) * 0.75;
      if (stationOf[i] >= 0) inten *= stationOf[i] === active ? 1.35 : 0.6;

      A.rotate(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], yaw, pitch, 0, vec);
      const persp = focal / (CAMERA + vec[2]);
      sx[i] = cxPix + vec[0] * persp;
      sy[i] = cyPix - vec[1] * persp;
      depth[i] = vec[2];
      const near = 1 - (vec[2] + 1.2) / 2.6;
      ss[i] = unit * (0.5 + inten * 0.8) * (persp / (focal / CAMERA));
      sa[i] = Math.max(0, Math.min(1, inten * (0.2 + near * 0.45)));
      order[i] = i;
    }

    order.sort((p, q) => depth[q] - depth[p]);
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
    if (renderFrame(now)) frameHandle = requestAnimationFrame(loop);
    else running = false;
  };

  const start = () => {
    if (!inView) return;
    if (width === 0 || height === 0) resize();
    if (manual) { renderFrame(virtualNow); return; }
    if (document.hidden) { progress = 1; lastFrame = 0; renderFrame(performance.now()); return; }
    if (running) return;
    running = true;
    lastFrame = 0;
    frameHandle = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    if (frameHandle) cancelAnimationFrame(frameHandle);
    frameHandle = 0;
  };

  /* --- Stages --- */

  const tabs = [];

  const renderPanel = (index) => {
    const stage = STAGES[index];
    const panel = document.createElement('div');
    panel.className = 'cy-panel is-entering';
    panel.id = 'cyclePanelBody';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `cycleTab${index}`);
    const h = document.createElement('h3');
    h.className = 'cy-panel-title';
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.className = 'cy-panel-body';
    p.textContent = stage.body;
    panel.append(h, p);
    return panel;
  };

  const select = (index, force) => {
    if (index === active && !force) return;
    // Turn the ring the short way to bring the chosen stage to the front.
    const settled = yawFrom + (yawTo - yawFrom) * A.easeInOut(progress);
    let delta = ((index - active) % COUNT + COUNT) % COUNT;
    if (delta > COUNT / 2) delta -= COUNT;
    yawFrom = settled;
    yawTo = settled - delta * (TAU / COUNT);
    progress = 0;
    progressStart = clock();
    active = index;

    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });

    const existing = document.getElementById('cyclePanelBody');
    const panel = renderPanel(index);
    if (existing) existing.replaceWith(panel); else panelHost.appendChild(panel);
    start();
  };

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let hoverTimer = 0;

  STAGES.forEach((stage, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'cy-stage' + (index === 0 ? ' is-active' : '');
    tab.id = `cycleTab${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'cyclePanelBody');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.innerHTML = '<span class="cy-stage-dot" aria-hidden="true"></span><span class="cy-stage-name"></span>';
    tab.querySelector('.cy-stage-name').textContent = stage.name;
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('focus', () => select(index));
    if (canHover) {
      tab.addEventListener('pointerenter', () => {
        window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(() => select(index), 90);
      });
      tab.addEventListener('pointerleave', () => window.clearTimeout(hoverTimer));
    }
    rail.appendChild(tab);
    tabs.push(tab);
  });

  rail.addEventListener('keydown', (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % COUNT;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i - 1 + COUNT) % COUNT;
    if (next !== null) { event.preventDefault(); select(next); tabs[next].focus(); }
  });

  /* --- Drag --- */

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    velocityYaw = 0; velocityPitch = 0;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
    start();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const sy_ = (e.clientX - lastPointer.x) * 0.008;
    const sp = (e.clientY - lastPointer.y) * 0.006;
    lastPointer = { x: e.clientX, y: e.clientY };
    dragYaw += sy_; dragPitch += sp;
    velocityYaw = sy_ * 0.55; velocityPitch = sp * 0.55;
    start();
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false; lastPointer = null;
    canvas.classList.remove('is-dragging');
    if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    start();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  /* --- Lifecycle --- */

  refreshColour();
  select(0, true);
  progress = 1;
  resize();

  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); start(); }).observe(chamber);
  window.addEventListener('resize', () => { resize(); start(); }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => {
      inView = e[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0.02 }).observe(canvas);
  } else inView = true;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); return; }
    resize(); start();
  });

  new MutationObserver(() => { refreshColour(); start(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  A.exposeStepper((deltaMs) => {
    if (!manual) { manual = true; stop(); inView = true; virtualNow = performance.now(); lastFrame = 0; }
    virtualNow += (deltaMs || 16);
    renderFrame(virtualNow);
    return { cycle: active, progress: +progress.toFixed(2) };
  });

  start();
})();
