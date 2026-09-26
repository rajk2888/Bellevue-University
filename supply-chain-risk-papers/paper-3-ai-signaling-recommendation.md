# An AI-Driven Early-Warning, Signaling, and Supplier Recommendation Framework for Mitigating Supplier-Constraint Risk

**Author:** [Your Name]
**Affiliation:** Bellevue University
**Course / Venue:** [Course number or target journal]
**Date:** [Date]

---

## Abstract

Supplier risk is usually managed with backward-looking scorecards that report failures after they happen. This paper proposes a closed-loop AI framework that (1) *predicts* constraint-driven supplier disruptions three months ahead, (2) *signals* the predicted risk, its supplier-specific drivers, and recommended corrective actions back to suppliers through a Green/Amber/Red protocol, and (3) *recommends* which suppliers to use and how to allocate demand among them, using a risk-adjusted TOPSIS ranking and a linear program. The framework rests on signaling theory, so the buyer's risk signals are designed to prompt supplier disclosure and correction, not only buyer-side contingency. We demonstrate it with an open prototype on a synthetic panel of 240 suppliers observed over 24 months. On a time-based hold-out, the learned models beat a rule-based scorecard (PR-AUC 0.35 vs. 0.21; base rate 12.6%). In this setting, a regularized logistic regression performed as well as gradient boosting or better. The risk-aware allocation cut expected disrupted volume by 54% compared with cost-only allocation, for a 12.9% rise in purchase price and a 20.3% drop in total expected cost. We discuss data requirements, governance, fairness to suppliers, and a validation roadmap for real-world deployment.

**Keywords:** artificial intelligence, machine learning, supplier risk, early warning, signaling theory, supplier selection, TOPSIS, explainable AI

---

## 1. Introduction

> *This introduction corresponds to Variant C in `00-introduction-variants.md`.*

Supplier risk has traditionally been managed with backward-looking tools: annual audits, quarterly scorecards, and spreadsheets rating suppliers on last period's delivery and quality. These tools tell a buyer that a supplier *has* failed. They rarely warn that a supplier *is about to* fail. Meanwhile, firms now collect large volumes of operational data that could reveal constraints early, including PO acknowledgements, advance ship notices, lead-time histories, defect logs, payment behavior, news, and geospatial hazard data.

Reviews of AI in supply chain risk management (SCRM) show fast growth but recurring gaps: models built on one-off data, weak explainability, and prediction that stops short of decisions (Baryannis et al., 2019). Case evidence shows that supplier delivery disruptions can be predicted from routine transactional data (Brintrup et al., 2020). What is still missing is a design that **closes the loop from prediction to action**, on the supplier's side as well as the buyer's.

Building on the constraint typology of Paper 1 and the expected-loss model of Paper 2, this paper makes four contributions:

1. **Architecture.** A four-layer design (data → prediction → signaling → recommendation) for managing supplier-constraint risk.
2. **Signaling protocol.** A theory-grounded method for turning model outputs into explainable, action-oriented signals *to suppliers*.
3. **Recommendation engine.** A risk-adjusted multi-criteria ranking combined with an optimization model that allocates demand.
4. **Reproducible prototype.** Open Python code (`prototype/supplier_risk_ai.py`) that implements all four layers and reports honest baseline comparisons.

---

## 2. Related Work

**AI for SCRM.** Baryannis et al. (2019) classify AI approaches to SCRM into mathematical programming, network-based, agent-based, and machine-learning methods. They note that ML use is growing but that explainability and decision integration are rarely addressed. Brintrup et al. (2020) predict supplier delivery delays in complex-asset manufacturing from order-level features and find that engineered features on supplier history carry most of the predictive signal.

**Model choice and interpretability.** Gradient-boosted trees (Chen & Guestrin, 2016; Friedman, 2001) are strong defaults for tabular data because they capture nonlinear interactions, such as the compounding constraints proposed in Paper 1 (P3). Rudin (2019) argues that in high-stakes decisions, inherently interpretable models should be preferred when they perform comparably. We therefore benchmark both kinds of model. SHAP values (Lundberg & Lee, 2017) are the most common way to explain individual predictions. Our prototype uses a lighter perturbation-based attribution in the same spirit.

