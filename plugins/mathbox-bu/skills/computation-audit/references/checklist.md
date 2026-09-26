# Mathematical computation checklist

## Representation of mathematical objects

- Indexing conventions and base cases match the definition.
- Basis order, orientations, signs, actions, and quotient relations are explicit.
- Canonicalization does not identify distinct objects or split equivalent ones.
- Sparse/dense and exact/approximate representations preserve semantics.

## Algebra and homological computation

- Check `d^2 = 0`, degree shifts, Leibniz signs, and filtration preservation.
- Matrix rank is computed over the intended field or ring.
- Modular computations justify reconstruction or characteristic transfer.
- Invariants/coinvariants and left/right actions use consistent conventions.
- Dimensions, Euler characteristics, traces, or characters match known cases.

## Numerical computation

- Precision and tolerance are justified by conditioning/error bounds.
- Results are stable under increased precision and altered algorithms.
- Interval, exact, or certified methods are used when the claim requires them.
- A visually plausible plot or residual alone is not certification.

## Statistical and machine-learning experiments

- Dataset source, version or snapshot date, license, and row/column counts are
  recorded; the analysis population matches the claim's population.
- Train, validation, and test splits are fixed before modeling. Preprocessing,
  imputation, scaling, feature selection, and resampling (e.g., SMOTE) are fit
  on training folds only.
- Time-series and panel data use time-respecting or grouped splits; no future
  or post-outcome information enters features (target leakage).
- Hyperparameter search is nested or uses a separate validation set; the test
  set is touched once for the reported result.
- Metrics fit the question (e.g., calibration and PR-AUC for imbalance,
  MAPE/sMAPE/MASE caveats for forecasts); baselines include a naive model.
- Results report several seeds or resamples with intervals; claimed
  improvements are tested with an appropriate paired test or interval.
- Statistical assumptions (normality, homoscedasticity, independence,
  stationarity, proportional hazards) are checked before inference relies on them.
- Simulation studies record the data-generating process, number of
  replications, Monte Carlo standard error, and seeds.
- GPU/cuDNN nondeterminism, framework versions (Python, NumPy, pandas,
  scikit-learn, PyTorch/TensorFlow, R packages), and hardware are recorded.
- A notebook's hidden state is not provenance; claim-supporting results are
  regenerated from a clean kernel or a script.

## Enterprise operational data

- The project records authorization to use the data (employer approval, data
  use agreement, and IRB determination where human-subjects data are
  involved). Raw extracts stay out of Git and out of external tools unless the
  owner authorizes it.
- Identifiers of people, customers, suppliers, and prices are removed,
  aggregated, or pseudonymized before analysis leaves the approved environment.
- For SAP ECC extracts, record the source tables and fields (for example
  MSEG/MKPF, EKKO/EKPO, VBAK/VBAP, LIKP/LIPS), client, plants, company codes,
  movement types, document date range, extraction method, and extraction
  timestamp.
- KPI definitions (OTIF, inventory turns, fill rate, lead time) are written as
  formulas with their date fields and tolerance windows; configuration-dependent
  or customer-specific (Z/Y) semantics are marked as unverified until confirmed.
- Joins are checked for key cardinality (header vs. item vs. schedule line) so
  measures are not duplicated or dropped.
- Currency, unit-of-measure, and fiscal-calendar conversions are explicit.

## Reproducibility and systems

- Random seed and random generator are recorded.
- Parallel reductions are deterministic or their nondeterminism is bounded.
- Cache keys include all semantic inputs and convention versions.
- Environment and library versions are recorded.
- Output serialization is round-trip tested when reused as evidence.
- Timeouts and memory limits are reported as limits, not negative results.
