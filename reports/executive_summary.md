# Executive Summary — Semiconductor Operations Analytics
**Period:** Trailing 3 months (Jun–Aug 2026), compared to prior 3 months (Mar–May 2026)
**Scope:** 5 product lines × 3 fabs, Jan 2024–Aug 2026 actuals, Sep 2026–Feb 2027 forecast

## Headline
| Metric | Value | Trend |
|---|---|---|
| Order fill rate | 97.2% | ↓ from 98.4% |
| Shortage rate | 2.8% of demand | ↑ from 1.6% |
| Fab capacity utilization | ~100% | Fabs running at ceiling |
| Forecast accuracy (MAPE) | 4.8% overall / 4.3% last 3mo | Stable, reliable |
| Finished-goods inventory | 11.3M units (~17.9 weeks of supply) | ↑ steadily since late 2024 |

## The story, tied together
1. **Demand** has grown steadily across the portfolio, with an AI/data-center-driven
   acceleration in **Logic IC X7** and **DRAM Memory D4** since 2025.
2. **Supply/capacity** kept pace in aggregate — all three fabs are running at
   essentially full capacity utilization — but the capacity ramp at **Fab 3 –
   Singapore** has lagged the other two sites.
3. **Shortages are not a portfolio-wide capacity problem — they are concentrated
   100% at Fab 3 – Singapore**, and 100% on the two fastest-growing, highest-value
   SKUs: Logic IC X7 (Critical) and DRAM D4 (High). Every other product/fab
   combination is at a 100% fill rate.
4. Meanwhile, **aggregate finished-goods inventory has been building for two years
   straight** (2.1M → 11.3M units), because Fab 1 (Taiwan) and Fab 2 (Arizona) are
   overproducing relative to their own demand share while Fab 3 underproduces for
   its allocated SKUs. This is a **product-mix / allocation issue**, not an
   aggregate output shortfall — and it carries a working-capital cost.
5. **Forecast accuracy is good (4.8% MAPE)**, so the shortage isn't a forecasting
   failure — it's a capacity-planning and allocation failure at one site. The
   6-month forward model (Sep 2026–Feb 2027) projects the same two product/fab
   combinations as the only ones at risk, with Logic IC X7 at Fab 3 the largest
   single exposure (~105K units of projected shortfall).

## Recommended actions
- **Reallocate or expand Fab 3 (Singapore) capacity** for Logic IC X7 and DRAM D4,
  or shift a portion of their allocated volume to Fab 1/Fab 2, which have headroom.
- **Right-size production plans at Fab 1 and Fab 2** for the SKUs where they are
  running well ahead of demand, to unwind the inventory build and free working
  capital.
- **Monitor Logic IC X7 at Fab 3 as the top single risk item** heading into
  Q4 2026 — it is both the most critical product classification and the largest
  projected shortfall.
- Forecast accuracy does not need remediation; keep the current model/cadence.

## Data note
Figures are generated from a synthetic-but-industry-realistic dataset
(`data/semiconductor_ops_data.csv`) built to mirror real semiconductor operations
dynamics (2024 supply shock, 2025–26 AI-driven demand upswing, phased fab
capacity ramps). Replace `data/semiconductor_ops_data.csv` with actual
demand/supply/forecast/inventory extracts (same schema) and re-run
`analytics/compute_kpis.py` to regenerate this summary and the dashboard from
real data.