**Supplier selection.** Multi-criteria decision-making (MCDM) methods, including the analytic hierarchy process (Saaty, 1980), TOPSIS (Hwang & Yoon, 1981), and hybrids (Ho et al., 2010), dominate the supplier-selection literature. Most rely on static, historical criteria. Few use *predicted* risk as a criterion. Optimization-based order allocation with disruption risk goes back at least to Tomlin (2006).

**Signaling.** Signaling theory (Connelly et al., 2011; Spence, 1973) explains how parties communicate hidden attributes. Supply chain research has used it mostly for supplier→buyer quality signals such as certifications. We use it for **buyer→supplier risk signals**, which are designed to change supplier behavior and prompt disclosure of private constraints (Paper 1, P7).

---

## 3. Framework Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1 — DATA                                                               │
│ ERP/SRM: POs, ASNs, receipts, lead times, OTIF, defects │ Finance: credit,   │
│ payment behaviour │ External: geo-hazard, sanctions, news │ Supplier surveys │
└───────────────┬──────────────────────────────────────────────────────────────┘
                ▼  feature engineering (trailing windows, trends, volatility)
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2 — PREDICTION   P(disruption in next h months | features)             │
│ Baseline scorecard ▸ Logistic regression ▸ Gradient boosting (model selection│
│ by PR-AUC on time-based hold-out; calibration checked with Brier score)      │
└───────────────┬──────────────────────────────────────────────────────────────┘
                ▼  risk probability + local driver attribution
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3 — SIGNALING     GREEN / AMBER / RED + top drivers + actions          │
│  → to SUPPLIER: driver-specific corrective request, support offer            │
│  → to BUYER:    internal contingency (buffer, alternate, review cadence)     │
└───────────────┬──────────────────────────────────────────────────────────────┘
                ▼  risk estimates as selection criterion
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAYER 4 — RECOMMENDATION                                                     │
│ Risk-adjusted TOPSIS ranking per category ▸ LP demand allocation with        │
│ capacity, share caps, and expected shortage cost                             │
└───────────────┬──────────────────────────────────────────────────────────────┘
                ▼
        Outcomes (disruptions, supplier responses) feed back into Layer 1
