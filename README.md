# Bellevue-University
Bellevue Documents

## Semiconductor Manufacturing — Operations Analytics

Ties Demand, Supply, Forecast, and Shortage data together into one executive
view for a semiconductor manufacturing operation (5 product lines x 3 fabs).

- `data/generate_dataset.py` — builds `data/semiconductor_ops_data.csv`
  (swap this for a real demand/supply/forecast/inventory extract with the
  same schema to run this on live data).
- `analytics/compute_kpis.py` — reads the CSV and computes the connected KPI
  set (fill rate, shortage rate, capacity utilization, forecast MAPE, weeks
  of supply, product/fab/heatmap breakdowns, forward-looking risk) into
  `analytics/output/kpis.json`.
- `reports/executive_summary.md` — the narrative executive summary generated
  from those KPIs.
- `docs/dashboard.html` — a self-contained executive dashboard (open directly
  in a browser) rendered from `analytics/output/kpis.json`.

Regenerate everything after updating the data:

```
python3 data/generate_dataset.py      # or replace data/semiconductor_ops_data.csv with real data
python3 analytics/build_dashboard.py  # recomputes KPIs and updates docs/dashboard.html
```

