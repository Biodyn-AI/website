/* ========================================
   BIODYN , Margin figure placement
   Which specimen stands in which margin, and
   what each pair is meant to say.
   ======================================== */

(() => {
  'use strict';

  const M = window.BiodynMarginShapes;
  const F = window.BiodynFigures;
  const mounts = window.BiodynMargins;
  if (!M || !F || !mounts) return;

  const cases = F.build(900).cases;

  const PLAN = [
    /* The hero had three case figures floating in its margins. They are the
       About section's own figures, so the opening screen was previewing its
       next screen; the neural field replaced them. */
    {
      id: 'research',
      shapes: [
        // Four strands woven together, and four hubs each linked to the rest.
        { figure: M.braid(), channel: 1, x: 0.075, y: 0.5, reach: 0.115, spin: 0.14, pitch: 0.1, yaw: 0.2 },
        { figure: M.tetra(), channel: 3, x: 0.925, y: 0.5, reach: 0.105, spin: -0.13, pitch: 0.25, yaw: 0.5 }
      ]
    },
    {
      id: 'atlases',
      shapes: [
        // A sparse code: a few coefficients carrying it. And a mapped surface.
        { figure: M.sparseCode(), channel: 3, x: 0.075, y: 0.48, reach: 0.11, spin: 0.11, pitch: 0.08, yaw: 0.15 },
        { figure: M.mappedSurface(), channel: 1, x: 0.925, y: 0.52, reach: 0.105, spin: -0.12, pitch: 0.3, yaw: 0.4 }
      ]
    },
    {
      id: 'publications',
      shapes: [
        // A stack of papers, and what cites what.
        { figure: M.plates(), channel: 4, x: 0.072, y: 0.46, reach: 0.105, spin: 0.1, pitch: 0.34, yaw: 0.3 },
        { figure: M.citations(), channel: 1, x: 0.928, y: 0.54, reach: 0.11, spin: -0.11, pitch: 0.12, yaw: 0.1 }
      ]
    },
    {
      id: 'collaborations',
      shapes: [
        // Two groups with a few links that actually cross, and linked rings.
        { figure: M.bridged(), channel: 2, x: 0.07, y: 0.42, reach: 0.11, spin: 0.12, pitch: 0.18, yaw: 0.25 },
        { figure: M.linkedRings(), channel: 4, x: 0.93, y: 0.58, reach: 0.105, spin: -0.14, pitch: 0.22, yaw: 0.6 }
      ]
    },
    {
      id: 'team',
      shapes: [
        // Separate orbits, and the centre they share.
        { figure: M.constellation(), channel: 1, x: 0.075, y: 0.5, reach: 0.115, spin: 0.1, pitch: 0.24, yaw: 0.2 },
        { figure: M.sharedCentre(), channel: 3, x: 0.925, y: 0.5, reach: 0.1, spin: -0.12, pitch: 0.2, yaw: 0.45 }
      ]
    }
  ];

  PLAN.forEach((entry) => {
    const section = document.getElementById(entry.id);
    if (section) mounts.mount(section, entry.shapes, entry.enter);
  });
})();
