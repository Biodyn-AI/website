# **The Map Inside the Machine: A Research Doctrine for Extracting Biological Knowledge from Foundation Models**

*"We must not believe those who today, with philosophical bearing and a superior tone, prophesy the decline of culture and accept the ignorabimus.* *For us there is no ignorabimus.* *In my opinion, there is no unsolvable problem anywhere.* *Instead of the foolish ignorabimus, our slogan shall be:* *We must know \- we will know."*

\- David Hilbert, 1930

## **The Premise**

Somewhere inside the weights of biological foundation models there is a map. Not a map in any metaphorical sense, but a literal, structured, geometrically organized representation of biological reality: which proteins bind which, which transcription factors regulate which genes, how subcellular compartments are arranged, how differentiation programs unfold. This map was not programmed in. It was learned, because predicting biological data requires understanding the biological processes that generated it.

The intellectual foundation for this claim was articulated by Ilya Sutskever: to predict data well, a model must learn the underlying realities that gave rise to that data. A language model that predicts text well must learn something about the world the text describes. A biological model that predicts gene expression well must learn something about the cellular machinery that produces that expression.

It is now an empirical fact, verified across multiple models, multiple cell types, multiple analytical frameworks, and hundreds of statistical tests. The question is no longer *whether* biological foundation models learn biology. The question is how to read the map they have drawn \- how to extract, validate, and translate their internal biological knowledge into human-readable form.

## **Why This Matters**

Biology has a knowledge problem. We have accumulated vast databases of molecular interactions \- TRRUST for transcriptional regulation, STRING for protein-protein interactions, Gene Ontology for functional annotations, CRISPRi/CRISPRa screens for perturbation responses \- yet these databases are incomplete, noisy, context-dependent, and often contradictory. No single experiment, database, or human mind can integrate all of this information into a coherent picture of how a cell actually works.

Foundation models, trained on huge biological data sets, perform precisely this integration. They consume the statistical regularities of gene expression, protein interactions, and metabolism across thousands of cellular contexts and distill them into compact internal representations. In doing so, they are forced to learn the causal structure that generates those regularities.

The promise is this: if we can read the model's internal representations, we can access a form of biological knowledge that is:

* **Integrated** across millions of cells and thousands of conditions  
* **Internally consistent** (the model must reconcile conflicting signals to minimize prediction error)  
* **Potentially novel** (the model may have learned regularities that no individual experiment has yet isolated)

The research program described here is the effort to realize that promise.

## **The Information-Theoretic Foundation: How Much Biology Is There to Extract?**

Before asking *what* biological knowledge foundation models learn, there is a prior question: *how much* is there to learn? How predictable is gene expression from the cellular context, and where are the fundamental limits?

This question can be answered empirically. A masked-reconstruction transformer trained to predict a gene's expression from the other genes in the same cell will improve as the model grows larger. But it cannot improve forever. At some point, model capacity is no longer the bottleneck. What remains is irreducible uncertainty: the information about a gene's expression that simply is not present in the rest of the measured transcriptome. That floor is an operational estimate of conditional entropy, a quantity measured in bits, rooted in information theory, and deeply informative about the structure of biology.