```

### 3.1 Layer 1: Data and features

Features are organized by the seven constraint classes of Paper 1:

| Constraint class | Example features (prototype names in `code`) | Typical source |
|---|---|---|
| C1 Capacity | `capacity_utilization`, `backlog_growth` | Supplier portal, PO backlog |
| C2 Lead-time | `lead_time_days`, `lead_time_cv` | ERP receipts vs. PO dates |
| C3 Quality | `defect_ppm` | QMS / incoming inspection |
| C4 Financial | `financial_health` | Credit bureau, payment history |
| C5 Geographic | `geo_risk_index` | Hazard and country-risk indices |
| C6 Structural | `single_source`, `sub_tier_concentration` | Sourcing records, tier-2 mapping |
| Relational / responsiveness | `response_latency_days`, `otif_rate` | EDI acknowledgements, scorecards |

In real deployments, unstructured sources such as news, earnings-call transcripts, and regulatory notices can be turned into features with natural-language processing (for example, counts of negative events per supplier). This extends coverage to compliance (C7) and early financial distress.

### 3.2 Layer 2: Prediction model

For supplier *i* at month *t*, with feature vector **x**ᵢₜ, the target is

$$y_{it} = \mathbb{1}\{\text{disruption at } i \text{ in } (t, t+h]\}, \quad h = 3 \text{ months},$$

and the model estimates p̂ᵢₜ = P(yᵢₜ = 1 | **x**ᵢₜ). Three design choices matter more than the choice of algorithm:

1. **Time-based validation.** Train on earlier months and test on later ones. Random splits leak future information across a supplier's own history and overstate accuracy.
2. **Imbalance-aware metrics.** Disruptions are rare. PR-AUC and precision among the top-ranked suppliers are more informative than accuracy or even ROC-AUC.
3. **Calibration.** Because p̂ feeds expected-loss calculations (Paper 2) and signal thresholds, probabilities must be calibrated (Brier score, reliability plots), not merely rank-ordered.

### 3.3 Layer 3: Signaling protocol

**Tiering.** Calibrated risk is mapped to three tiers:

| Tier | Threshold (prototype) | Supplier-facing signal | Buyer-internal action |
|---|---|---|---|
| 🟢 GREEN | p̂ < 0.15 | Recognition in quarterly business review | Standard monitoring |
| 🟠 AMBER | 0.15 ≤ p̂ < 0.35 | Early notice + top drivers + requested action + offer of support | Higher monitoring cadence; pre-qualify alternate; share firm forecast |
| 🔴 RED | p̂ ≥ 0.35 | Formal risk notice + joint mitigation plan with milestones | Activate contingency: buffer stock, alternate source, weekly executive review |

In practice, thresholds should be set from the Paper 2 cost structure. Alerting on supplier *i* is worthwhile when p̂ᵢ · *ΔIᵢ* exceeds the cost of acting, where *ΔIᵢ* is the impact avoided by early action.

**Explanations.** For each flagged supplier, the prototype computes the risk contribution of each feature *j* as the drop in predicted risk when *xⱼ* is reset to the portfolio median:

$$\phi_{ij} = \hat{p}(\mathbf{x}_i) - \hat{p}(\mathbf{x}_i \mid x_j \leftarrow \text{median}_j)$$

The top positive contributors become the *drivers* in the signal. Each driver is mapped to a standard corrective action (for example, `capacity_utilization` → "share a firm 6-month forecast and discuss a capacity-option contract").

**Design principles grounded in signaling theory.**
- **Specificity.** A signal that names drivers and actions can be acted on. A bare score is not.
- **Credibility.** Signals come with a commitment. An AMBER notice offers support, not exit, which makes it rational for the supplier to disclose private constraints (Paper 1, P7).
- **Reciprocity.** Suppliers can dispute or add context to a signal, for example new capacity coming online. This feedback becomes a feature and a label-correction source.
- **Proportionality.** Escalation is tiered so that suppliers are not overwhelmed by false alarms, which would erode signal credibility.

**Example supplier-facing signal (generated from prototype output for supplier S174):**

> **Supplier Risk Notice — RED | Supplier S174 | Category C06**
> Our forward-looking risk assessment shows elevated disruption risk for the next quarter (estimated 69%). The main contributing factors are: (1) single-source status for parts you supply, (2) concentration in your own sub-tier sourcing, and (3) growth in open-order backlog.
> **Requested actions:** Please share a continuity plan (including any option for dual-site production or tooling duplication) for the parts we source from you, provide a tier-2 source map with sub-supplier contingency plans, and confirm order acknowledgements for critical SKUs.
> **Our commitment:** We will share a firm 6-month forecast and are open to discussing a capacity-reservation arrangement. Please nominate a contact for a joint review within 10 business days.

### 3.4 Layer 4: Recommendation engine

**Stage A: risk-adjusted ranking (TOPSIS).** Within each category, candidate suppliers are ranked with TOPSIS (Hwang & Yoon, 1981) on five criteria. Predicted risk is included as an explicit criterion:

| Criterion | Direction | Weight (prototype) |
|---|---|---|
| Unit cost | minimize | 0.25 |
| OTIF rate | maximize | 0.20 |
| Defect PPM | minimize | 0.15 |
| Capacity headroom (1 − utilization) | maximize | 0.15 |
| Predicted disruption probability p̂ | minimize | 0.25 |

Weights should be elicited from stakeholders, for example with AHP pairwise comparisons (Saaty, 1980), and stress-tested with sensitivity analysis.

**Stage B: demand allocation (LP).** The ranking tells managers *who* is preferable. Allocation decides *how much* each supplier gets. Following Paper 2, Section 7:

$$\min_{q} \sum_i \left(c_i + \hat{p}_i\,\pi\right) q_i \quad \text{s.t.} \quad \sum_i q_i = D,\quad 0 \le q_i \le \min\!\left(h_i K_i,\; \bar{s}D\right)$$

where *cᵢ* is unit cost, π is the shortage cost per unit (prototype: $120), *hᵢKᵢ* is available capacity, and *s̄* = 0.6 caps any single supplier's share. The term *p̂ᵢπ* is the expected shortage cost per unit sourced. This is where the AI prediction directly changes sourcing decisions.

---

## 4. Prototype and Illustrative Results

### 4.1 Setup

The prototype generates a **synthetic** panel of 240 suppliers in 12 categories over 24 months. Each supplier has a latent risk state that drifts over time (AR(1)) and drives the observable features. Disruption events occur with a probability that rises with the latent state, geographic exposure, sub-tier concentration, and single-source status, including an interaction term. Models are trained on months 1–15 (labels extending through month 18) and tested on forecast origins in months 19–21. *All results are illustrative of the method and are not empirical findings.*

### 4.2 Predictive performance

| Model | ROC-AUC | PR-AUC | Brier | Precision @ top 10% |
|---|---|---|---|---|
| Rule-based scorecard | 0.638 | 0.214 | — | 0.333 |
| Logistic regression | **0.703** | **0.352** | **0.100** | **0.392** |
| Gradient boosting | 0.693 | 0.299 | 0.103 | 0.375 |

*Test-period base rate: 12.6%. PR-AUC of a random ranking equals the base rate.*

Both learned models beat the scorecard substantially. PR-AUC rose by 64% for logistic regression, meaning that flagged suppliers were far more likely to actually be disrupted. The logistic model slightly beat gradient boosting here, and the prototype chose it automatically for the signaling layer. This result is instructive, not disappointing. It supports Rudin's (2019) argument that simpler, interpretable models should be benchmarked, and not assumed inferior. Tree ensembles are expected to gain an advantage when real data contains stronger nonlinearities and interactions than this synthetic generator.

### 4.3 Drivers of risk

Permutation importance (drop in PR-AUC) ranked geographic exposure (0.074), sub-tier concentration (0.060), single-source status (0.050), and backlog growth (0.025) as the most influential features. These are mainly **structural and geographic constraints (C5, C6)**, which is consistent with Paper 1's proposition that structural factors dominate risk. They are also the constraints a traditional delivery-and-quality scorecard does *not* capture, which explains much of the scorecard's weaker performance.

### 4.4 Signals

In the most recent month, the protocol classified 152 suppliers GREEN, 75 AMBER, and 13 RED. The five highest-risk suppliers (p̂ between 0.44 and 0.69) were driven by combinations of single-source status, sub-tier concentration, geographic exposure, and backlog growth. Each received a tailored action list (see the S174 example in Section 3.3). Concentrating executive attention on 13 RED suppliers (5% of the base), instead of reviewing all 240, is the operational efficiency gain the tiered protocol is designed to deliver.

### 4.5 Recommendation and allocation

The table compares the risk-aware LP with the same LP when disruption risk is ignored (π = 0), under identical demand, capacity, and share-cap constraints, averaged across the 12 categories.

| Metric | Cost-only allocation | Risk-aware allocation | Change |
|---|---|---|---|
| Purchase cost per unit | $16.03 | $18.10 | +12.9% |
| Expected disrupted share of volume | 13.2% | 6.1% | **−53.8%** |
| Total expected cost per unit (purchase + shortage) | $31.92 | $25.44 | **−20.3%** |

The risk-aware policy deliberately pays more per unit to move volume away from high-risk suppliers. It more than recovers this premium through lower expected shortage cost. The size of the trade-off depends on π. Firms with low shortage costs would accept more risk, and firms with high costs, such as automotive line-stoppage, would diversify further.

---

## 5. Discussion

### 5.1 Theoretical implications
The framework puts signaling theory into practice in a new direction, from buyer to supplier. It also gives a mechanism for testing Paper 1's propositions. P2 (private constraints need signaling) can be tested by comparing prediction accuracy before and after suppliers begin disclosing capacity and sub-tier data in response to signals. P7 (reciprocal signaling) can be tested by measuring whether AMBER suppliers that received signals recover more often than comparable unsignaled suppliers.

### 5.2 Managerial implications
1. **Start with the data you already have.** Lead-time, OTIF, backlog, and sourcing-structure data exist in most ERP systems and carry much of the signal.
2. **Benchmark honestly.** Always compare against the current scorecard and a simple model before adopting complex ones.
3. **Design the signal, not only the model.** Value comes from the supplier's corrective response, which depends on specificity, credibility, and tone.
4. **Put risk into the sourcing math.** A risk score that does not change allocation decisions is only a dashboard.

### 5.3 Governance, ethics, and risks
- **Fairness to suppliers.** Small or new suppliers have less history and may be scored conservatively. Monitor error rates by supplier size and region, and provide appeal channels.
- **Self-fulfilling signals.** A RED signal that leads the buyer to pull volume can itself push a supplier into distress. The protocol therefore pairs signals with support before exit.
- **Gaming and Goodhart effects.** Once suppliers know the features, they may optimize the metric and not the underlying capability. Rotate in hard-to-game features such as audits and third-party data, and retrain periodically.
- **Data sharing and confidentiality.** Supplier-disclosed data needs contractual protection and access controls.
- **Human in the loop.** RED signals and volume shifts should require category-manager review. The model recommends and people decide.

### 5.4 Limitations
The results come from synthetic data with a known generating process. Real disruptions are rarer, labels are noisier (what counts as a "disruption"?), and correlated regional shocks break the independence assumptions in the allocation model. Signal thresholds and TOPSIS weights were set by assumption, not calibrated. The perturbation attribution is an approximation to SHAP and ignores feature correlation.

### 5.5 Future research
- **Empirical validation** on firm data with a pre-registered evaluation of signal effects, for example a stepped-wedge rollout across categories.
- **Survival models** that predict *time to* disruption, which matches TTR/TTS thinking more naturally.
- **Graph neural networks** over multi-tier supplier networks to capture ripple effects (Ivanov & Dolgui, 2020).
- **Reinforcement learning** for the signaling policy itself: when to signal, at what intensity, and with which offer (Sutton & Barto, 2018).
- **Large language models** to extract constraint signals from unstructured supplier communications and news, with human verification.

---

## 6. Conclusion

Predicting supplier disruptions is necessary but not sufficient. The value of AI in supplier-risk management comes from **closing the loop**: turning predictions into specific, credible signals that prompt suppliers to fix constraints, and into sourcing decisions that price risk explicitly. The proposed four-layer framework and open prototype show that this loop can be built with standard tools. Even on synthetic data, it shows the kind of gain that matters to managers: roughly half the expected disrupted volume for a modest price premium and lower total expected cost. The next step is validation with real supplier data and field evidence on how suppliers respond to AI-generated risk signals.

---

## Appendix A: Reproducing the Prototype

```bash
cd supply-chain-risk-papers/prototype
pip install numpy pandas scikit-learn scipy tabulate
python supplier_risk_ai.py
```

Outputs are written to `prototype/results/`:
- `summary.md`: model metrics, feature importance, signal distribution, allocation comparison
- `supplier_signals.csv`: tier, probability, drivers, and recommended actions for every supplier
- `supplier_recommendations.csv`: per-category TOPSIS rank and LP allocation

To use real data, replace `generate_panel()` with a loader that returns one row per supplier-month containing the columns in `FEATURES`, plus `supplier_id`, `category`, `month`, `unit_cost`, `monthly_capacity`, and the binary label `disruption_next_3m`.

---

## References

Baryannis, G., Validi, S., Dani, S., & Antoniou, G. (2019). Supply chain risk management and artificial intelligence: State of the art and future research directions. *International Journal of Production Research, 57*(7), 2179–2202.

Brintrup, A., Pak, J., Ratiney, D., Pearce, T., Wichmann, P., Woodall, P., & McFarlane, D. (2020). Supply chain data analytics for predicting supplier disruptions: A case study in complex asset manufacturing. *International Journal of Production Research, 58*(11), 3330–3341.

Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 785–794).

Connelly, B. L., Certo, S. T., Ireland, R. D., & Reutzel, C. R. (2011). Signaling theory: A review and assessment. *Journal of Management, 37*(1), 39–67.

Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *The Annals of Statistics, 29*(5), 1189–1232.

Ho, W., Xu, X., & Dey, P. K. (2010). Multi-criteria decision making approaches for supplier evaluation and selection: A literature review. *European Journal of Operational Research, 202*(1), 16–24.

Hwang, C.-L., & Yoon, K. (1981). *Multiple attribute decision making: Methods and applications*. Springer.

Ivanov, D., & Dolgui, A. (2020). Viability of intertwined supply networks: Extending the supply chain resilience angles towards survivability. *International Journal of Production Research, 58*(10), 2904–2915.

Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. In *Advances in Neural Information Processing Systems 30* (pp. 4765–4774).

Rudin, C. (2019). Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. *Nature Machine Intelligence, 1*(5), 206–215.

Saaty, T. L. (1980). *The analytic hierarchy process*. McGraw-Hill.

Spence, M. (1973). Job market signaling. *The Quarterly Journal of Economics, 87*(3), 355–374.

Sutton, R. S., & Barto, A. G. (2018). *Reinforcement learning: An introduction* (2nd ed.). MIT Press.

Tomlin, B. (2006). On the value of mitigation and contingency strategies for managing supply chain disruption risks. *Management Science, 52*(5), 639–657.
