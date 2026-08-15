/* ========================================
   BIODYN , Impact
   One figure per audience, morphing between
   them on the same turn-and-morph as the About
   page. Figures are reused deliberately: each
   audience sees the object that stands for what
   they would actually be handed.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const F = window.BiodynFigures;
  // The section carries both the nav anchor and the token scope.
  const scope = document.getElementById('impact');
  const canvas = document.getElementById('impactCanvas');
  if (!A || !F || !scope || !canvas) return;

  const ctx = canvas.getContext('2d');
  const chamber = document.getElementById('impactChamber');
  const rail = document.getElementById('impactRail');
  const panelHost = document.getElementById('impactPanel');

  const N = 900;
  const CAMERA = 3.15;
  const TURN_MS = 1100;
  const THIRD = (Math.PI * 2) / 3;
  const PITCH = [0.26, -0.14, 0.34, 0.1];

  const FIGURES = F.build(N);
  const AUDIENCE_FIGURES = {
    developers: FIGURES.audits.gap,
    interpretability: FIGURES.organisms.thesis,
    biology: FIGURES.cases[2],
    biosecurity: FIGURES.audits.recoverability
  };

  let fromFigure = AUDIENCE_FIGURES[A.AUDIENCES[0].key];
  let toFigure = fromFigure;
  let progress = 1;
  let progressStart = 0;
  let turnFrom = 0;
  let turnTo = 0;
  let pitchFrom = PITCH[0];
  let pitchTo = PITCH[0];
  let rollDir = 1;
  let colourFrom = [87, 216, 234];
  let colourTo = colourFrom;

  let active = 0;
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

  const CHANNEL_RGB = {};

  const refreshChannels = () => {
    const previous = scope.dataset.channel;
    A.AUDIENCES.forEach((item) => {
      scope.dataset.channel = String(item.channel);
      CHANNEL_RGB[item.key] = A.hexToRgb(A.readVar(scope, '--ab-ch', '#57d8ea'));
    });
    scope.dataset.channel = previous || String(A.AUDIENCES[0].channel);
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

  const morphTo = (figure, rgb, channelIndex, direction) => {
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
    colourTo = rgb;
    rollDir = direction >= 0 ? 1 : -1;
    turnTo = turnFrom + THIRD * (direction || 1);
    pitchTo = PITCH[channelIndex % PITCH.length];
    progress = 0;
    progressStart = clock();
    start();
  };

  const renderFrame = (now) => {
    if (width === 0 || height === 0) return false;

    const reduced = A.prefersReducedMotion();
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;

    if (progress < 1) {
      progress = reduced ? 1 : A.clamp01((now - progressStart) / TURN_MS);
    }

    if (!dragging) {
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

  /* --- Drag to rotate --- */

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    velocityYaw = 0;
    velocityPitch = 0;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(event.pointerId);
    start();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !lastPointer) return;
    const stepYaw = (event.clientX - lastPointer.x) * 0.0072;
    const stepPitch = (event.clientY - lastPointer.y) * 0.0058;
    lastPointer = { x: event.clientX, y: event.clientY };
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
    if (event.key === 'ArrowLeft') dragYaw -= step;
    else if (event.key === 'ArrowRight') dragYaw += step;
    else if (event.key === 'ArrowUp') dragPitch -= step;
    else if (event.key === 'ArrowDown') dragPitch += step;
    else return;
    event.preventDefault();
    start();
  });

  /* --- Audiences --- */

  const makeRefs = (links) => {
    const ul = document.createElement('ul');
    ul.className = 'ab-refs';
    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.url;
      if (/^https?:/.test(link.url)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      a.textContent = link.title;
      const venue = document.createElement('span');
      venue.className = 'ab-venue';
      venue.textContent = link.venue;
      li.append(a, venue);
      ul.appendChild(li);
    });
    return ul;
  };

  const tabs = [];

  const renderPanel = (index) => {
    const item = A.AUDIENCES[index];
    const panel = document.createElement('div');
    panel.className = 'im-panel is-entering';
    panel.id = 'impactPanelBody';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `impactTab${index}`);

    const title = document.createElement('h3');
    title.className = 'im-panel-title';
    title.textContent = item.title;

    const body = document.createElement('p');
    body.className = 'im-panel-body';
    body.textContent = item.body;

    panel.append(title, body, makeRefs(item.links));
    return panel;
  };

  const select = (index, { force = false } = {}) => {
    if (index === active && !force) return;
    const direction = index > active ? 1 : -1;
    active = index;
    const item = A.AUDIENCES[index];

    scope.dataset.channel = String(item.channel);
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });

    const existing = document.getElementById('impactPanelBody');
    const panel = renderPanel(index);
    if (existing) existing.replaceWith(panel); else panelHost.appendChild(panel);

    morphTo(AUDIENCE_FIGURES[item.key], CHANNEL_RGB[item.key], item.channel - 1, direction);
  };

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let hoverTimer = 0;

  A.AUDIENCES.forEach((item, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'im-rail-item' + (index === 0 ? ' is-active' : '');
    tab.id = `impactTab${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.setAttribute('aria-controls', 'impactPanelBody');
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.dataset.channel = String(item.channel);
    tab.textContent = item.tab;

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

  /* --- Lifecycle --- */

  refreshChannels();
  colourFrom = CHANNEL_RGB[A.AUDIENCES[0].key];
  colourTo = colourFrom;
  scope.dataset.channel = String(A.AUDIENCES[0].channel);
  active = -1;
  select(0, { force: true });
  progress = 1;
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
  } else {
    inView = true;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); return; }
    resize();
    start();
  });

  new MutationObserver(() => {
    refreshChannels();
    const item = A.AUDIENCES[active];
    colourFrom = CHANNEL_RGB[item.key];
    colourTo = colourFrom;
    start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  A.exposeStepper((deltaMs) => {
    if (!manual) { manual = true; stop(); inView = true; virtualNow = performance.now(); lastFrame = 0; }
    virtualNow += (deltaMs || 16);
    renderFrame(virtualNow);
    return { progress: +progress.toFixed(3), active, channel: scope.dataset.channel };
  });

  start();
})();