[The first systematic study of this phenomenon](https://arxiv.org/abs/2602.15253) used scaling-law analysis on masked-reconstruction transformers trained on single-cell RNA sequencing data from the CELLxGENE Census. Validation loss followed a clean power law with an irreducible floor. Converting this value to information-theoretic units via two independent derivation paths (from the MSE floor directly and from the Gaussian negative log-likelihood floor) yields a convergent estimate: approximately 2.30 bits of conditional entropy per masked gene position. Each tenfold increase in parameters reduces the excess loss by a factor of approximately 1.84.

What do these 2.30 bits mean? They represent the combined irreducible uncertainty from biological stochasticity (intrinsic gene expression noise), technical measurement noise, and information lost by restricting the transcriptome to the top 512 highly variable genes. Disentangling these contributions is an open problem. But even as a composite measure, the number is profoundly useful: it quantifies, for the first time, how much of a gene's expression state is *in principle predictable* from the rest of the transcriptome and how much is not.

This matters for the knowledge extraction program described here for three reasons:

**First, it validates the premise.** If gene expression were essentially random, there would be little for foundation models to learn. The fact that scaling laws emerge at all, with a measurable gap between initial loss and the irreducible floor, confirms that gene expression contains substantial learnable structure. 

**Second, it provides a benchmark for extraction.** The 2.30-bit floor tells us how much predictive information the transcriptome contains per gene. The interpretability program described below is, in a sense, the effort to decompose that information: how much comes from co-expression, how much from regulatory relationships, how much from protein-protein interaction structure, how much from cell-type identity. The scaling law gives us the total budget; mechanistic interpretability itemizes the expenditures.

**Third, it opens a new dimension of biological inquiry.** The conditional entropy of gene expression should vary across tissues, developmental stages, disease states, and perturbation conditions. Genes in tightly regulated programs should have low conditional entropy (highly predictable from context); genes driven by stochastic processes or unobserved variables should have high conditional entropy. Measuring how these quantities shift across conditions provides a quantitative handle on the structure that regulatory networks induce in transcriptomic data \- a measurement of how coupled, how redundant, and how compressible cellular state really is.

The same logic extends beyond transcriptomics. In multimodal single-cell data \- ATAC-seq, protein, spatial transcriptomics, perturb-seq \- one can ask how much each modality reduces uncertainty about the others, quantifying "what information lives where" inside cellular state. What emerges is a toolkit for probing fundamental properties of biological systems: constraints versus flexibility, coupling versus independence, effective degrees of freedom in cell-state space, all measured empirically in bits.

## **The Toolkit of Mechanistic Interpretability**

Mechanistic interpretability is the discipline of understanding what neural networks compute internally. Developed primarily in the context of large language models, it provides a suite of tools for reading the internal states of transformers. If the scaling laws tell us *how much* biological knowledge is available for extraction, mechanistic interpretability is the set of methods for performing the extraction itself.

A transformer processes its input through a sequence of layers. At each layer, two operations occur: attention, which moves information between input positions (in our case, between genes or molecules), and MLPs (feed-forward networks), which transform the information at each position. The cumulative output of all layers is the residual stream \- a high-dimensional vector for each entity that accumulates the model's evolving representation.

## **The Attention Layer**

[The first systematic application of mechanistic interpretability to single-cell foundation models](https://arxiv.org/abs/2602.17532) focused on attention patterns \- the most directly accessible component of transformer computation.

Across 37 analyses, 153 statistical tests, four cell types (K562, RPE1, primary T cells, iPSC neurons), and two models (scGPT and Geneformer), we established the following:

**Attention patterns encode structured biology.** Geneformer's attention shows clear layer-specific organization: early layers preferentially capture protein-protein interactions, while late layers encode transcriptional regulation. These two programs are anti-correlated across layers, suggesting the model progressively shifts from physical interaction to regulatory logic as information flows through its layers.

**But attention provides zero incremental value for predicting perturbation outcomes.** This is the critical negative finding. Trivial gene-level features  (expression variance, mean expression, dropout rate) massively outperform any attention-based or correlation-based edge score. 

**Expression residualization reveals the confound.** Removing expression-level information from attention scores eliminates approximately 76% of their above-chance signal. In contrast, correlation retains 91% of its signal. Attention is substantially more confounded by gene expression level than correlation \- much of what appears to be "regulatory signal" in attention is actually co-expression.

**Causal ablation confirms functional redundancy.** Zeroing out the top 5, 10, 20, or even 50 regulatory attention heads (15% of all heads) produces no measurable degradation in perturbation prediction AUROC. The model's perturbation prediction does not depend on any specific attention head \- a finding of functional redundancy, not ineffective intervention.

**The finding replicates across contexts.** The gene-level baseline dominance holds in RPE1, under propensity-score matching, and under GBDT residualization.

The lesson from the attention layer is sobering but instructive: **structured biological information in a model's internals does not automatically translate into usable predictive signal.** Attention patterns reflect biology, but they reflect it in a way that is largely redundant with information already available from expression statistics.

This motivated a turn to a different stratum of the model's representations.

## **The Geometric Layer**

If attention patterns are the model's communication channels, the residual stream is its memory \- the accumulated representation that carries forward all the information the model has computed. And it is here that the real biological structure resides.

Applying singular value decomposition (SVD) to scGPT's gene embeddings at each of its 12 layers [reveals that the model organizes genes into an interpretable multi-dimensional coordinate system](https://arxiv.org/abs/2602.22247):

**Axis 1 (SV1) encodes the secretory pathway.** The dominant spectral direction separates secreted/extracellular proteins from intracellular/cytosolic proteins. Intermediate layers transiently encode intermediate compartments \- mitochondria at layers 2-4, and then endoplasmatic reticulum lumen strengthening progressively, recapitulating the actual sequence of protein trafficking from synthesis to secretion.

**Axes 2-4 (SV2--SV4) encode protein-protein interaction networks.** Interacting proteins co-localize along these axes at all 12 layers. The encoding is not binary but quantitatively graded: splitting STRING pairs into five confidence quintiles reveals perfectly monotonic relationship between experimentally measured interaction strength and geometric proximity.

**Axes 5-7 (SV5-SV7) encode transcriptional regulatory relationships, independently of co-expression.** This is the key finding. A six-dimensional subspace (SV2--SV7) separates transcription factors from their targets at AUROC \= 0.744 across all 12 layers. Critically, after regressing out co-expression from spectral proximity, SV5-SV7 retains significant regulatory signal, while SV2--SV4's regulatory signal is entirely explained by co-expression.

The residual stream contains regulatory information that is invisible to attention-based methods and survives the same class of confound controls that eliminated attention-based signal.

The model's biological knowledge undergoes a systematic transformation:

* **Early layers** (L0--L3) maintain specific regulatory edges: which transcription factor regulates which target gene.   
* **Deep layers** compress specific relationships into categorical distinctions: transcription factor vs. target identity, cell-type membership, regulatory program identity.  
* **The effective rank** of gene representations drops 14.4-fold from layer 0 to layer 11 (from 23.6 to 1.6), but this is selective compression \- biologically meaningful axes are preserved and concentrated while noise is suppressed.

This processing hierarchy, from molecular-level specifics to cell-level categories, mirrors how biological systems themselves process information, from raw molecular signals to cell-fate decisions.

Among the most striking findings is a geometric signature of B-cell differentiation dynamics. PAX5, the definitive B-cell identity factor, occupies a stable position near the B-cell manifold centroid from the earliest layer. In contrast, BATF and BACH2 \- transcription factors recruited during the germinal center reaction \- start far from the B-cell centroid (ranks \>1,500 and \>600) and converge progressively toward PAX5 across depth.

This convergence is unique to the B-cell program: T-cell and myeloid transcription factors start close to their respective centroids from layer 0\. The model appears to have learned that B-cell identity is defined by a converging regulatory program, encoding something resembling the temporal logic of differentiation: PAX5 establishes identity first, then germinal center factors are recruited. 

The strongest evidence that the geometry reflects biology rather than model artifacts comes from cross-model comparison. Despite independent training on different data, different architectures, and different objectives, scGPT and Geneformer converge on the same geometric "map" of gene relationships.

This is analogous to independently constructed maps of a city agreeing on the positions of landmarks, being evidence that the landmarks are real features of the territory, not artifacts of the cartographer.

## **The Superposition Layer**

The spectral analysis of residual-stream geometry described above operates on the dominant axes of variation — the directions that SVD can see. But a fundamental insight from language model interpretability is that neural networks can encode far more features than they have dimensions, through a phenomenon called *superposition*: features are represented as nearly orthogonal directions in a space too small to accommodate them all as truly orthogonal, with the resulting interference tolerated because most features are sparse (rarely active simultaneously). If biological foundation models exhibit analogous superposition, then the spectral axes described above, however informative, capture only the tip of the representational iceberg.

Sparse autoencoders (SAEs) are the standard tool for resolving superposition. They decompose dense neural activations into a much larger set of sparse, interpretable features — directions in representation space that correspond to individual concepts the network has learned. Our [systematic application of SAEs to biological foundation models](https://arxiv.org/abs/2603.02952) trained TopK SAEs on the residual stream at every layer of Geneformer V2-316M (18 layers, d=1152) and scGPT whole-human (12 layers, d=512).

The headline finding is that superposition in biological foundation models is massive. **99.8% of SAE features are invisible to SVD** — they exist in directions that singular value decomposition cannot detect, because they are encoded as nearly-orthogonal vectors in a space of far lower dimensionality. The biological knowledge accessible through spectral analysis, substantial as it is, represents a small fraction of what the models have actually learned.

What do the 107,000+ features encode? Systematic annotation against Gene Ontology, KEGG, Reactome, STRING, and TRRUST reveals that **29–59% of features map to known biological programs** — pathway membership, protein-protein interaction modules, functional annotations, regulatory associations. The annotation rate follows a U-shaped profile across layers: early layers encode molecular-level programs (ribosomal assembly, metabolic enzymes), middle layers develop more abstract representations with lower annotation rates, and deep layers re-specialize for prediction, with annotation rates rising again. This U-shaped profile mirrors the hierarchical abstraction observed in language model SAEs, where early features capture syntactic regularities, middle features become more abstract, and late features specialize for next-token prediction.

Features organize into co-activation modules — groups of features that fire together across cells. Geneformer contains 141 such modules across its 18 layers, scGPT contains 76 across its 12 layers, with 5–7 modules per layer in both models. Despite the different dictionary sizes (4,608 versus 2,048 features per layer), the number of modules per layer is comparable, suggesting that the number of biological programs discoverable by SAEs scales sub-linearly with dictionary size. Causal feature patching confirms that individual features have measurable causal impact on the model's computations.

A particularly striking finding concerns cross-layer information flow. Tracking decoder weight similarity across layers reveals information highways — features whose representational content persists across depth. Between 63% and 99.8% of features at any given layer participate in such highways. Yet features are overwhelmingly layer-specific in their precise identity: only 2–3% of features at any layer match a feature at the adjacent layer by decoder weight similarity, and no layer 0 feature survives past layer 11 in Geneformer. The model progressively transforms its representations rather than simply passing features forward. And feature persistence anti-correlates with biological content — the features that annotate most richly to known biology are also the ones that transform most rapidly across depth.

So, SAEs decompose activations into features, but features at different layers are not independent — they are connected by the model's computation. The natural next question is whether these inter-layer connections form biologically meaningful circuits. [Causal circuit tracing answers this question](https://arxiv.org/abs/2603.01752) by ablating SAE features at one layer and measuring the resulting changes in feature activations at all downstream layers.

Applied to both Geneformer and scGPT across four experimental conditions, this analysis produced a graph of 96,892 causal edges from 80,191 forward passes. The results reveal several universal properties of biological computation in these models:

**Inhibitory dominance.** Between 65% and 89% of causal edges are inhibitory: ablating a source feature *increases* downstream feature activations. This means the model's default mode of inter-feature interaction is suppressive, a computational architecture reminiscent of lateral inhibition in biological neural circuits and winner-take-all dynamics in competitive networks.

**Biological coherence.** Approximately 53% of causal edges connect features that share Gene Ontology annotations — meaning more than half of all feature-to-feature causal interactions in the model connect biologically related programs. This coherence is invariant to model architecture and cell type.

**Cross-model consensus.** Despite independent training, Geneformer and scGPT share 1,142 conserved biological domain pairs (a 10.6× enrichment over chance, p \< 0.001). These consensus circuits preferentially involve disease-associated domains: disease-relevant domain pairs are 3.59× more likely to appear in the cross-model consensus than non-disease pairs. The models independently converge on the same computational pathways for disease-relevant biology.

**Biologically interpretable cascades.** Individual circuits resolve into recognizable biological programs. A particularly clear example is a three-layer DNA damage response cascade in Geneformer: a Layer 0 DNA damage response feature drives a Layer 5 DNA damage response feature (sharing 72 ontology terms including mitotic regulation and spindle checkpoint), which in turn drives a Layer 17 G2/M transition feature (sharing 75 terms including sister chromatid separation and p53 signaling). The Layer 0 source also directly drives the Layer 17 target through a "skip connection," revealing a parallel fast-path. This cascade recapitulates the complete biological progression from DNA damage detection through cell cycle arrest — a sequence established by decades of experimental cell biology, here recovered from model internals alone.

## **Manifolds: From Extracting Knowledge To Extracting Algorithm**

All of the findings described above are, in a sense, analytical: they characterize what the models know without putting that knowledge to practical use. The deepest test of whether mechanistic interpretability can extract biologically useful knowledge from foundation models is whether it can produce a standalone algorithm — a tool that works outside the model, on new data, solving a real biological problem — derived entirely from the model's internal representations.

First such discovery came through systematic exploration of scGPT's attention tensor using an autonomous AI executor-reviewer loop that searched over candidate manifold hypotheses by varying biological targets (developmental ordering, regulatory structure, communication geometry), featurization strategies (attention drift, raw embeddings, mixed operators), and geometric fitting methods (Isomap, geodesic-MDS, LET).

What emerged is that [scGPT internally encodes a compact, approximately 8–10-dimensional hematopoietic manifold](https://arxiv.org/abs/2603.10261) with significant developmental branch structure. The manifold captures the major differentiation lineages of the blood system: distinct branches emerge around stem/progenitor, erythroid, granulocytic, monocyte/macrophage, and lymphoid/T-cell regions. This structure was validated on a strict non-overlap external panel from Tabula Sapiens, with no data leakage between discovery and validation.

The manifold generalizes across donors, tissues, and experimental contexts without any retraining.

To isolate this geometry and turn it into a usable algorithm, a general three-stage extraction method was developed:

**Stage 1: Direct operator export.** Native attention weights are read from the frozen scGPT checkpoint. No training occurs; the operator is simply the model's own computation, extracted verbatim.

**Stage 2: Lightweight learned adaptor.** A minimal adaptor layer is trained to project the raw attention output onto the manifold coordinates. This is the only trained component, and it uses far fewer parameters than a standard MLP probe.

**Stage 3: Task-specific readout.** A simple readout layer maps manifold coordinates to the desired biological prediction (pseudotime ordering, cell-type classification, or developmental stage assignment).

The resulting algorithm is a standalone tool — it does not require the full foundation model at inference time. Multi-stage compaction reduced the operator from three pooled attention heads to a single head (5.9 MB) without statistically significant loss, and further to a rank-64 surrogate (0.73 MB). **The extracted algorithm is roughly 1,000× smaller than the full model and runs 34.5× faster than a standard 3-layer MLP probe of the frozen embeddings**.

In 88-split donor-holdout benchmarks against scVI, Palantir, DPT, CellTypist, PCA, and raw-expression baselines, the extracted algorithm achieves the strongest pseudotime-depth ordering — outperforming all comparators on the task of aligning cells along their developmental trajectory. On cell-type classification, it is competitive with established methods while being Bonferroni-Holm significantly better than standard probing on 6 of 8 classification endpoints.

This is, to our knowledge, the first biologically useful, competitive algorithm extracted from a foundation model via mechanistic interpretability. The algorithm was not designed by a human biologist; it was discovered inside the model's weights and surgically removed.

## **The Synthesis**

Taken together, five lines of investigation — attention patterns, residual-stream geometry, sparse autoencoders, causal circuit tracing, and algorithm extraction — paint a coherent and increasingly detailed picture:

1. **Biological foundation models learn real biological structure, at a scale far exceeding what linear methods can detect.** The evidence now includes layer-specific organization of protein interactions versus regulatory relationships, quantitatively graded PPI encoding, co-expression-independent regulatory geometry, cross-model convergence, dynamic signatures of differentiation programs, 107,000+ SAE features with rich biological annotation, biologically coherent causal circuits, and an extractable developmental manifold. The massive superposition revealed by SAEs — 99.8% of learned features invisible to SVD — means that the models' biological knowledge is far richer than even the spectral analyses suggested.  
2. **This knowledge is organized hierarchically, both within and across representational substrates.** Early layers preserve specific molecular interactions; deep layers encode categorical distinctions. Attention captures regulatory co-occurrence; residual-stream geometry captures physical interactions and regulatory identity; SAE features capture pathway membership and functional modules; causal circuits connect features into biologically coherent processing cascades. These are complementary views of the same underlying biology, visible at different scales and through different analytical lenses.  
3. **The extraction problem is solvable, and has been solved in at least one case.** The hematopoietic manifold demonstrates that mechanistic interpretability can produce standalone, biologically useful algorithms from foundation model internals — algorithms that outperform established methods, generalize across donors and tissues, compress to sub-megabyte scale, and admit detailed mechanistic decomposition into interpretable biological factors. This is no longer a theoretical aspiration; it is an empirical fact.  
4. **Different biological knowledge lives at different depths and in different representational substrates, and reading it requires matched analytical methods.** Spectral analysis reads the dominant axes; SAEs resolve superposition; causal circuit tracing maps inter-feature computation; operator extraction isolates functional algorithms. No single method suffices.  
5. **The total amount of extractable knowledge is measurable.** Scaling-law analysis provides an information-theoretic ceiling: approximately 2.30 bits of conditional entropy per gene, representing the total predictive structure in the transcriptome that models can in principle capture.

## **The Research Program: Extracting the Complete Map**

We have a vast territory — the totality of molecular biology in human cells. Several frontiers remain unexplored or only partially explored:

**Generalization of geometric findings.** The geometric findings are concentrated in immune and cancer cell lines, though the hematopoietic manifold extraction and multi-tissue SAE training have begun to extend the reach. Whether the same geometric organization holds across all tissues is unknown. The immune system's unusually modular regulatory architecture may make it a "best case" for geometric interpretability. Systematic evaluation across the full Tabula Sapiens atlas and other tissue atlases is needed — and the extraction methodology demonstrated on the hematopoietic manifold provides a concrete template for doing so, tissue by tissue, developmental system by developmental system.

**MLP-stored knowledge.** Attention and residual-stream geometry have been examined in depth, and SAEs have characterized the feature-level structure of the residual stream, but the MLP layers remain largely unprobed as a distinct computational substrate. These may contain a different class of biological knowledge: stored "facts" about gene regulation that are activated in specific contexts, analogous to the factual recall circuits identified in language models.

**Dynamic context dependence.** The analyses described above average representations across cells (or aggregate them into cell-type anchors), but the model generates different representations for the same gene in different cellular contexts. The hematopoietic manifold shows that context-dependent structure exists and can be extracted, but understanding how the complete biological map changes across cell states — how the same gene is represented differently in a stem cell versus a terminally differentiated neutrophil — is an open question with profound implications for understanding context-dependent gene regulation.

**The regulatory logic gap.** The most consistent finding across all analytical methods is that these models encode organized biological knowledge but not causal regulatory logic. Understanding *why* this is the case — whether it reflects a limitation of the training objective (masked gene prediction does not require learning causal direction), of the training data (single-cell snapshots contain correlational but not interventional information), or of the model architecture (transformers may not naturally represent asymmetric causal relationships) — is essential for determining whether future models could learn regulatory logic, or whether this requires fundamentally different approaches such as training on perturbation data or incorporating causal inductive biases.

**Systematic algorithm extraction.** The hematopoietic manifold extraction is a proof of concept. The same three-stage methodology should be systematically applied to other developmental systems (neurogenesis, myogenesis, epithelial differentiation), other biological targets (cell-cell communication, metabolic state, spatial organization), and other foundation models. Each successful extraction produces a compact, interpretable, validated tool; each failure is informative about the boundaries of what the models have learned. The goal is not one extracted algorithm but a library of them.

**Information-theoretic decomposition across biology.** The scaling-law framework described earlier provides a methodology that extends far beyond a single entropy estimate. The same methodology applied systematically would produce an information-theoretic atlas of cellular state: which genes are tightly constrained by their context (low conditional entropy), which behave as "wildcards" (high conditional entropy), and how these profiles shift under stress, differentiation, or disease. Extending to multimodal data enables measuring how much each modality reduces uncertainty about the others, quantifying the information architecture of the cell.

**Feature atlas completion and community use.** The release of SAE feature atlases as interactive web platforms opens the possibility of community-driven discovery. Biologists with domain expertise in specific pathways or disease contexts can examine whether the models have learned features relevant to their questions, generating hypotheses that no single research group could produce alone.

## The Role of AI Agents

The scale of the problem described above is beyond what traditional research methods can address. [Testing 141 hypotheses with full confound controls](https://arxiv.org/abs/2602.22289) took 52 iterations of an autonomous screening loop. The SAE atlas characterization involved 82,525 features across 18 layers. The hematopoietic manifold discovery required systematic search over biological targets, featurization strategies, and geometric fitting methods. The complete biological knowledge map of even a single foundation model could require thousands of such campaigns.

This is where AI agents become not merely helpful but essential. The autonomous executor-reviewer loop has now been validated in multiple contexts: the topological hypothesis screen (52 iterations, 141 hypotheses), the SAE atlas production and annotation pipeline, and the hematopoietic manifold discovery (which was conducted through a two-phase autonomous research loop driven by an AI executor-reviewer pair operating under pre-registered quality gates). In each case, the loop designs experiments, executes with appropriate controls, evaluates results, identifies promising directions, and iterates — recording every negative result alongside every positive, building comprehensive maps of what the model does and does not encode.

The hypothesis is that the extraction of biological knowledge from foundation models can be substantially automated: AI agents propose interpretability hypotheses, execute experiments with appropriate controls, evaluate results, identify promising directions, and iterate. Human scientists set the questions, validate the biological plausibility of findings, and integrate the results into the broader scientific context. This division of labor has already accelerated the mapping program by what appears to be at least an order of magnitude, and there is no reason to expect this ceiling has been reached.

## What Success Looks Like

The end state of this research program — achievable not immediately, but within the foreseeable trajectory of current methods — is a human-readable, validated, comprehensive description of the biological knowledge contained in foundation models. Some components of this end state have already been partially realized:

* A **catalog of biological axes** in representation space: which dimensions encode which biological variables, at which layers, with what fidelity.   
* A **library of extracted algorithms**: standalone, compact, interpretable tools derived from model internals, each solving a specific biological problem — developmental ordering, cell-type classification, communication geometry — validated against established methods and annotated with mechanistic decompositions.   
* A **causal circuit atlas**: a map of how biological features interact computationally within the model, which programs drive which, and where the model's internal biology aligns with or diverges from known experimental results.   
* A **regulatory network** extracted from model geometry, validated against perturbation data, annotated with confidence levels and confound assessments. *This remains the primary open challenge, given the consistent finding that these models encode co-expression rather than causal regulation.*  
* A **differential map** across cell types and conditions: which biological relationships the model represents differently in different contexts.  
* An **audit report** for each model: where its internal biology aligns with known ground truth, where it diverges, and where it contains novel predictions.  
* A **discovery pipeline** for identifying model-encoded biological relationships that are not yet in any database, prioritized by confidence and testability.

This is ambitious. But the first steps have been taken, the methods exist, several deliverables are already in progress, and the problem has been shown to be tractable.

There is a claim implicit in this research program that deserves to be stated explicitly.

The traditional approach to understanding biology is to study biological systems directly: run experiments, measure outcomes, build mechanistic models from the ground up. This approach has been spectacularly successful, but also spectacularly slow. Decades of work have produced databases that cover a fraction of the regulatory relationships in a single cell type.

Foundation models offer a fundamentally different approach. They consume the aggregate output of biological systems — the patterns of gene expression across millions of cells — and compress that aggregate into internal representations. If those representations faithfully capture the underlying biological structure, then studying the *model* becomes a way of studying *biology itself*, at a scale and speed that direct experimentation cannot match.

The analogy is to cartography. For centuries, maps were drawn by direct survey — walking the territory, measuring distances, recording landmarks. This produced accurate but painfully slow accumulation of geographic knowledge. Satellite imagery changed the paradigm: a single instrument, observing from above, could produce a complete map in a fraction of the time. The satellite's map still needed ground truth validation, and it had its own distortions and blind spots. But it transformed what was possible.

Biological foundation models are the satellite. Mechanistic interpretability is the method for reading their images. 

### **References**

1. Kendiukhov, I. (2025). Systematic evaluation of single-cell foundation model interpretability reveals attention captures co-expression rather than unique regulatory signal. *arXiv:2602.17532*.  
2. Kendiukhov, I. (2026). What topological and geometric structure do biological foundation models learn? Evidence from 141 hypotheses. *In preparation*.  
3. Kendiukhov, I. (2026). Multi-dimensional spectral geometry of biological knowledge in single-cell transformer representations. *In preparation*.  
4. Kendiukhov, I. (2025). Scaling laws for masked-reconstruction transformers on single-cell transcriptomics. *arXiv:2602.15253*.  
5. Kendiukhov, I. (2026). Sparse autoencoders reveal organized biological knowledge but minimal regulatory logic in single-cell foundation models: a comparative atlas of Geneformer and scGPT. *arXiv:2603.02952*.  
6. Kendiukhov, I. (2026). Causal circuit tracing reveals distinct computational architectures in single-cell foundation models: inhibitory dominance, biological coherence, and cross-model convergence. *arXiv:2603.01752*.  
7. Kendiukhov, I. (2026). Discovery of a hematopoietic manifold in scGPT yields a method for extracting performant algorithms from biological foundation model internals. *arXiv:2603.10261*.  
8. Cui, H. et al. (2024). scGPT: toward building a foundation model for single-cell multi-omics using generative AI. *Nature Methods*, 21(8):1470–1480.  
9. Theodoris, C.V. et al. (2023). Transfer learning enables predictions in network biology. *Nature*, 618:616–624.  
10. Elhage, N. et al. (2022). Toy models of superposition. *Transformer Circuits Thread*.  
11. Park, K. et al. (2023). The linear representation hypothesis and the geometry of large language models. *arXiv:2311.03658*.  
12. Han, H. et al. (2018). TRRUST v2: an expanded reference database of human and mouse transcriptional regulatory interactions. *Nucleic Acids Research*, 46(D1):D199–D202.  
13. Szklarczyk, D. et al. (2023). The STRING database in 2023\. *Nucleic Acids Research*, 51(D1):D483–D489.  
14. Kaplan, J. et al. (2020). Scaling laws for neural language models. *arXiv:2001.08361*.

