/* ========================================
   BIODYN , Margin figures
   Every section on the main page has empty
   margins. Each one gets a pair of specimens
   that says what the section is about, turning
   on their own and grabbable by hand.

   One renderer, mounted per section.
   ======================================== */

(() => {
  'use strict';

  const A = window.BiodynAbout;
  const M = window.BiodynMarginShapes;
  if (!A || !M) return;

  const CAMERA = 3.15;

  /* A cubic ease-in-out is almost flat for its first quarter, which reads as a
     pause before anything happens. A raised cosine starts moving immediately
     and still settles softly. */
  const easeEnter = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

  const mount = (section, shapes, options) => {
    const opts = options || {};
    const enterMs = opts.enterMs || 1800;
    const enterStagger = opts.enterStagger === undefined ? 260 : opts.enterStagger;
    const enterDrift = opts.enterDrift || 1.4;
    const canvas = document.createElement('canvas');
    canvas.className = 'mg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    section.insertBefore(canvas, section.firstChild);
    section.classList.add('mg-host');

    const ctx = canvas.getContext('2d');
    const N = M.N;

    shapes.forEach((shape, i) => {
      shape.yaw = shape.yaw || 0;
      shape.dragYaw = 0;
      shape.dragPitch = 0;
      shape.velocity = 0;
      shape.velocityPitch = 0;
      shape.enterDelay = i * enterStagger;
      shape.cx = 0;
      shape.cy = 0;
      shape.radius = 0;
      shape.rgb = [120, 200, 220];
    });

    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = false;
    let inView = false;
    let frameHandle = 0;
    let lastFrame = 0;
    let entered = false;
    let enterStart = 0;

    let manual = false;
    let virtualNow = 0;

    const order = new Array(N);
    const depth = new Float32Array(N);
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const ss = new Float32Array(N);
    const sa = new Float32Array(N);
    const vec = [0, 0, 0];

    const colourFor = (channel) => {
      const previous = section.dataset.mgChannel;
      section.dataset.mgChannel = String(channel);
      const rgb = A.hexToRgb(A.readVar(section, '--ab-ch', '#57d8ea'));
      if (previous) section.dataset.mgChannel = previous;
      else delete section.dataset.mgChannel;
      return rgb;
    };

    const refreshColours = () => shapes.forEach((s) => { s.rgb = colourFor(s.channel); });

    const resize = () => {
      const rect = section.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const span = Math.min(width, Math.max(height, 420));
      shapes.forEach((s) => {
        s.cx = width * s.x;
        s.cy = height * s.y;
        s.radius = span * s.reach;
      });
    };

    const drawShape = (shape, dt, reduced, brightfield, now) => {
      // Entrance: drift in from the outer edge and fade up.
      let enter = 1;
      if (!reduced && enterStart) {
        enter = easeEnter(A.clamp01((now - enterStart - shape.enterDelay) / enterMs));
      }
      if (enter <= 0.001) return;
      const drift = (1 - enter) * (shape.x < 0.5 ? -1 : 1) * shape.radius * enterDrift;

      if (!shape.dragging) {
        shape.dragYaw += shape.velocity;
        shape.dragPitch += shape.velocityPitch;
        shape.velocity *= 0.94;
        shape.velocityPitch *= 0.94;
        if (Math.abs(shape.velocity) < 0.00002) shape.velocity = 0;
        if (Math.abs(shape.velocityPitch) < 0.00002) shape.velocityPitch = 0;
        if (!reduced) shape.yaw += dt * shape.spin;
      }
      shape.dragPitch = Math.max(-1.1, Math.min(1.1, shape.dragPitch));

      const figure = shape.figure;
      const rgb = shape.rgb;
      const sprite = A.getSprite(rgb, brightfield);
      const focal = shape.radius * 3.9;
      const unit = shape.radius * 0.0145;
      const yaw = shape.yaw + shape.dragYaw;
      const pitch = (shape.pitch || 0) + shape.dragPitch;
      const cx = shape.cx + drift;

      for (let i = 0; i < N; i += 1) {
        A.rotate(figure.pos[i * 3], figure.pos[i * 3 + 1], figure.pos[i * 3 + 2], yaw, pitch, 0, vec);
        const persp = focal / (CAMERA + vec[2]);
        sx[i] = cx + vec[0] * persp;
        sy[i] = shape.cy - vec[1] * persp;
        depth[i] = vec[2];
        const near = 1 - (vec[2] + 1.2) / 2.6;
        const inten = figure.intensity[i];
        ss[i] = unit * (0.55 + inten * 0.85) * (persp / (focal / CAMERA));
        // Quiet on purpose: this is margin, not subject.
        sa[i] = Math.max(0, Math.min(1, inten * (0.13 + near * 0.3))) * enter;
        order[i] = i;
      }

      order.sort((p, q) => depth[q] - depth[p]);

      if (figure.edges) {
        ctx.lineWidth = 1;
        const base = (brightfield ? 0.14 : 0.09) * enter;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${base})`;
        ctx.beginPath();
        for (let e = 0; e < figure.edges.length; e += 2) {
          ctx.moveTo(sx[figure.edges[e]], sy[figure.edges[e]]);
          ctx.lineTo(sx[figure.edges[e + 1]], sy[figure.edges[e + 1]]);
        }
        ctx.stroke();
      }

      for (let k = 0; k < N; k += 1) {
        const i = order[k];
        if (ss[i] <= 0.05) continue;
        ctx.globalAlpha = brightfield ? sa[i] * 1.1 : sa[i];
        const d = ss[i] * 3.4;
        ctx.drawImage(sprite, sx[i] - d / 2, sy[i] - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };

    const renderFrame = (now) => {
      if (width === 0 || height === 0) return false;
      const reduced = A.prefersReducedMotion();
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;

      const brightfield = A.isBrightfield();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = brightfield ? 'source-over' : 'lighter';
      shapes.forEach((s) => drawShape(s, dt, reduced, brightfield, now));
      ctx.globalCompositeOperation = 'source-over';

      const entering = enterStart
        && (now - enterStart) < enterMs + shapes.length * enterStagger + 200;
      return !reduced || entering || shapes.some((s) => s.velocity !== 0 || s.velocityPitch !== 0);
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
      if (document.hidden) { lastFrame = 0; renderFrame(performance.now()); return; }
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

    /* Grab a specimen, not the page. */
    const shapeAt = (event) => {
      const rect = section.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return shapes.find((s) => Math.hypot(x - s.cx, y - s.cy) <= s.radius * 1.15) || null;
    };

    let active = null;
    let lastPointer = null;

    section.addEventListener('pointerdown', (event) => {
      const shape = shapeAt(event);
      if (!shape) return;
      active = shape;
      shape.dragging = true;
      shape.velocity = 0;
      shape.velocityPitch = 0;
      lastPointer = { x: event.clientX, y: event.clientY };
      section.classList.add('is-turning-figure');
      start();
    });

    section.addEventListener('pointermove', (event) => {
      if (!active) {
        section.classList.toggle('is-over-figure', !!shapeAt(event));
        return;
      }
      const stepYaw = (event.clientX - lastPointer.x) * 0.009;
      const stepPitch = (event.clientY - lastPointer.y) * 0.007;
      lastPointer = { x: event.clientX, y: event.clientY };
      active.dragYaw += stepYaw;
      active.dragPitch += stepPitch;
      active.velocity = stepYaw * 0.55;
      active.velocityPitch = stepPitch * 0.55;
      start();
    });

    const release = () => {
      if (!active) return;
      active.dragging = false;
      active = null;
      lastPointer = null;
      section.classList.remove('is-turning-figure');
      start();
    };

    section.addEventListener('pointerup', release);
    section.addEventListener('pointercancel', release);
    section.addEventListener('pointerleave', () => {
      release();
      section.classList.remove('is-over-figure');
    });

    refreshColours();
    resize();

    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); start(); }).observe(section);
    window.addEventListener('resize', () => { resize(); start(); }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        // The entrance runs the first time the section is actually looked at.
        if (inView && !entered) { entered = true; enterStart = manual ? virtualNow : performance.now(); }
        if (inView) start(); else stop();
      }, { threshold: 0.02 }).observe(section);
    } else {
      inView = true;
      entered = true;
      enterStart = performance.now();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stop(); return; }
      resize();
      start();
    });

    new MutationObserver(() => { refreshColours(); start(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    A.exposeStepper((deltaMs) => {
      if (!manual) {
        manual = true;
        stop();
        inView = true;
        virtualNow = performance.now();
        if (!entered) { entered = true; enterStart = virtualNow; }
        lastFrame = 0;
      }
      virtualNow += (deltaMs || 16);
      renderFrame(virtualNow);
      return { section: section.id, shapes: shapes.length };
    });

    start();
  };

  window.BiodynMargins = { mount };
})();
