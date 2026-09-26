# Proof-audit obligation checklists

Use only the sections relevant to the claim.

## General logic and typing

- Every symbol, map, category, object class, and quantifier is defined.
- The conclusion follows from the stated—not intended—hypotheses.
- No implication is used in the reverse direction without proof.
- No induction, minimality, or compactness argument loses a boundary case.
- Definitions are stable across the proof; no hidden strengthening occurs.
- Every witness, representative, deformation and intermediate object remains in
  the domain named by the definition.
- A convenient replacement object is connected to the claimed object by a
  proved comparison at the exact level used.

## Graded, differential, and sign-sensitive arguments

- Differential and operation degrees are consistent.
- All Koszul crossings and suspensions are accounted for.
- Chain maps commute with differentials with the claimed sign.
- Homology-level statements are not inferred from chain-level data without the
  required quasi-isomorphism, convergence, or filtration argument.
- Test the smallest two-operation and three-operation orders.
- Check absolute degrees and shift directions, not only signs or parity.
- Include arity zero/one and the minimum parameter when units, augmentation or
  the start of an induction can behave differently.

## Category, variance, and duality

- Covariance/contravariance and left/right actions are correct.
- Opposites, duals, invariants, coinvariants, and completions are justified.
- Finite-type assumptions needed for dualization are present.
- Naturality squares and coherence data are checked, not inferred from matching
  object labels.

## Spectral sequences and filtrations

- Filtration is exhaustive, separated/complete as needed, and preserved.
- Page indexing and bidegrees are consistent.
- Convergence is strong enough for the claimed target.
- Extension problems are addressed.
- A collapse claim includes all possible differential sources and targets.

## Topology and homotopical algebra

- Model-category or infinity-categorical replacements are admissible.
- Point-set maps represent the claimed derived maps.
- Homotopy invariance and cofibrancy/fibrancy assumptions are sufficient.
- Local systems, basepoints, connectedness, orientations, and tangential data
  are not dropped.

## Representation and symmetry arguments

- Group actions and conventions are explicit.
- Stabilizers, orbit multiplicities, component permutations, and character
  signs are correct.
- Restriction/induction and invariant/coinvariant passages use the right side.
- Dimension checks and smallest nontrivial representations agree.

## Computation-dependent claims

- The code implements the stated mathematical object.
- Arithmetic domain and normalization are correct.
- Bounds cover the claimed range.
- Randomness, numerical tolerances, and rational reconstruction are controlled.
- Independent invariants or implementations catch correlated bugs.
- Exhaustive claims match the actual iterator cardinality, filters and skipped
  cases; sampling has a separately proved coverage reduction.
- Serialized output and its interpretation refer to the same object and run.

## Probability and statistical inference

- The probability space, sampling model, and dependence structure (i.i.d.,
  exchangeable, stationary, mixing, clustered) are stated and actually used.
- Modes of convergence (almost sure, in probability, in distribution, in
  L^p) are not interchanged; a limit theorem's hypotheses (moments,
  Lindeberg/Lyapunov, identifiability, compact parameter space) are verified.
- Unbiasedness, consistency, and efficiency are distinct claims; a consistent
  estimator is not thereby unbiased, and asymptotic variance is not finite-sample
  variance.
- Interchanges of limits, expectations, derivatives, and integrals cite a
  dominated/monotone convergence or uniform-integrability argument.
- Delta-method, Slutsky, and continuous-mapping steps apply to the exact
  functional used, with differentiability at the true parameter.
- Test size, power, p-value, and confidence-interval coverage are stated at the
  level proved (exact, asymptotic, or under a named null); multiple-testing
  control (FWER vs. FDR) matches the claim.
- Bayesian claims name the prior, likelihood, and posterior propriety; a
  posterior concentration statement is not a frequentist coverage statement.

## Machine-learning theory and optimization

- The hypothesis class, loss, and data distribution are fixed before a
  generalization bound is stated; the bound's quantifier order ("with
  probability 1-δ, for all h") is preserved.
- Complexity measures (VC dimension, Rademacher complexity, covering numbers,
  PAC-Bayes KL term) are computed for the class actually trained, including
  data-dependent model selection.
- Optimization guarantees state convexity, smoothness (L-Lipschitz gradient),
  strong convexity, step-size schedule, and whether the rate is for the last
  iterate, the average iterate, or the best iterate.
- Stochastic-gradient arguments state the variance assumption and the filtration
  on which expectations are conditioned.
- Nonconvex claims do not upgrade stationary-point convergence to global
  optimality without an additional landscape argument.
- Neural-network results specify width/depth regime, initialization,
  parameterization (e.g., NTK vs. mean-field), and activation assumptions.
- Matrix and tensor steps check dimensions, rank, positive (semi)definiteness,
  and invertibility; pseudo-inverse is not silently used as an inverse.

## Causal identification

- The causal estimand (ATE, ATT, CATE, LATE, policy value) is defined in
  potential-outcome or structural terms before estimation.
- Identification assumptions (consistency/SUTVA, exchangeability or
  back-door criterion, positivity/overlap, exclusion restriction, parallel
  trends) are stated and each is used where claimed.
- A DAG-based argument lists the adjustment set and checks it against the
  back-door or front-door criterion; colliders and mediators are not adjusted
  for by accident.
- Predictive accuracy is not presented as evidence of a causal effect.

## Empirical claims about models or operational data

- The claim names the dataset, split, metric, and comparison baseline; a
  held-out score supports only that population and split.
- Train/validation/test separation is respected across preprocessing, feature
  selection, hyperparameter tuning, and early stopping (no leakage).
- Temporal data use time-respecting splits; target leakage from post-outcome
  fields is excluded.
- Uncertainty is reported (seeds, confidence intervals, or resampling); a
  single-run improvement is not a significant improvement.
- For enterprise/operational data (for example SAP ECC extracts), the KPI
  formula, table/field provenance, extraction filters, and date range are the
  ones stated in the claim; configuration-dependent semantics are marked as such.

## External sources

- Exact version, theorem, hypotheses, and notation translation are recorded.
- The source proves rather than merely states or suggests the result.
- No unstated functoriality, normalization, or completion is supplied by the
  citation.
