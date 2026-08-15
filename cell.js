/* ========================================
   BIODYN, Hero cell
   One figure instead of three. The three case
   figures moved down into the About section, so
   the hero was previewing its own next screen.

   This renders a eukaryotic cell as a point cloud
   with a skeleton graph over it, in the same
   visual language as the About figures but at
   roughly nine times the point budget, which is
   what buys the organelle detail.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  if (!A) return;

  const root = document.querySelector('[data-cell-root]');
  if (!root) return;
  const canvas = root.querySelector('.cl-canvas');
  if (!canvas || !canvas.getContext) return;

  /* The renderer is not specific to the cell. A page names the geometry module
     it wants; the cell page names nothing and gets the cell. */
  const C = window[root.dataset.figureModule || 'BiodynCell'];
  if (!C) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const scope = root.closest('.ab-scope') || document.body;

  const CAMERA = 3.15;
  /* Depth bands for the skeleton stroke. Four is enough to separate front from
     back without turning one stroke call into four thousand. */
  const BANDS = 4;
  let edgeBand = null;
  /* Points converge from scattered positions rather than zooming in, staggered
     from the inside out so the nucleus forms first and the membrane closes
     around it last. */
  const ENTER_MS = 2400;
  const ENTER_STAGGER = 1100;
  const ENTER_DRIFT = 1.0;

  const reduced = A.prefersReducedMotion();

  /* Point budget. Sorting and blitting are both linear in N and this runs on
     the first screen, so it is worth scaling down where it will not show. */
  const budgetFor = (w) => {
    if (w < 380) return 3200;
    if (w < 560) return 4600;
    return 5600;
  };

  let N = 0;
  let figure = null;
  let sx = null;
  let sy = null;
  let ss = null;
  let sa = null;
  let depth = null;
  let order = null;
  let enterDelay = null;
  let startOffset = null;
  const vec = [0, 0, 0];
  const nrm = [0, 0, 0];

  const buildFigure = (n) => {
    figure = C.build(n);
    /* The geometry refuses to drop organelles, so it may hand back more points
       than were asked for. Trust what it returns, not what was requested. */
    N = figure.n;
    n = N;
    sx = new Float32Array(n);
    sy = new Float32Array(n);
    ss = new Float32Array(n);
    sa = new Float32Array(n);
    depth = new Float32Array(n);
    order = new Int32Array(n);
    enterDelay = new Float32Array(n);
    startOffset = new Float32Array(n * 3);
    edgeBand = new Uint8Array((figure.edges.length >> 1) + 1);

    /* Every point gets its own scattered start, so the figure assembles out of
       a cloud arriving from all sides. Scaling the whole cloud in from a
       larger copy of itself, which is what this did before, just reads as a
       zoom: the shape is already there the whole time. */
    const scatter = A.makeRandom(4242);
    for (let i = 0; i < n; i += 1) {
      const u = scatter() * 2 - 1;
      const a = scatter() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      const reach = 0.42 + scatter() * 1.15;
      startOffset[i * 3] = Math.cos(a) * s * reach;
      startOffset[i * 3 + 1] = u * reach;
      startOffset[i * 3 + 2] = Math.sin(a) * s * reach;
    }

    /* Assemble from the inside out: nucleus first, organelles next, membrane
       last. A uniform fade in would read as a single object appearing, which
       throws away the fact that this thing has parts. */
    let maxR = 0;
    for (let i = 0; i < n; i += 1) {
      const r = Math.hypot(
        figure.pos[i * 3],
        figure.pos[i * 3 + 1],
        figure.pos[i * 3 + 2]
      );
      depth[i] = r;
      if (r > maxR) maxR = r;
    }
    for (let i = 0; i < n; i += 1) {
      enterDelay[i] = maxR > 0 ? (depth[i] / maxR) * ENTER_STAGGER : 0;
    }
  };

  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const wanted = budgetFor(width);
    if (wanted !== N) buildFigure(wanted);
  };

  /* ---------------------------------------
     Motion state
     --------------------------------------- */

  let spin = 0;
  let pitch = -0.22;
  let dragYaw = 0;
  let dragPitch = 0;
  let velocityYaw = 0;
  let velocityPitch = 0;
  let dragging = false;
  let lastPointer = null;

  let entered = 0;
  let lastFrame = 0;
  let running = false;
  let frameHandle = 0;
  let inView = false;

  let manual = false;
  let virtualNow = 0;
  let palette = null;
  let paletteDirty = true;

  const easeEnter = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

  const renderFrame = (now) => {
    if (width === 0 || height === 0) return false;
    const delta = lastFrame ? Math.min(64, now - lastFrame) : 16;
    lastFrame = now;

    if (entered < 1) {
      entered = Math.min(1, entered + delta / (ENTER_MS + ENTER_STAGGER));
    }

    if (!dragging) {
      dragYaw += velocityYaw;
      dragPitch += velocityPitch;
      velocityYaw *= 0.94;
      velocityPitch *= 0.94;
      if (Math.abs(velocityYaw) < 0.00002) velocityYaw = 0;
      if (Math.abs(velocityPitch) < 0.00002) velocityPitch = 0;
      if (!reduced) spin += delta * 0.000055;
    }

    dragPitch = Math.max(-0.75, Math.min(0.75, dragPitch));

    /* readVar goes through getComputedStyle, which forces a style recalculation.
       Once a frame for sixty frames a second was costing several times more
       than drawing the cell. The accent only changes with the theme, and the
       theme is already observed. */
    const brightfield = A.isBrightfield();
    if (!palette || palette.brightfield !== brightfield || paletteDirty) {
      /* Organelles are grouped by what they do rather than given a colour
         each: the nucleus, the powerhouse, the secretory route, and everything
         structural. Four hues the site already uses, made to mean something,
         instead of a colour per part. */
      const rgbNow = A.hexToRgb(A.readVar(scope, '--ab-ch1', '#57d8ea'));
      palette = {
        brightfield,
        rgb: rgbNow,
        sprites: [
          A.getSprite(rgbNow, brightfield),
          A.getSprite(rgbNow, brightfield),
          A.getSprite(A.hexToRgb(A.readVar(scope, '--ab-ch2', '#e26bb0')), brightfield),
          A.getSprite(A.hexToRgb(A.readVar(scope, '--ab-ch3', '#6fdfa4')), brightfield),
          A.getSprite(A.hexToRgb(A.readVar(scope, '--ab-ch4', '#a78bfa')), brightfield)
        ],
        stroke: `${rgbNow[0] | 0},${rgbNow[1] | 0},${rgbNow[2] | 0}`
      };
      paletteDirty = false;
    }
    const rgb = palette.rgb;
    const sprites = palette.sprites;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = brightfield ? 'source-over' : 'lighter';

    const yaw = spin + dragYaw;
    const totalPitch = pitch + dragPitch;
    const cxPix = width / 2;
    const cyPix = height / 2;
    const span = Math.min(width, height);
    /* A figure that knows its own proportions gets sized to fill the canvas in
       both axes. Scaling off the smaller side, which is all you can do without
       that, leaves a tall figure floating in a wide empty box. */
    let focal;
    if (figure.halfExtent) {
      const hx = Math.max(figure.halfExtent[0], 0.02);
      const hy = Math.max(figure.halfExtent[1], 0.02);
      /* How much of the frame the figure is allowed to claim. A figure whose
         extremities matter, like a dendritic tree, wants to stop short of the
         edge fade instead of dissolving into it. */
      const claim = figure.fill || 0.455;
      focal = CAMERA * Math.min(width * claim / hx, height * claim / hy);
    } else {
      focal = span * 1.3;
    }
    /* Dot size follows the whole figure's projected size, which is right when
       the figure is one object and wrong when it is a scene. In a field of
       small neurons a dot sized for the field is a tenth of a neuron, and the
       result is a blur, so a figure can say how big its detail actually is. */
    const unit = focal * 0.00323 * (figure.dotScale || 1);

    const margin = span * 0.11;
    const halfWidth = width * 0.5;
    const corridorHalf = figure.corridor || 0;
    const corridorFloor = figure.corridorFloor === undefined ? 0.05 : figure.corridorFloor;
    const bridge = figure.bridge;
    const elapsed = entered * (ENTER_MS + ENTER_STAGGER);
    const pos = figure.pos;
    const intensity = figure.intensity;
    const normal = figure.normal;
    const shell = figure.shell;
    const hue = figure.hue;

    for (let i = 0; i < N; i += 1) {
      let local = 1;
      if (entered < 1) {
        local = (elapsed - enterDelay[i]) / ENTER_MS;
        local = local <= 0 ? 0 : (local >= 1 ? 1 : easeEnter(local));
      }

      const away = (1 - local) * ENTER_DRIFT;
      const x = pos[i * 3] + startOffset[i * 3] * away;
      const y = pos[i * 3 + 1] + startOffset[i * 3 + 1] * away;
      const z = pos[i * 3 + 2] + startOffset[i * 3 + 2] * away;

      A.rotate(x, y, z, yaw, totalPitch, 0, vec);
      const persp = focal / (CAMERA + vec[2]);
      sx[i] = cxPix + vec[0] * persp;
      sy[i] = cyPix - vec[1] * persp;
      depth[i] = vec[2];

      /* Depth is doing the work the About figures never needed it to. Those
         are flat specimens; a cell is a solid, so without a hard front-to-back
         falloff the far hemisphere prints straight through the near one and
         every organelle is drawn twice. */
      const near = 1 - (vec[2] + 1.2) / 2.6;
      const shade = near * near;
      let raw = intensity[i];

      /* Limb brightening. A closed surface made of points draws its front
         face, its rim and its back face into the same disc, so it reads as a
         filled blob and never as a boundary. Real membranes are brightest
         where the surface turns edge-on, because that is where the line of
         sight passes through the most of it. Weighting each shell point by how
         edge-on its normal is turns the nucleus and the plasma membrane back
         into surfaces instead of clouds. */
      if (shell[i]) {
        A.rotate(normal[i * 3], normal[i * 3 + 1], normal[i * 3 + 2],
          yaw, totalPitch, 0, nrm);
        const facing = nrm[2] < 0 ? -nrm[2] : nrm[2];
        const edgeOn = 1 - facing;
        raw *= 0.20 + 1.55 * edgeOn * edgeOn;
        if (raw > 1) raw = 1;
      }
      /* A gamma on intensity, not just a multiplier: it widens the gap between
         the structure that names an organelle and the material around it,
         which is what was missing when everything competed at once. */
      const inten = raw * raw * (3 - 2 * raw);
      ss[i] = unit * (0.45 + inten * 1.05) * (persp / (focal / CAMERA));

      /* Points scattered for the entrance land outside the canvas and get
         clipped by its edge, which draws the box the figure sits in. Fading
         them out across a band at the border means there is no edge to see. */
      let fade = 1;
      const ex = sx[i] < width - sx[i] ? sx[i] : width - sx[i];
      const ey = sy[i] < height - sy[i] ? sy[i] : height - sy[i];
      const edge = ex < ey ? ex : ey;
      if (edge < margin) fade = edge <= 0 ? 0 : edge / margin;

      /* A figure that sits behind type can ask for a corridor down the middle
         of the frame. It is applied here, to the projected position, because
         the figure rotates: measured in the geometry it would turn away with
         everything else and stop protecting anything. */
      if (corridorHalf > 0) {
        const nx = Math.abs((sx[i] - cxPix) / halfWidth);
        let quiet = nx >= corridorHalf
          ? 1
          : corridorFloor + (1 - corridorFloor) * Math.pow(nx / corridorHalf, 2.6);
        if (bridge && bridge[i] && quiet < 0.5) quiet = 0.5;
        fade *= quiet;
      }

      sa[i] = Math.max(0, Math.min(1, inten * (0.05 + shade * 0.95) * local * fade));
      order[i] = i;
    }

    order.sort((p, q) => depth[q] - depth[p]);

    /* Skeleton under the dots, so the wiring reads as drawn rather than as an
       artefact of dense sampling. */
    /* Edges join points that have not arrived yet, so during the entrance they
       read as a random web rather than as wiring. They fade in only once the
       cloud has mostly landed. */
    if (figure.edges && entered > 0.62) {
      const edges = figure.edges;
      const weight = Math.min(1, (entered - 0.62) / 0.3);
      const peak = brightfield ? 0.34 : 0.2;
      ctx.lineWidth = 1;
      /* Band assignment once into a scratch array, then one cheap filtered
         pass per band. Path2D objects were tried here and were slower than the
         context's own path, allocation included. */
      const edgeCount = edges.length >> 1;
      for (let e = 0; e < edgeCount; e += 1) {
        const mid = (depth[edges[e * 2]] + depth[edges[e * 2 + 1]]) * 0.5;
        const nd = 1 - (mid + 1.2) / 2.6;
        let bucket = (nd * BANDS) | 0;
        bucket = bucket < 0 ? 0 : (bucket >= BANDS ? BANDS - 1 : bucket);
        edgeBand[e] = bucket;
      }
      for (let band = 0; band < BANDS; band += 1) {
        const t = (band + 0.5) / BANDS;
        ctx.strokeStyle = `rgba(${palette.stroke},${peak * t * t * weight})`;
        ctx.beginPath();
        for (let e = 0; e < edgeCount; e += 1) {
          if (edgeBand[e] !== band) continue;
          const a = edges[e * 2];
          const b = edges[e * 2 + 1];
          /* Stroke alpha is global, so dimming points does nothing for lines.
             Inside the corridor the line is dropped and only its dimmed points
             remain, unless it is one of the crossings, which belong there. */
          if (corridorHalf > 0 && !(bridge && (bridge[a] || bridge[b]))) {
            const mx = Math.abs(((sx[a] + sx[b]) * 0.5 - cxPix) / halfWidth);
            if (mx < corridorHalf * 0.94) continue;
          }
          ctx.moveTo(sx[a], sy[a]);
          ctx.lineTo(sx[b], sy[b]);
        }
        ctx.stroke();
      }
    }

    for (let k = 0; k < N; k += 1) {
      const i = order[k];
      if (sa[i] <= 0.012 || ss[i] <= 0.04) continue;
      ctx.globalAlpha = brightfield ? sa[i] * 1.15 : sa[i];
      const d = ss[i] * 3.4;
      ctx.drawImage(sprites[hue[i]], sx[i] - d / 2, sy[i] - d / 2, d, d);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    return !reduced || entered < 1 || velocityYaw !== 0 || velocityPitch !== 0;
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
    /* A hidden page never fires rAF, so paint the settled figure once instead
       of leaving a blank canvas behind. */
    if (document.hidden) {
      entered = 1;
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
    canvas.setPointerCapture(event.pointerId);
    start();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !lastPointer) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    const stepYaw = dx * 0.0072;
    const stepPitch = dy * 0.0045;
    dragYaw += stepYaw;
    dragPitch += stepPitch;
    velocityYaw = stepYaw * 0.55;
    velocityPitch = stepPitch * 0.55;
    start();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    lastPointer = null;
    canvas.classList.remove('is-dragging');
    start();
  };

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  canvas.addEventListener('keydown', (event) => {
    const step = 0.14;
    if (event.key === 'ArrowLeft') { dragYaw -= step; event.preventDefault(); }
    else if (event.key === 'ArrowRight') { dragYaw += step; event.preventDefault(); }
    else if (event.key === 'ArrowUp') { dragPitch -= step * 0.6; event.preventDefault(); }
    else if (event.key === 'ArrowDown') { dragPitch += step * 0.6; event.preventDefault(); }
    else return;
    start();
  });

  /* ---------------------------------------
     Lifecycle
     --------------------------------------- */

  resize();

  /* A figure can ask to start part-turned. The field wants the biological half
     tilted toward the reader at load: the spin carries +x away from the
     camera, so without an offset the neurons begin their run by receding. Set
     once, not on every rebuild, or a resize would jump the rotation. */
  if (figure && figure.startYaw) spin = figure.startYaw;

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { resize(); start(); }).observe(canvas);
  }
  window.addEventListener('resize', () => { resize(); start(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting;
        if (inView) start(); else stop();
      });
    }, { threshold: 0.05 }).observe(canvas);
  } else {
    inView = true;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  const themeObserver = new MutationObserver(() => { paletteDirty = true; start(); });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  inView = true;
  start();

  A.exposeStepper((deltaMs) => {
    manual = true;
    /* A hidden page settles the entrance on the first frame, which is right in
       a background tab and useless for inspecting the entrance. A negative
       step rewinds it. */
    if (deltaMs < 0) {
      entered = 0;
      lastFrame = 0;
      virtualNow = 0;
      renderFrame(0);
      return { entered: 0, n: N, dragYaw: +dragYaw.toFixed(3), spin: +spin.toFixed(3) };
    }
    virtualNow += deltaMs || 16;
    renderFrame(virtualNow);
    return { entered: +entered.toFixed(3), n: N, dragYaw: +dragYaw.toFixed(3), spin: +spin.toFixed(3) };
  });
})();
