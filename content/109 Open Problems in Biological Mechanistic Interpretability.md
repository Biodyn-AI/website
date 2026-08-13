Biological AIs are getting better quickly. By *biological AI*, I mean models trained on things such as DNA sequences, proteins, gene-expression profiles, cell images, tissue samples, spatial measurements, and other biological data. Many of them learn through some version of “hide part of the data and predict it back”, although the exact objective varies.

I run a [research programme at BiodynAI](https://biodynai.com) on mechanistic interpretability for these models. The programme has three broad aims: use biological models to test and improve general mechinterp methods, audit the models for biosecurity-relevant capabilities, and extract biological knowledge from their internals.

People occasionally ask me what a good project in this area would look like. This post is my current answer.

The basic bet is that biological models contain more than useful input-output mappings. Their internal representations may encode compressed maps of proteins, pathways, cell states, regulatory systems, developmental trajectories, and evolutionary structure. Mechanistic interpretability may let us read this [“map inside the machine”](https://biodynai.com/the-map-inside-the-machine.html), work out how the model uses it, and sometimes turn what we find into knowledge or algorithms that remain useful after the original model is gone.

For almost any question in the list, I think there are roughly six possible levels of result, ordered by increasing scientific coolness:

1. Some biological property can be decoded from the model.
2. An internal feature has a coherent biological interpretation.
3. The feature adds information beyond simple baselines and obvious confounders.
4. Intervening on it causally changes the model’s computation.
5. The result transfers across datasets, models, or species, or becomes a useful standalone tool.
6. It predicts a previously unknown biological fact that survives prospective experimental validation.

Levels one and two are often enough for a paper. Most of the hard and interesting work begins somewhere between levels three and five. Level six is where the machine has actually told us something about biology that we did not already know, which is presumably the point of building all this machinery in the first place.

The problems below range from fairly direct replication projects to long-term research programmes. Some overlap. A few are probably badly posed. Several will turn out to be much harder than their two-sentence descriptions suggest, as is traditional.

## I. What would count as a mechanistic result?

### 1. Agree on what “interpretability” means

Different papers use *interpretable*, *causal*, and *mechanistic* for very different kinds of evidence. One paper’s mechanism is another paper’s probe. We need a common framework that says whether a result is merely decodable, statistically useful, causally important inside the model, biologically causal, transferable, or experimentally validated.

Biological mechinterp also lags behind LLM mechinterp, although LLM mechinterp is hardly moving at relativistic speed. There is still plenty of useful work in applying newer LLM methods to biological models, or simply bringing stricter controls to methods that are already used.

### 2. Be stricter about “biologically meaningful”

A feature may look enriched for a known pathway because that pathway contains highly expressed genes, heavily annotated genes, or genes that appear unusually often in the training data. Any claim of biological meaning should survive controls for annotation frequency, expression level, gene degree, dataset composition, and plausible alternative explanations.

### 3. Find the right level of explanation

Should we explain a biological model in terms of individual genes, protein motifs, sparse features, pathways, low-dimensional manifolds, attention heads, or whole circuits? The useful level will probably depend on the task. We need criteria for choosing explanations that remain meaningful under retraining and intervention rather than collapsing as soon as the random seed changes.

### 4. Put uncertainty on interpretations

Feature names, circuit edges, pathway assignments, and proposed mechanisms should come with calibrated uncertainty. “Unannotated” also covers several very different cases: possible new biology, incomplete databases, mixed features, technical artifacts, and simple failure to interpret the feature. Those cases should not be placed in one mysterious bucket.

### 5. Measure whether interpretability pays for itself

Given the same amount of compute, researcher time, and laboratory money, does interpretability produce better hypotheses than differential expression, classical network inference, black-box attribution, or ordinary screening? Otherwise the field may become very good at producing attractive diagrams whose main downstream effect is further attractive diagrams.

## II. Where does biological knowledge live inside a model?

Transformers offer several obvious places to look: input embeddings, attention, the residual stream, feed-forward blocks, normalization layers, and output heads. Early evidence suggests that these places contain rather different kinds of biological structure. [Attention may largely reflect co-expression](https://link.springer.com/article/10.1186/s12864-026-12965-8), while [residual-stream geometry contains some information about gene regulation](https://link.springer.com/article/10.1186/s12859-026-06538-5), and [sparse features can recapitulate cellular biology](https://arxiv.org/abs/2603.02952).

### 6. Make a full map of the model’s substrates

Compare embeddings, attention, feed-forward blocks, residual streams, normalization layers, and output heads under the same tasks and controls, across many models. The immediate goal is simple: find where each kind of biological information is stored, and where the model actually transforms it rather than merely carrying it forward.

### 7. Follow representations through the layers

What happens to a gene, protein, or cell representation as it passes through the network? Early layers may preserve local relationships, while deeper layers may compress them into broad categories, but this needs to be shown rather than assumed. A real account would describe the computation from layer to layer, rather than ending with twelve enrichment plots and a vague story about increasing abstraction.

### 8. Recover context-dependent gene representations

The same gene behaves differently in a stem cell, tumour cell, neuron, and macrophage. How does its internal representation change across those contexts? Which parts remain stable, and which dimensions encode tissue, disease, developmental stage, or environmental response?

### 9. Measure how distributed a concept really is

Some biological concepts may line up with one sparse feature. Others may require hundreds of features, or occupy a curved region of representation space. We need measures that distinguish genuinely distributed computation from a feature decomposition that simply failed to find the right basis.

### 10. Separate stored knowledge from used knowledge

A pathway may be decodable from a model even when the model ignores it for the prediction at hand. Causal interventions, mediation analysis, and task-conditioned circuit tracing should tell us which biological facts are merely present and which ones actually participate in the computation.

### 11. Track what fine-tuning changes

Fine-tuning may add new representations, repurpose old ones, or only modify the readout. Mapping features and circuits before and after fine-tuning could show how disease classifiers, perturbation predictors, and generative models acquire their specialised capabilities.

### 12. Watch biological knowledge appear during training

Train smaller biological models while saving many intermediate checkpoints. When do pathways, cell identities, regulatory relationships, evolutionary structure, or dangerous capabilities first become visible? Do they emerge gradually, appear in jumps, or follow a fairly stable order across runs?

### 13. Relate scale to extractable knowledge

Single-cell reconstruction models [show useful scaling](https://arxiv.org/abs/2602.15253) when data are abundant, with little benefit from larger models when data are scarce. It remains unclear whether interpretable biological knowledge follows the same scaling law as predictive loss. Larger models may contain qualitatively new mechanisms, or simply more densely packed versions of what smaller models already know.

## III. Gene regulatory network inference

A gene regulatory network is a graph describing how regulators influence target genes. Attention matrices once looked like convenient ready-made networks, but systematic tests suggest that attention often tracks co-expression or broad gene importance rather than specific causal edges. Residual geometry looks more promising, although real benchmarks based on wet-lab perturbations are noisy, and method rankings can change when one changes the tissue, reference database, or candidate edge set.

### 14. Look for regulatory signal outside attention

Search residual streams, sparse features, feed-forward blocks, output gradients, and combinations of these components. The key question is whether any internal substrate contains regulatory information beyond expression level, co-expression, and regulator popularity.

In my own experiments with [tensor-network transformer variants](https://www.lesswrong.com/posts/hp9bvkiN3RzHgP9cq/tensor-transformer-variants-are-surprisingly-performant), I found a substantial amount of regulatory information in the feed-forward layers. That seems worth investigating much more systematically.

### 15. Recover causal direction

A model may place two related genes close together without representing which one influences the other. Can internal interventions distinguish regulator-to-target effects from target-to-regulator effects, shared causes, and symmetric functional similarity?

### 16. Separate direct regulation from downstream effects

Suppose regulator A affects gene C through gene B. The model may encode all three pairwise relationships, even though only two are direct. We need methods that recover plausible causal chains and distinguish direct molecular interactions from later consequences.

### 17. Tell activation from repression

Regulatory edges have signs. A transcription factor may activate one target and repress another, depending on context. Can the model’s internal computation predict the direction of expression change after an intervention, rather than merely telling us that two genes are related?

### 18. Build cell-state-specific networks

A single universal regulatory network is usually a fiction of convenience. Relationships change across tissues, cell types, developmental stages, disease states, and environmental conditions. Interpretability methods should recover conditional networks and identify which internal features switch particular edges on or off.

### 19. Recover network rewiring after perturbation

Knocking down a gene, adding a drug, or moving a cell into a disease state may change the network itself. Can model internals show which connections disappear, which compensatory pathways turn on, and which new dependencies emerge?

### 20. Add time to network extraction

Most single-cell datasets are static snapshots. Regulatory mechanisms unfold over minutes, hours, and developmental timescales. Models trained on time-course data may let us recover delays, transient interactions, and the order in which regulatory events occur.

### 21. Find feedback loops

Feedback matters for homeostasis, differentiation, oscillation, and disease. Pairwise edge scoring can miss loops or confuse them with correlation. Circuit tracing may be able to identify closed regulatory loops and tell whether they stabilise, amplify, or oscillate.

### 22. Model combinatorial regulation

Genes are often controlled by combinations of transcription factors rather than one factor at a time. We need methods that can find AND-like, OR-like, threshold, cooperative, antagonistic, and context-dependent rules inside model circuits.

### 23. Train models on perturbations from the start

Models trained mostly on observational expression snapshots have little reason to learn causal direction. Train foundation models directly on large perturbation datasets, then check whether their internals contain better regulatory networks than masked-expression models do.

### 24. Combine transcriptomic and regulatory modalities

Bring together gene expression, chromatin accessibility, transcription-factor binding, protein abundance, methylation, spatial context, and perturbation outcomes. Interpretability could then show which modality contributes evidence for a proposed regulatory edge, and where the modalities disagree.

### 25. Deal with unmeasured variables

Many apparent gene-to-gene relationships are driven by missing proteins, metabolites, environmental signals, or hidden cell states. Can models represent those latent causes explicitly? Can interpretability tell us when a proposed edge is really a proxy for something we failed to measure?

### 26. Make benchmark rankings less fragile

[Network-inference rankings can reverse](https://arxiv.org/abs/2603.03493) when researchers change the candidate gene set, tissue, or reference database. Evaluation suites should cover a distribution of reasonable protocols and expose methods whose apparent superiority rests on one particularly friendly setup.

### 27. Use active learning to choose the next perturbation

Given a partially inferred network, which knockout, combination, dose, or time point would reduce uncertainty the most? A useful interpretability-derived network should eventually help choose experiments, rather than merely summarising experiments that have already happened.

### 28. Export an executable regulatory model

A static edge list only goes so far. Can we extract a compact dynamical system that predicts how gene expression changes after interventions? The result could be a set of equations, logical rules, or a small neural circuit, ideally usable without carrying the whole foundation model around forever.

## IV. Causal circuits and internal computation

In my [circuit-tracing work](https://academic.oup.com/bioinformatics/article/42/7/btag379/8708321), I have started mapping directed dependencies between sparse features in single-cell models. The resulting graphs show biological coherence, a surprisingly strong inhibitory structure, and substantial redundancy. So far, however, the bridge from causal edges *inside the model* to causal regulation *inside the cell* remains weak.

### 29. Map whole circuits, not only good examples

It is tempting to choose a few features that already have clean annotations and trace those. Exhaustive mapping can reveal a rather different global picture, including hubs with no obvious interpretation. The technical problem is scaling this up without running millions of expensive interventions.

### 30. Translate feature circuits into biological variables

A directed graph between sparse features is still a graph between artificial objects invented by our decomposition method. We need principled ways to map its nodes and edges onto genes, pathways, molecular processes, cell states, and quantities that can actually be measured in an experiment.

### 31. Characterise higher-order redundancy

Ablating one feature may do little because several others can perform the same role. Pairwise tests will miss cases where three, ten, or a hundred components compensate for one another. Finding minimal causal sets efficiently is an open problem in its own right.

### 32. Look for synergy as well as redundancy

Some computations may only appear when several features act together. We need tests for superadditive interactions that do not require enumerating every possible combination, since that search space becomes cosmological rather quickly.

### 33. Check whether interventions stay on-manifold

Zeroing or amplifying an activation can place the model in a hidden state it never encountered during training. Compare several intervention schemes, including patching from real examples, projection onto plausible activation regions, and constrained optimisation. A causal claim becomes much stronger when it survives more than one arbitrary way of poking the model.

### 34. Explain why inhibitory edges dominate

Many biological circuit maps contain a large fraction of inhibitory feature-to-feature effects. This might reflect real biological suppression, competition between representations, normalisation, sparse-coding artifacts, or the model’s way of deleting irrelevant information. At the moment these explanations are easy to tell and hard to distinguish.

### 35. Recover circuits that depend on context

The circuit used for a gene in one cell type may differ sharply from the circuit used in another. A useful method should return conditional circuits and separate stable cores from context-specific branches and switches between alternative computations.

### 36. Measure circuit completeness and faithfulness

A proposed circuit should reproduce a meaningful fraction of the model’s behaviour when run separately or substituted back into the original network. We need tests for preserved performance, calibration, and robustness across inputs, rather than declaring victory after finding one causal edge with a good pathway name.

### 37. Edit one circuit without breaking everything else

Can we remove a batch artifact, disease-associated shortcut, or unsafe capability while preserving unrelated functions? Any circuit-editing result should report both the intended effect and a broad audit of collateral damage.

### 38. Find circuits that recur across models

Do independently trained models converge on equivalent circuits for translation, secretion, immune activation, differentiation, or DNA repair? Repeated convergence would be evidence that the circuit reflects durable structure in the data-generating process rather than an idiosyncrasy of one checkpoint.

## V. Sparse features and representation geometry

Sparse autoencoders have exposed interpretable features in protein, single-cell, microscopy, pathology, and physiological models. The method is useful, but its outputs remain quite dependent on training details. Two autoencoders trained on the same activations may recover different feature sets, and changing the dictionary size can split one concept into several or merge several concepts into one.

### 39. Make sparse features stable across seeds

Measure which features recur across independent runs and which are arbitrary decompositions. Possible directions include better alignment methods, consensus dictionaries, and objectives that reward stability without forcing genuinely ambiguous concepts into fake agreement.

### 40. Understand feature splitting and merging

A broad immune-response feature at one dictionary size may break into cytokine, interferon, and stress features at another. We need a hierarchical account of how features divide and combine across resolutions, ideally one that lets us say which level is useful for a particular biological question.

### 41. Align features across different models

Match functionally equivalent features across architectures, model sizes, datasets, and modalities. The same concept may be rotated, split, distributed, or implemented through a different circuit, so nearest-neighbour matching in vector space will often be too naive.

### 42. Recover rare biological concepts

Rare cell states, transient developmental events, unusual pathogens, and uncommon diseases contribute little to an average reconstruction objective. Specialised dictionaries or sampling schemes may recover them, but they also risk hallucinating structure from a handful of examples. We need methods that handle both sides of that trade-off.

### 43. Interpret absence-based features

A feature may represent the absence of a pathway, loss of differentiation, a missing structural element, or suppression of a response. These are harder to annotate because biological databases mostly record positive associations: what is present, active, or enriched.

### 44. Learn nonlinear and multiscale features

Standard sparse autoencoders represent activations as linear combinations of features. Biology contains spatial patterns, sequence motifs, interactions, trajectories, and nested hierarchies, so the linear picture may be too restrictive. I tried [bilinear autoencoders](https://arxiv.org/abs/2605.08891) as one step in this direction, without much success so far. There is ample room for better ideas.

### 45. Connect sparse features to global geometry

Sparse features describe recurring directions; manifold methods describe the shape of the whole representation space. When do these perspectives agree? When are they picking up different structure? One particularly useful result would be a sparse feature basis that also serves as meaningful coordinates on a biological manifold.

### 46. Make topological claims robust to the analysis pipeline

Clusters, branches, loops, and curved manifolds can change when one changes preprocessing, distance metrics, sample density, or dimensionality reduction. A topological finding should survive plausible analysis choices, matched null models, and external datasets.

### 47. Separate sequence semantics from cellular semantics

A single-cell model may seem to know gene function because its gene embeddings already contain information inherited from a protein-sequence model or external annotation. Claims about knowledge learned from cells should be compared against sequence-only, expression-only, and annotation-only baselines.

### 48. Leave room for genuinely unknown features

An LLM can invent a plausible biological name for almost any gene list. Annotation pipelines should therefore show evidence, counterevidence, nearby known concepts, causal behaviour, and possible experiments. “Currently unknown” needs to remain an acceptable answer.

## VI. Extracting standalone biological algorithms

In one of my studies, I [report](https://arxiv.org/abs/2603.10261) a compact algorithm for blood-cell development extracted from scGPT using frozen attention operators. It runs 34.5 times faster than a standard multilayer probe, uses roughly 1,000 times fewer trainable parameters, and retains interpretable lineage factors. I think this is a promising proof of concept. It now needs independent replication much more than it needs ceremonial admiration.

### 49. Replicate the haematopoietic result independently

Apply the same pipeline to independently processed data, alternative checkpoints, other single-cell foundation models, and strict donor-held-out evaluations. The aim is to find out whether the method is genuinely general or unusually well matched to one model and one developmental system.

### 50. Extract algorithms for other bioinformatics tasks

Obvious targets include cell typing, developmental ordering, gene-module scoring, cell-cell communication, variant-effect prediction, protein-function annotation, binding prediction, sequence alignment, structural motif detection, and spatial-neighbourhood analysis. Some will probably work much better than others; learning which ones do is already useful.

### 51. Export native operators directly

Search for attention heads, convolutional filters, state-space operators, graph-message-passing rules, or small feature circuits that can be copied out with little or no retraining. Direct export gives unusually strong evidence that the computation was already present in the foundation model.

### 52. Turn neural computations into equations or rules

Can an internal circuit be rewritten as a scoring function, differential equation, logical program, graph algorithm, or short piece of ordinary code? A symbolic version would make its biological assumptions much easier to inspect, criticise, and modify.

### 53. Reduce or eliminate retraining on the target dataset

A strong extracted algorithm should work on new data with fixed parameters or minimal calibration. When a large adaptor must be trained from scratch, much of the performance may come from the adaptor rather than from knowledge recovered from the original model.

### 54. Test brutal distribution shifts

Evaluate extracted algorithms across donors, laboratories, platforms, tissues, diseases, species, and evolutionary distances. The most interesting outcome would be an algorithm that transfers further than the foundation model’s ordinary downstream pipeline.

### 55. Compare against purpose-built bioinformatics methods

For each task, compare accuracy, calibration, speed, memory use, data requirements, interpretability, and maintenance cost. An extracted algorithm should earn its place against mature specialist tools; being philosophically interesting is helpful, but the benchmark will remain unmoved.

### 56. Compose several extracted algorithms

Can modules for cell identity, developmental state, signalling, and perturbation response be joined into a larger transparent system? Successful composition would suggest that the original model contains reusable biological subroutines rather than a single tangled computation for every task.

### 57. Preserve uncertainty and consider safety during extraction

Compression can make a capability cheaper and easier to distribute. Extracted algorithms should retain useful uncertainty estimates, and the extraction process should include a check for whether it lowers the barrier to potentially dangerous biological capabilities.

## VII. Novel biological discovery and laboratory validation

Interpretable features [have already been proposed](https://arxiv.org/abs/2412.12101) for filling gaps in protein annotation, finding biomarkers, refining networks, mapping cell states, and guiding experiments. The decisive step is prospective validation: choose the prediction first, then run the experiment, rather than discovering after the fact that the model was mysteriously interested in whatever the database already contained.

### 58. Find biomarkers that survive removal of the model

Use interpretability to identify a compact set of measurable variables associated with a condition such as disease or age. Then throw away the foundation model, build a conventional statistical predictor from raw biological measurements, and validate it in an external cohort.

### 59. Discover cell states missing from current taxonomies

Look for internal features or geometric regions that identify reproducible cell populations absent from existing labels. A serious claim should show a coherent molecular programme, recurrence across donors, and confirmation through independent measurements or functional experiments.

### 60. Find hidden transition states

Development and disease may pass through brief intermediate states that ordinary clustering misses. Representation geometry could reveal bottlenecks, branches, or sparse regions, then suggest markers for isolating those cells experimentally.

### 61. Investigate unannotated circuit hubs

[Exhaustive circuit mapping can reveal](https://arxiv.org/abs/2603.11940) highly connected features with no clear database annotation. Such hubs are attractive discovery targets, although some will surely encode technical properties of the dataset. Targeted perturbations and independent datasets should help sort the biology from the plumbing.

### 62. Map conserved and divergent mechanisms

Compare equivalent circuits across tissues and species. Stable cores may reveal conserved biological programmes; specific points of divergence may identify tissue-specific or lineage-specific regulatory innovations.

### 63. Prioritise drug targets through selective circuit control

Search for perturbations that suppress disease-associated features while preserving healthy-state features. Experimental validation still has to test efficacy and specificity, since “strongly changes a neural network activation” remains a rather adventurous criterion for choosing a drug target.

### 64. Discover side-effect and toxicity programmes

Trace whether candidate interventions activate stress, immune, metabolic, or cell-death circuits. This could flag likely liabilities before expensive animal studies, assuming the programmes found inside the model transfer to real experimental systems.

### 65. Choose experiments from representation geometry

Use uncertainty, curvature, sparse regions, and disagreement between models to choose new samples or interventions. Compare the resulting experiment policy against random selection, expert choice, diversity sampling, and ordinary active learning.

### 66. Automate discovery without automating self-deception

Agentic systems [could search](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0344826) through thousands of feature, pathway, and circuit hypotheses. They also create an industrial-scale multiple-testing machine. Any automated pipeline needs held-out data, explicit null models, correction for repeated search, preregistered stopping rules, and reviewers that are genuinely independent of the hypothesis generator.

## VIII. Training better models for mechanistic biology

Sometimes interpretability reveals that the desired mechanism simply is not there. Once that happens, a more elaborate microscope will not manufacture the missing object. We may need to change the training data, objective, or architecture so that learning useful mechanisms becomes the easiest way for the model to solve its task.

### 67. Pretrain directly on interventions

Include gene knockouts, gene activation, drug treatments, environmental changes, and combinations of these during pretraining. Then test whether causal direction and regulatory effects become easier to recover than they are in models trained only on observational data.

### 68. Use counterfactual objectives

Ask the model how the same biological system would behave under a different intervention. Counterfactual prediction may encourage representations of mechanisms that remain stable while surface conditions change.

### 69. Train on time and lineage

Add time courses, lineage tracing, developmental ancestry, and repeated measurements. These data should help distinguish causes from consequences, transient responses from stable identities, and genuine trajectories from convenient static orderings.

### 70. Build multimodal models

Jointly model DNA, chromatin, RNA, protein abundance, metabolites, morphology, spatial position, and perturbations. Interpretability can then ask which modality contributes unique information and where the model learns genuine cross-modal links. I am training models along these lines now, so people interested in working on this are welcome to join.

### 71. Add causal inductive biases

Try directed graph modules, explicit intervention variables, structural causal models, dynamical systems, and asymmetric message passing. Compare them with ordinary transformers under equal data and compute, since a causal-looking architecture earns few points if its advantage disappears under a fair baseline.

### 72. Make models interpretable by construction

Use modular pathways, sparse bottlenecks, hierarchical representations, explicit gene sets, or constrained interactions during training. The practical question is how much transparency we can gain before predictive performance deteriorates enough that nobody wants to use the model.

### 73. Compare architecture families mechanistically

Transformers, graph neural networks, state-space models, diffusion models, variational autoencoders, and neural differential equations may learn different kinds of biological abstraction. Evaluate both their predictive performance and how easily their causal mechanisms can be recovered.

### 74. Remove technical variation during training

Develop objectives that suppress batch, laboratory, platform, and donor artifacts while preserving real biological heterogeneity. Interpretability can then check whether deconfounding actually worked, or whether the nuisance variable merely migrated into a less obvious subspace.

### 75. Derive scaling laws for causal knowledge

Measure how regulatory direction, perturbation transfer, circuit coherence, algorithm extractability, and discovery rates change with model size and data diversity. Predictive loss may improve smoothly while causal knowledge stays flat. The reverse would also be interesting.

### 76. Use synthetic causal curricula

Generate artificial cells, regulatory networks, proteins, or evolutionary systems with exactly known mechanisms. Train models on progressively more complicated versions and test whether their internal representations continue to track the real causal structure.

## IX. Replication, transfer, and benchmark design

Replication matters unusually much here. Model training, biological preprocessing, feature decomposition, and reference databases all introduce researcher degrees of freedom. Network-inference rankings [already show](https://arxiv.org/abs/2603.03493) substantial sensitivity to evaluation choices, and there is little reason to assume other mechinterp results are magically exempt.

### 77. Replicate across random seeds

Repeat model training, feature extraction, circuit tracing, and downstream evaluation across seeds. Report which conclusions survive even when individual features rotate, split, merge, or disappear.

### 78. Replicate across checkpoints and model sizes

A mechanism found in one checkpoint may be temporary or scale-specific. Track equivalent features and circuits across small, medium, and large versions of the same model family, for example across [Geneformer](https://www.nature.com/articles/s41586-023-06139-9) variants.

### 79. Replicate across architectures

Check whether a finding from a transformer also appears in graph, state-space, convolutional, or variational models trained on comparable data. Convergence across architectures is more persuasive than recurrence inside one family of very similar models.

### 80. Replicate across datasets, laboratories, and platforms

Run the same analysis on data produced by different sequencing technologies, sample-processing protocols, hospitals, and laboratories. A biological mechanism should not depend too delicately on which machine prepared the matrix.

### 81. Replicate across donors, tissues, diseases, and species

State the boundary conditions of every claimed mechanism. Some circuits may be universal, some human-specific, some tissue-specific, and some peculiar to one immortalised cell line that has enjoyed an implausibly influential scientific career.

### 82. Replicate across intervention types

Compare knockout, partial knockdown, overexpression, chemical inhibition, dose changes, and environmental perturbations. A proposed mechanism should explain why these interventions agree where they do and diverge where they should.

### 83. Standardise leakage-resistant evaluation

Biological datasets contain near-duplicates, related donors, homologous sequences, shared studies, and annotation leakage. Splits should match the scientific generalisation claim: donor-held-out, laboratory-held-out, tissue-held-out, protein-family-held-out, or evolutionary-distance-held-out as appropriate.

### 84. Publish failed replications and versioned atlases

Feature atlases should record model versions, data versions, autoencoder settings, annotation databases, and confidence. Failed replications should be searchable alongside successful ones. Otherwise we will gradually build a map of biological model internals from whichever random seeds happened to be most cooperative.

## X. Beyond ordinary single-cell gene expression

Most of my own work is on single-cell models, mainly because I suspect they contain an unusually large amount of extractable biological knowledge. The agenda is broader, though. Mechinterp is already being applied to protein models, microscopy, pathology, spatial biology, and physiological signals, each with its own forms of ground truth and its own opportunities for discovery.

### 85. Recover protein mechanisms from sequence models

Move beyond features that correlate with known annotations and find circuits that compute binding, catalysis, structural stability, localisation, or allosteric effects. Mutational scans and biochemical assays offer unusually good ways to test whether the proposed mechanism is real.

### 86. Interpret protein-generation decisions

Which internal features make a generative protein model favour a particular fold, active site, binding interface, or taxonomic family? Can we steer one property while preserving stability and unrelated functions, and explain why the steering works?

### 87. Decode genomic regulatory grammar

Genome models may learn promoters, enhancers, splice signals, chromatin boundaries, long-range interactions, and evolutionary constraints. The open problem is to recover the internal algorithms that combine motifs across thousands or millions of bases.

### 88. Interpret RNA foundation models

RNA models combine sequence, secondary structure, modification, localisation, expression, and interaction information. Possible targets include folding rules, binding programmes, splicing mechanisms, degradation signals, and context-dependent regulatory elements.

### 89. Map spatial tissue circuits

Spatial models can represent which cells influence their neighbours and how tissue architecture constrains signalling. Interpret them to recover local communication rules, niches, boundaries, and disease-associated neighbourhoods.

### 90. Extract morphological programmes from microscopy models

Sparse dictionary methods [can already recover](https://arxiv.org/abs/2412.16247) cell types and perturbation-related morphology. The next step is to identify causal visual programmes, connect them to molecular pathways, and design experiments around morphological states that do not yet have names.

### 91. Interpret structural and interaction models

Study how protein-structure and molecular-interaction models represent geometry, physical constraints, confidence, alternative conformations, and binding. Their internals may contain useful approximations that can be exported into faster structural algorithms.

### 92. Trace circuits across modalities

When a model predicts gene expression from chromatin, or protein abundance from RNA, which internal pathways carry the information? Cross-modal circuit tracing could reveal real biological coupling, along with shortcuts that merely exploit correlations between measurement pipelines.

### 93. Extract signalling, metabolic, and whole-cell computations

Extend the same programme to signalling networks, metabolic flux models, cellular simulators, and virtual cells. The long-term target is a comprehensible hierarchy connecting molecular events to cell behaviour, preferably before the Sun leaves the main sequence.

## XI. Biosecurity and safety auditing

My current view is that a serious security audit of biological models will require mechanistic interpretability. Genome language models have already been used to [generate complete viable bacteriophage genomes](https://www.science.org/doi/10.1126/science.aec2657). Separate work [found](https://arxiv.org/html/2511.19299v2) that fine-tuning could partially restore virus-related capabilities in a model whose original training data excluded certain viral sequences. Behavioural evaluations remain necessary, but they may miss dormant, distributed, or easily recoverable capabilities.

### 94. Define the internal capabilities that matter for risk

Be precise about which abilities are biosecurity-relevant. Candidates include understanding host range, immune interactions, functional sequence constraints, molecular evasion, or whole-genome coherence. Vague labels such as “biological knowledge” are too broad to audit and too easy to argue about indefinitely.

### 95. Locate risk-relevant features and circuits

Can interpretability find internal representations associated with hazardous biological functions before broad output evaluations detect them? Any such feature would need causal validation, robust controls, and careful handling of access.

### 96. Detect precursors of dangerous capabilities

A model may learn several pieces of a capability before it succeeds on an end-to-end benchmark. Track precursor features, reusable subcircuits, and abrupt geometric changes across checkpoints. Early indicators could matter more than the first visible behavioural success.

### 97. Test whether training-data exclusion really works

When sensitive categories are removed from pretraining, what related abstractions remain? A model may reconstruct missing capabilities from neighbouring domains, evolutionary regularities, or later fine-tuning. Interpretability could show how much of the underlying machinery survived the filter.

### 98. Watch capabilities return during fine-tuning

Fine-tuning may reactivate dormant representations or recombine harmless-looking components into a more capable circuit. Following that process internally may reveal restoration earlier than waiting for a complete misuse-relevant task to succeed.

### 99. Verify unlearning mechanistically

After removing sensitive data or capabilities, inspect whether the relevant circuits actually changed. Suppressed outputs may coexist with recoverable internal knowledge, or the knowledge may have moved into a representation our original audit no longer recognises.

### 100. Red-team interpretability-based safeguards

Assume the attacker knows how the monitor works. Test whether fine-tuning, representation rotation, feature splitting, model merging, or alternative prompting can evade feature-level safeguards. An audit method that only works while secret is a temporary arrangement.

### 101. Improve sequence screening with internal representations

Model representations may detect functional similarity even when raw sequence similarity is low. Test whether interpretable features can complement existing screening systems while keeping false positives manageable enough for real use.

## XII. Biology as a testbed for general mechanistic interpretability

Biological models offer unusually rich external checks: known pathways, protein structures, evolutionary relationships, perturbation experiments, lineage information, and measurable phenotypes. They are also often smaller than frontier language models. This makes them useful model organisms, and also literal organisms, for mechanistic interpretability, provided we remember that biological databases are incomplete and occasionally wrong.

### 102. Create standard “model organisms” for mechinterp

Choose a small set of biological models, datasets, and tasks for repeated, exhaustive study. The equivalent of *E. coli* or *Drosophila* for interpretability would let methods accumulate on shared systems instead of every paper starting again with a new model, new preprocessing, and new ontology.

### 103. Build synthetic biological tasks with exact ground truth

Generate data from known regulatory networks, evolutionary processes, spatial systems, and biochemical simulators. Then test whether interpretability methods recover both the mechanism that generated the data and the mechanism the trained model actually uses.

### 104. Compare interpretability methods head to head

Run attention analysis, probing, gradients, sparse autoencoders, transcoders, causal tracing, causal abstraction, geometry, and circuit discovery on the same models. Evaluate them against shared biological and causal targets rather than letting every method choose the benchmark on which it looks most enlightened.

### 105. Test methods under biological redundancy

Biological systems contain duplicated genes, parallel pathways, compensation, feedback, and many-to-one mappings. These properties make biology a demanding test of whether interpretability can recover distributed and degenerate computation.

### 106. Exhaustively analyse very small biological models

Train small transformers or graph models on controlled biological tasks and map every relevant neuron, feature, edge, and intervention. Complete explanations of small systems can expose bad assumptions before we scale the same methods to billion-parameter models and convert the assumptions into infrastructure.

### 107. Release shared activation and intervention datasets

Store activations, sparse features, patching results, perturbation outcomes, and annotation mappings in standard formats. Researchers could then compare methods without repeatedly paying the full inference cost or rebuilding the same preprocessing pipeline.

### 108. Build agentic research loops with independent quality gates

Automate hypothesis generation, analysis, replication, and report writing, while separating the executor, critic, statistician, and biological reviewer. Held-out datasets and preregistered tests should remain inaccessible to the hypothesis generator until evaluation.

### 109. Try modern mechinterp methods on biological models and see what happens

Take manifolds, J-space, natural-language autoencoders, compositional methods, or whatever useful technique appeared last month, apply it carefully to biological models, and check whether the setting gives cleaner evidence than LLMs do. Biological models are often smaller, their inputs have more external structure, and some claims can ultimately be tested in experiments. That makes them a good place to find out whether a method works at all.

## If you start working on any of these problems, please get in touch with me so that we can coordinate.
