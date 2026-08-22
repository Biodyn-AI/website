/* ========================================
   BIODYN, About, shared core
   Geometry, copy and paper data used by every
   version of the page. What differs between
   versions is the interaction, not the content.
   ======================================== */

(() => {
  'use strict';

  /* ---------------------------------------
     Copy
     --------------------------------------- */

  const CASES = [
    {
      id: 1,
      numeral: 'I',
      short: 'Model organisms',
      line: 'Small enough to trace exhaustively, real enough that the findings transfer.',
      title: 'Model organisms for interpretability in the wild',
      body: 'Mechanistic interpretability usually works without an answer key. Biological AI comes '
        + 'with one: perturbation screens, curated regulatory references and known pathways give you '
        + 'real ground truth to check a claim against. These models are small enough to trace '
        + 'exhaustively and real enough that people depend on the results, and the methods that '
        + 'survive here transfer, language models included.',
      channel: 'CH 01'
    },
    {
      id: 2,
      numeral: 'II',
      short: 'Capability audits',
      line: 'An audit that only reads outputs is measuring the wrong surface.',
      title: 'You cannot audit what you only read off the output',
      body: 'These models emit sequences and expression levels. Predicting those requires learning a '
        + 'great deal of biology the output format never shows, and some of that biology is '
        + 'dangerous. Fine-tuning can pull it back out. Our '
        + '<a href="https://arxiv.org/abs/2603.02952" target="_blank" rel="noopener">comparative SAE '
        + 'atlas of Geneformer and scGPT</a> shows how much organized biological knowledge sits in '
        + 'the representations. To know what a model can actually do, you have to look inside it.',
      channel: 'CH 02'
    },
    {
      id: 3,
      numeral: 'III',
      short: 'Extracting biology at scale',
      line: 'Read novel biology out of representations, then build interventions with it.',
      title: 'Extracting biology at scale, aimed at intelligence amplification',
      body: 'Alignment is bottlenecked on how many capable people work on it. '
        + '<a href="https://www.lesswrong.com/posts/zvu53dBJEwenovkE2/overview-of-some-biotech-based-adult-intelligence" '
        + 'target="_blank" rel="noopener">Biotech routes to adult intelligence amplification</a> are '
        + 'real, but blocked on biology nobody has worked out yet. Model internals are a way to '
        + '<a href="the-map-inside-the-machine.html">find that biology at scale</a>: read novel '
        + 'structure out of the representations, validate it against experiment, and turn what holds '
        + 'up into interventions.',
      channel: 'CH 03'
    }
  ];

  /* Detail content. Cases I and II are placeholders for now. */
  const PENDING = {
    1: {
      title: 'Model organisms for interpretability in the wild',
      paragraphs: [
        'This section is still being written. It will set out the ground-truth sources we rely on, '
          + 'which results have transferred to language models, and where the model-organism analogy '
          + 'breaks down.',
        'Until then, the published work is in <a href="index.html#publications">Research Outputs</a>.'
      ]
    },
    2: {
      title: 'You cannot audit what you only read off the output',
      paragraphs: [
        'This section is still being written. It will set out the threat model, what an '
          + 'internals-based capability audit actually measures, and how fine-tuning changes the '
          + 'picture.',
        'Until then, the evidence that these models carry organized biological knowledge is in '
          + '<a href="https://arxiv.org/abs/2603.02952" target="_blank" rel="noopener">our '
          + 'comparative SAE atlas of Geneformer and scGPT</a>.'
      ]
    }
  };

  /* Impact, by who is reading. Each audience gets the figure that matches
     what they would actually be handed. */
  const AUDIENCES = [
    {
      key: 'developers',
      channel: 2,
      tab: 'Model developers',
      title: 'An independent read of what your model knows',
      body: 'You ship a checkpoint with a score attached, and that score describes the one surface '
        + 'your documentation tells people to use. We measure the others: the best internal layer at '
        + 'an identical readout budget, and what a small fine-tuning budget recovers. What comes back '
        + 'is a card carrying the baseline the model has to beat, the ceiling the data actually '
        + 'allows, and the null that could have killed the result.',
      links: [
        { title: 'SONDE, the evaluation programme', venue: 'Evals', url: 'evals.html' },
        { title: 'The six rules every card is held to', venue: 'SONDE Standard', url: 'evals-standard.html' }
      ]
    },
    {
      key: 'interpretability',
      channel: 1,
      tab: 'Interpretability',
      title: 'A venue where your method can be wrong',
      body: 'Biological foundation models are small enough to trace exhaustively and arrive with '
        + 'ground truth nobody constructed for your benefit. A method that survives perturbation '
        + 'screens, donor-disjoint splits and covariate-matched nulls here has survived something a '
        + 'synthetic task cannot supply. We publish the atlases, the tooling, and the negative '
        + 'results, which are the ones that tell you the venue is real.',
      links: [
        { title: 'Real model organisms for mechanistic interpretability', venue: 'Biodyn Blog', url: 'real-model-organisms-for-interpretability.html' },
        { title: 'Open problems in biological mechanistic interpretability', venue: 'Biodyn Blog', url: '109-open-problems-biological-mechanistic-interpretability.html' },
        { title: 'Interactive SAE feature atlases', venue: 'Atlases', url: 'index.html#atlases' }
      ]
    },
    {
      key: 'biology',
      channel: 3,
      tab: 'Biology and bioinformatics',
      title: 'Use the internals, not just the predictions',
      body: 'A prediction without a mechanism is a correlation with a compute bill. We pull structure '
        + 'out of model internals and then check whether it stands on its own: a hematopoietic '
        + 'manifold exported from scGPT as a standalone algorithm that holds up against scVI, '
        + 'Palantir and DPT. Just as usefully, we publish the cases where the model adds nothing over '
        + 'PCA and the compute is not worth spending.',
      links: [
        { title: 'A performant algorithm extracted from model internals', venue: 'arXiv:2603.10261', url: 'https://arxiv.org/abs/2603.10261' },
        { title: 'When a benchmark score is already saturated', venue: 'BioSystems', url: 'https://www.sciencedirect.com/science/article/pii/S0303264726001747?dgcid=author' },
        { title: 'All published work', venue: 'Research Outputs', url: 'index.html#publications' }
      ]
    },
    {
      key: 'biosecurity',
      channel: 4,
      tab: 'Biosecurity',
      title: 'A released checkpoint is a starting point, not a fixed capability',
      body: 'These models learn biology their output format never exposes, and fine-tuning can pull '
        + 'it back out. An audit that reads only outputs is measuring the wrong surface. We measure '
        + 'the gap between the sanctioned output and the best internal layer, and how much of that '
        + 'gap a modest adversarial budget actually recovers.',
      links: [
        { title: 'Elicitation gap and recoverability', venue: 'Evals', url: 'evals.html' },
        { title: 'How much organized biology sits in the representations', venue: 'arXiv:2603.02952', url: 'https://arxiv.org/abs/2603.02952' }
      ]
    }
  ];

  /* Case I detail, why biological AI is the venue, and what has come of it. */
  const ORGANISM_AREAS = [
    {
      key: 'thesis',
      tab: 'Not toy models',
      title: 'The organism has to be able to disagree with you',
      note: 'Interpretability borrowed \u201cmodel organism\u201d from biology and kept the toy: a small '
        + 'network trained on a task built to exhibit the phenomenon you already had in mind. The '
        + 'ground truth is then yours by construction, so recovering it shows only that your method '
        + 'can find something you planted. Biological foundation models restore the part that made '
        + 'the concept work \u2014 they are real systems, doing work people depend on, checked against '
        + 'evidence nobody generated for our convenience.',
      links: [
        { title: 'Real model organisms for mechanistic interpretability', venue: 'Biodyn Blog', url: 'real-model-organisms-for-interpretability.html' },
        { title: 'Open problems in biological mechanistic interpretability', venue: 'Biodyn Blog', url: '109-open-problems-biological-mechanistic-interpretability.html' }
      ]
    },
    {
      key: 'exhaustive',
      tab: 'Traceable whole',
      title: 'Small enough that the exhaustive experiment is the one you run',
      note: 'At tens to hundreds of millions of parameters, ablating every head and running '
        + 'higher-order combinatorial sweeps is a normal experiment rather than a compute '
        + 'programme. That is how we found massive redundancy, heavy-tailed hub architecture and '
        + 'layer-dependent control of differentiation directionality \u2014 and how screening 141 '
        + 'geometric hypotheses became cheaper than arguing about which three to test.',
      links: [
        { title: 'Exhaustive circuit mapping of a single-cell foundation model', venue: 'arXiv:2603.11940', url: 'https://arxiv.org/abs/2603.11940' },
        { title: 'What structure do biological foundation models learn? Evidence from 141 hypotheses', venue: 'PLOS One', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0344826' },
        { title: 'Causal circuit tracing reveals distinct computational architectures', venue: 'Bioinformatics', url: 'https://academic.oup.com/bioinformatics/advance-article/doi/10.1093/bioinformatics/btag379/8708321' }
      ]
    },
    {
      key: 'groundtruth',
      tab: 'External ground truth',
      title: 'An answer key nobody wrote for your benefit',
      note: 'CRISPRi screens, curated regulatory references, donor structure and conservation are '
        + 'all inconvenient, and none of them were built to flatter an interpretability method. So '
        + 'claims can fail, and ours have: rich modular organisation in the representations, then '
        + 'minimal causal regulatory logic under CRISPRi; attention edge scores that encode real '
        + 'biology and still add nothing over gene-level features; perturbation claims where no '
        + 'gene survived an expression-matched null.',
      links: [
        { title: 'Organized biological knowledge but minimal regulatory logic', venue: 'arXiv:2603.02952', url: 'https://arxiv.org/abs/2603.02952' },
        { title: 'Attention-derived edge scores add no incremental value', venue: 'BMC Genomics', url: 'https://link.springer.com/article/10.1186/s12864-026-12965-8' },
        { title: 'Adversarial validation of in silico perturbation profiles', venue: 'Computational Biology and Chemistry', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1476927126002045' },
        { title: 'Partial-label metric ceilings for GRN evaluation', venue: 'BioSystems', url: 'https://www.sciencedirect.com/science/article/pii/S0303264726001747?dgcid=author' }
      ]
    },
    {
      key: 'tensor',
      tab: 'Models built to be read',
      title: 'Weight-based interpretability, by construction',
      note: 'Almost everything we can currently say about a transformer is a statement about '
        + 'activations on a distribution, carrying a silent \u201con this dataset\u201d. Tensor-network '
        + 'layers move much of the computation into structured weights instead. We are training '
        + 'tensor-network single-cell and multimodal foundation models: so far performance does not '
        + 'suffer, far more of the computation can be read off the parameters directly, and the '
        + 'representations are richer and easier to extract. This work is not published yet, so '
        + 'treat it as direction rather than result.',
      links: [
        { title: 'Tensor-transformer variants are surprisingly performant', venue: 'LessWrong', url: 'https://www.lesswrong.com/posts/hp9bvkiN3RzHgP9cq/tensor-transformer-variants-are-surprisingly-performant' },
        { title: 'Why this matters for the model-organism argument', venue: 'Biodyn Blog', url: 'real-model-organisms-for-interpretability.html' }
      ]
    }
  ];

  /* Case II detail, the SONDE evaluation programme. Every area links to the
     SONDE pages already on the site rather than restating them here. */
  const AUDIT_AREAS = [
    {
      key: 'gap',
      tab: 'Elicitation gap',
      title: 'What the model knows but will not say',
      note: 'Every task reports the same four surfaces on one held-out split: zero-shot, '
        + 'B, a fixed-capacity readout of the output the model\u2019s own documentation tells you '
        + 'to use, which is the surface every existing benchmark scores, P, the same readout at '
        + 'the same budget on the best internal layer, and F, light fine-tuning under a fixed '
        + 'budget. Because B and P are given an identical readout budget, the distance between '
        + 'them is a fact about the representation rather than about classifier size. '
        + 'Elicitation gap = P \u2212 B is the part of what a model has learned that its sanctioned '
        + 'interface never exposes.',
      links: [
        { title: 'The measurement, surface by surface', venue: 'SONDE · Evals', url: 'evals.html' },
        { title: 'Current results, with baselines, ceilings and nulls', venue: 'SONDE · Results', url: 'evals.html#evBoards' }
      ]
    },
    {
      key: 'recoverability',
      tab: 'Recoverability',
      title: 'What a modest adversary can unlock',
      note: 'Recoverability = F \u2212 B asks a different question from the elicitation gap: not what '
        + 'is latent in the representation, but how much of it a small amount of fine-tuning under '
        + 'a fixed data and step budget actually pulls into the open. That is the number a '
        + 'biosecurity audit needs, because a released checkpoint is not a fixed capability, it '
        + 'is a starting point. The surface is defined and wired into the harness; F is not yet '
        + 'populated for the reference adapters, which do not support fine-tuning, and the '
        + 'leaderboard says so in its own payload rather than leaving the column blank.',
      links: [
        { title: 'How B, P and F are measured under one budget', venue: 'SONDE · Evals', url: 'evals.html' }
      ]
    },
    {
      key: 'standard',
      tab: 'The Standard',
      title: 'Six rules, enforced by the schema rather than by review',
      note: 'Each rule comes from a published way biological benchmarks mislead, and each is '
        + 'executable rather than advisory. Beat a dumb baseline or say you did not. Report the '
        + 'ceiling the data actually allows. Report reversal risk, not a bare rank. Split '
        + 'donor-disjoint, and raise rather than silently fall back to a leaky split. Kill the '
        + 'result with a covariate-matched null first. Pin the dataset hash, checkpoint, commit '
        + 'and seed into every card. A card cannot be emitted without its controls.',
      links: [
        { title: 'The six rules and what each one refuses to do', venue: 'SONDE · Standard', url: 'evals-standard.html' }
      ]
    },
    {
      key: 'coverage',
      tab: 'Coverage',
      title: 'What is measured, and what is not yet true',
      note: 'Ten capability axes across five modalities, plus a safety battery, with a public '
        + 'record of which cells of that grid actually have cards behind them. Most do not yet. '
        + 'The reference adapters sit on the leaderboard rather than in a footnote, on the '
        + 'principle that a foundation model which cannot beat PCA on a task has not earned the '
        + 'compute. The programme publishes its own gaps in the same payload as its results.',
      links: [
        { title: 'Axis and modality coverage grid', venue: 'SONDE · Coverage', url: 'evals.html#evCoverage' },
        { title: 'What the programme does not yet support', venue: 'SONDE · Evals', url: 'evals.html' }
      ]
    }
  ];

  const APPLICATIONS = [
    {
      key: 'grn',
      tab: 'Regulatory networks',
      title: 'Gene regulatory network inference',
      note: 'Recovering regulatory structure from internals, and establishing when a recovered edge '
        + 'is real rather than an artifact of the benchmark.',
      papers: [
        {
          title: 'Residual-stream geometry of single-cell foundation models carries incremental '
            + 'gene-regulatory signal across tissues',
          venue: 'BMC Bioinformatics',
          url: 'https://link.springer.com/article/10.1186/s12859-026-06538-5'
        },
        {
          title: 'Causal intervention validation of gene regulatory signals in scGPT',
          venue: 'Journal of Biomedical Informatics',
          url: 'https://www.sciencedirect.com/science/article/pii/S1532046426001048?via%3Dihub'
        },
        {
          title: 'Three classes of confound in gene-regulatory-network inference: a systematic audit '
            + 'and open-source diagnostic toolkit',
          venue: 'Research Square',
          url: 'https://www.researchsquare.com/article/rs-8997629/v1'
        },
        {
          title: 'Partial-label metric ceilings for evaluating gene regulatory networks inferred '
            + 'from single-cell foundation models',
          venue: 'BioSystems',
          url: 'https://www.sciencedirect.com/science/article/pii/S0303264726001747?dgcid=author'
        },
        {
          title: 'Quantifying ranking instability across evaluation protocol axes in gene regulatory '
            + 'network benchmarking',
          venue: 'arXiv:2603.03493',
          url: 'https://arxiv.org/abs/2603.03493'
        },
        {
          title: 'Attention-derived edge scores add no incremental value over gene-level features '
            + 'for perturbation-target prediction',
          venue: 'BMC Genomics',
          url: 'https://link.springer.com/article/10.1186/s12864-026-12965-8'
        }
      ]
    },
    {
      key: 'longevity',
      tab: 'Longevity',
      title: 'Longevity',
      note: 'Testing whether the aging signal in frozen representations survives donor- and '
        + 'composition-aware controls.',
      papers: [
        {
          title: 'Inflammation-linked aging signals in frozen single-cell foundation models: '
            + 'donor-aware detection and robustness testing',
          venue: 'Biogerontology',
          url: 'https://link.springer.com/article/10.1007/s10522-026-10471-8'
        }
      ]
    },
    {
      key: 'neuro',
      tab: 'Neuroscience',
      title: 'Neuroscience',
      note: 'Perturbation claims about intelligence-associated genes in human prefrontal cortex, '
        + 'checked against expression-matched nulls.',
      papers: [
        {
          title: 'Adversarial validation of in silico perturbation profiles for '
            + 'intelligence-associated genes in human prefrontal cortex',
          venue: 'Computational Biology and Chemistry',
          url: 'https://www.sciencedirect.com/science/article/abs/pii/S1476927126002045'
        }
      ]
    },
    {
      key: 'cell',
      tab: 'Cell biology',
      title: 'Cell biology',
      note: 'Cell-type programs, developmental trajectories, spatial niches, and the circuits that '
        + 'control them.',
      papers: [
        {
          title: 'Discovery of a hematopoietic manifold in scGPT yields a method for extracting '
            + 'performant algorithms from biological foundation model internals',
          venue: 'arXiv:2603.10261',
          url: 'https://arxiv.org/abs/2603.10261'
        },
        {
          title: 'Exhaustive circuit mapping of a single-cell foundation model reveals massive '
            + 'redundancy, heavy-tailed hub architecture, and layer-dependent differentiation control',
          venue: 'arXiv:2603.11940',
          url: 'https://arxiv.org/abs/2603.11940'
        },
        {
          title: 'Causal circuit tracing reveals distinct computational architectures in single-cell '
            + 'foundation models',
          venue: 'Bioinformatics',
          url: 'https://academic.oup.com/bioinformatics/advance-article/doi/10.1093/bioinformatics/btag379/8708321'
        },
        {
          title: 'Sparse autoencoders reveal interpretable cell-type programs in single-cell '
            + 'foundation model representations',
          venue: 'Journal of Biomedical Informatics',
          url: 'https://www.sciencedirect.com/science/article/pii/S1532046426000808'
        },
        {
          title: 'Sparse autoencoders reveal organized biological knowledge but minimal regulatory '
            + 'logic in single-cell foundation models',
          venue: 'arXiv:2603.02952',
          url: 'https://arxiv.org/abs/2603.02952'
        },
        {
          title: 'What does “spatial” mean in a spatial foundation model? Feature-permutation '
            + 'ablation and a four-category SAE taxonomy for Novae',
          venue: 'AI Transparency Conference',
          url: 'https://openreview.net/forum?id=JPlVXdug3K'
        }
      ]
    }
  ];

  /* ---------------------------------------
     Deterministic randomness
     --------------------------------------- */

  const makeRandom = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const gaussian = (rand) => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const normalize = (v) => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  };

  /* Sized on a high percentile so one far point cannot shrink the rest. */
  const fit = (pos, n, target, percentile = 0.98) => {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let i = 0; i < n; i += 1) {
      cx += pos[i * 3];
      cy += pos[i * 3 + 1];
      cz += pos[i * 3 + 2];
    }
    cx /= n; cy /= n; cz /= n;

    const radii = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      radii[i] = Math.hypot(pos[i * 3] - cx, pos[i * 3 + 1] - cy, pos[i * 3 + 2] - cz);
    }
    const ranked = Array.from(radii).sort((p, q) => p - q);
    const reference = ranked[Math.min(n - 1, Math.floor(percentile * n))] || 0;
    const k = reference > 0 ? target / reference : 1;

    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (pos[i * 3] - cx) * k;
      pos[i * 3 + 1] = (pos[i * 3 + 1] - cy) * k;
      pos[i * 3 + 2] = (pos[i * 3 + 2] - cz) * k;
    }
  };

  /* ---------------------------------------
     I, Connectome: a small graph, fully wired
     --------------------------------------- */

  const buildConnectome = (n) => {
    const rand = makeRandom(20260814);
    const NODES = Math.min(84, Math.floor(n * 0.1));
    const CLUSTERS = 7;
    const pos = new Float32Array(n * 3);
    const intensity = new Float32Array(n);

    const centres = [];
    for (let c = 0; c < CLUSTERS; c += 1) {
      const phi = Math.acos(1 - (2 * (c + 0.5)) / CLUSTERS);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (c + 0.5);
      centres.push([
        0.66 * Math.sin(phi) * Math.cos(theta),
        0.66 * Math.cos(phi),
        0.66 * Math.sin(phi) * Math.sin(theta)
      ]);
    }

    const nodes = [];
    for (let i = 0; i < NODES; i += 1) {
      const c = centres[i % CLUSTERS];
      nodes.push([
        c[0] + gaussian(rand) * 0.2,
        c[1] + gaussian(rand) * 0.2,
        c[2] + gaussian(rand) * 0.2
      ]);
    }

    const edges = [];
    const seen = new Set();
    const link = (a, b) => {
      if (a === b) return;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push(a, b);
    };

    for (let i = 0; i < NODES; i += 1) {
      for (let j = i + 1; j < NODES; j += 1) {
        const sameCluster = i % CLUSTERS === j % CLUSTERS;
        if (rand() < (sameCluster ? 0.34 : 0.012)) link(i, j);
      }
    }
    for (let i = 0; i < NODES; i += 1) {
      if (!edges.includes(i)) link(i, (i + CLUSTERS) % NODES);
    }

    for (let i = 0; i < NODES; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = 1;
    }

    const edgeCount = edges.length / 2;
    for (let i = NODES; i < n; i += 1) {
      const e = (i - NODES) % edgeCount;
      const a = nodes[edges[e * 2]];
      const b = nodes[edges[e * 2 + 1]];
      const t = rand();
      pos[i * 3] = a[0] + (b[0] - a[0]) * t + gaussian(rand) * 0.006;
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + gaussian(rand) * 0.006;
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + gaussian(rand) * 0.006;
      intensity[i] = 0.34;
    }

    fit(pos, n, 1);

    return {
      pos,
      intensity,
      edges,
      readout: `connectome · ${NODES} nodes / ${edgeCount} edges · fully traced`
    };
  };

  /* ---------------------------------------
     II, Output shell over a hidden core
     --------------------------------------- */

  const buildShellCore = (n) => {
    const rand = makeRandom(778211);
    const pos = new Float32Array(n * 3);
    const intensity = new Float32Array(n);
    const shellCount = Math.round(n * 0.42);

    for (let i = 0; i < shellCount; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / shellCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 1 + gaussian(rand) * 0.012;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      intensity[i] = 0.32;
    }

    for (let i = shellCount; i < n; i += 1) {
      if (rand() < 0.62) {
        pos[i * 3] = gaussian(rand) * 0.15;
        pos[i * 3 + 1] = gaussian(rand) * 0.15;
        pos[i * 3 + 2] = gaussian(rand) * 0.15;
        intensity[i] = 1;
      } else {
        const a = rand() * Math.PI * 2;
        const r = 0.4 + gaussian(rand) * 0.03;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = gaussian(rand) * 0.06;
        pos[i * 3 + 2] = Math.sin(a) * r;
        intensity[i] = 0.85;
      }
    }

    fit(pos, n, 1);
    const pct = Math.round((shellCount / n) * 100);

    return {
      pos,
      intensity,
      edges: null,
      readout: `output shell · ${pct}% surface / ${100 - pct}% interior · core occluded`
    };
  };

  /* ---------------------------------------
     III, Branching growth
     --------------------------------------- */

  const buildBranching = (n) => {
    const rand = makeRandom(4410927);
    const pos = new Float32Array(n * 3);
    const intensity = new Float32Array(n);
    const GENERATIONS = 5;

    const deflect = (dir, spread) => {
      const axis = normalize([gaussian(rand), gaussian(rand), gaussian(rand)]);
      const angle = spread * (0.55 + rand() * 0.75);
      const [ux, uy, uz] = axis;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const [x, y, z] = dir;
      const dot = ux * x + uy * y + uz * z;
      return normalize([
        x * c + (uy * z - uz * y) * s + ux * dot * (1 - c),
        y * c + (uz * x - ux * z) * s + uy * dot * (1 - c),
        z * c + (ux * y - uy * x) * s + uz * dot * (1 - c)
      ]);
    };

    const nodes = [[0, -0.62, 0]];
    const nodeGen = [0];
    const edges = [];
    let segmentCount = 0;

    const grow = (fromIndex, dir, length, gen) => {
      const from = nodes[fromIndex];
      const to = [from[0] + dir[0] * length, from[1] + dir[1] * length, from[2] + dir[2] * length];
      const toIndex = nodes.length;
      nodes.push(to);
      nodeGen.push(gen);
      edges.push(fromIndex, toIndex);
      segmentCount += 1;
      if (gen >= GENERATIONS) return;
      const children = gen < 2 ? 3 : (rand() < 0.5 ? 2 : 3);
      for (let i = 0; i < children; i += 1) {
        grow(toIndex, deflect(dir, 0.85), length * 0.86, gen + 1);
      }
    };

    grow(0, [0, 1, 0], 0.34, 0);

    const nodeCount = Math.min(nodes.length, n);
    for (let i = 0; i < nodeCount; i += 1) {
      pos[i * 3] = nodes[i][0];
      pos[i * 3 + 1] = nodes[i][1];
      pos[i * 3 + 2] = nodes[i][2];
      intensity[i] = 0.34 + 0.56 * (nodeGen[i] / GENERATIONS);
    }

    const edgeCount = edges.length / 2;
    for (let i = nodeCount; i < n; i += 1) {
      const e = (i - nodeCount) % edgeCount;
      const a = nodes[edges[e * 2]];
      const b = nodes[edges[e * 2 + 1]];
      const t = rand();
      pos[i * 3] = a[0] + (b[0] - a[0]) * t + gaussian(rand) * 0.005;
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + gaussian(rand) * 0.005;
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + gaussian(rand) * 0.005;
      intensity[i] = 0.24;
    }

    fit(pos, n, 1);

    return {
      pos,
      intensity,
      edges: nodeCount >= nodes.length ? edges : null,
      readout: `branching · ${GENERATIONS} generations / ${segmentCount} segments · expanding`
    };
  };

  const buildConfigs = (n) => [buildConnectome(n), buildShellCore(n), buildBranching(n)];

  /* ---------------------------------------
     Colour and sprites
     --------------------------------------- */

  const hexToRgb = (value) => {
    const hex = String(value).trim().replace('#', '');
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
    return [120, 200, 220];
  };

  const SPRITE = 44;
  const spriteCache = new Map();

  const getSprite = (rgb, brightfield) => {
    const q = [
      Math.round(rgb[0] / 8) * 8,
      Math.round(rgb[1] / 8) * 8,
      Math.round(rgb[2] / 8) * 8
    ];
    const key = `${q[0]},${q[1]},${q[2]},${brightfield ? 'b' : 'f'}`;
    const cached = spriteCache.get(key);
    if (cached) return cached;

    const off = document.createElement('canvas');
    off.width = SPRITE;
    off.height = SPRITE;
    const octx = off.getContext('2d');
    const half = SPRITE / 2;
    const grad = octx.createRadialGradient(half, half, 0, half, half, half);

    if (brightfield) {
      grad.addColorStop(0, `rgba(${q[0]},${q[1]},${q[2]},0.95)`);
      grad.addColorStop(0.42, `rgba(${q[0]},${q[1]},${q[2]},0.35)`);
      grad.addColorStop(1, `rgba(${q[0]},${q[1]},${q[2]},0)`);
    } else {
      grad.addColorStop(0, 'rgba(255,255,255,0.92)');
      grad.addColorStop(0.16, `rgba(${q[0]},${q[1]},${q[2]},0.72)`);
      grad.addColorStop(0.45, `rgba(${q[0]},${q[1]},${q[2]},0.2)`);
      grad.addColorStop(1, `rgba(${q[0]},${q[1]},${q[2]},0)`);
    }

    octx.fillStyle = grad;
    octx.fillRect(0, 0, SPRITE, SPRITE);
    spriteCache.set(key, off);
    return off;
  };

  /* ---------------------------------------
     Maths helpers
     --------------------------------------- */

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (t) => (t < 0 ? 0 : (t > 1 ? 1 : t));

  /* Yaw about Y, then pitch about X, then roll about Z. */
  const rotate = (x, y, z, yaw, pitch, roll, out) => {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);

    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;

    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;

    out[0] = x1 * cr - y2 * sr;
    out[1] = x1 * sr + y2 * cr;
    out[2] = z2;
    return out;
  };

  const readVar = (element, name, fallback) => {
    const value = getComputedStyle(element).getPropertyValue(name);
    return value && value.trim() ? value.trim() : fallback;
  };

  const isBrightfield = () => document.documentElement.dataset.theme === 'light';

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A test seam for driving animation from the console on localhost only.
     Never defined on the deployed site. */
  const steppers = [];
  const exposeStepper = (step) => {
    if (!/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return;
    // A page can host more than one renderer, so drive them all.
    steppers.push(step);
    window.__abStep = (deltaMs) => steppers.map((fn) => fn(deltaMs));
  };

  window.BiodynAbout = {
    CASES,
    PENDING,
    AUDIENCES,
    ORGANISM_AREAS,
    AUDIT_AREAS,
    APPLICATIONS,
    buildConfigs,
    makeRandom,
    gaussian,
    fit,
    hexToRgb,
    getSprite,
    easeInOut,
    easeOut,
    clamp01,
    rotate,
    readVar,
    isBrightfield,
    prefersReducedMotion,
    exposeStepper
  };
})();
