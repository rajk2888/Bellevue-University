# Prototype Results (synthetic data)

Panel: 240 suppliers x 24 months, 12 categories. Test-period disruption base rate: 12.6%.

## Predictive performance (time-based hold-out, months 19-21 as origin)

| model                |   ROC-AUC |   PR-AUC |   Brier |   Precision@top10% |
|:---------------------|----------:|---------:|--------:|-------------------:|
| Rule-based scorecard |     0.638 |    0.214 | nan     |              0.333 |
| Logistic regression  |     0.703 |    0.352 |   0.1   |              0.392 |
| Gradient boosting    |     0.693 |    0.299 |   0.103 |              0.375 |

Model selected for signaling (highest PR-AUC): **Logistic regression**.

## Global feature importance (permutation, PR-AUC drop)

| feature                |   importance |
|:-----------------------|-------------:|
| geo_risk_index         |       0.0744 |
| sub_tier_concentration |       0.0596 |
| single_source          |       0.0496 |
| backlog_growth         |       0.025  |
| lead_time_days         |       0.0177 |
| financial_health       |       0.013  |
| otif_rate              |       0.0116 |
| capacity_utilization   |       0.0085 |
| defect_ppm             |       0.0039 |
| response_latency_days  |       0.0035 |
| lead_time_cv           |       0.0033 |

## Signal distribution (latest month)

| signal   |   suppliers |
|:---------|------------:|
| GREEN    |         152 |
| AMBER    |          75 |
| RED      |          13 |

## Example RED signals

| supplier_id   |   p_disruption_3m | top_drivers                                                                         |
|:--------------|------------------:|:------------------------------------------------------------------------------------|
| S174          |             0.686 | single_source (+0.18); sub_tier_concentration (+0.16); backlog_growth (+0.08)       |
| S152          |             0.649 | sub_tier_concentration (+0.14); geo_risk_index (+0.11); backlog_growth (+0.10)      |
| S204          |             0.647 | single_source (+0.18); sub_tier_concentration (+0.15); capacity_utilization (+0.09) |
| S225          |             0.514 | single_source (+0.18); geo_risk_index (+0.15); sub_tier_concentration (+0.07)       |
| S183          |             0.438 | sub_tier_concentration (+0.17); single_source (+0.17); backlog_growth (+0.06)       |

## Risk-aware vs. cost-only allocation (mean across categories; shortage cost = $120/unit)

|                                         |   mean |
|:----------------------------------------|-------:|
| risk_aware_unit_cost                    | 18.098 |
| risk_aware_expected_disrupted_share     |  0.061 |
| risk_aware_total_expected_cost_per_unit | 25.435 |
| cost_only_unit_cost                     | 16.031 |
| cost_only_expected_disrupted_share      |  0.132 |
| cost_only_total_expected_cost_per_unit  | 31.918 |
