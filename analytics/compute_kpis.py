"""
Semiconductor Operations Analytics engine.

Reads data/semiconductor_ops_data.csv (Demand, Supply, Forecast, Inventory by
product x fab x month) and produces a single tied-together set of executive
KPIs and time series, written to analytics/output/kpis.json. This is the one
source of truth the executive dashboard (docs/dashboard.html) renders from.

No external dependencies (stdlib only) so it runs anywhere.
"""
import csv
import json
from collections import defaultdict

IN_PATH = "data/semiconductor_ops_data.csv"
OUT_PATH = "analytics/output/kpis.json"

NUM_FIELDS = [
    "demand_units", "forecast_units", "capacity_units", "supply_units",
    "demand_fulfilled_units", "shortage_units", "inventory_begin_units",
    "inventory_end_units",
]


def load_rows():
    with open(IN_PATH, newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            for k in NUM_FIELDS:
                r[k] = float(r[k])
            rows.append(r)
        return rows


def month_key(r):
    return f"{r['year']}-{int(r['month']):02d}"


def safe_div(a, b):
    return (a / b) if b else 0.0


def build_monthly_totals(rows, period_type=None):
    agg = defaultdict(lambda: defaultdict(float))
    for r in rows:
        if period_type and r["period_type"] != period_type:
            continue
        mk = month_key(r)
        for k in NUM_FIELDS:
            agg[mk][k] += r[k]
    return dict(sorted(agg.items()))


def pct(x):
    return round(x * 100, 1)


def main():
    rows = load_rows()
    actuals = [r for r in rows if r["period_type"] == "Actual"]
    forecast_rows = [r for r in rows if r["period_type"] == "Forecast"]

    months = sorted(set(month_key(r) for r in actuals))
    latest_month = months[-1]
    prior_month = months[-2]

    monthly = build_monthly_totals(actuals)
    monthly_fcst = build_monthly_totals(forecast_rows)

    # ---- Headline KPIs (trailing 3 months vs prior 3 months) ----
    last3 = months[-3:]
    prev3 = months[-6:-3]

    def sum_over(months_list, field):
        return sum(monthly[m][field] for m in months_list)

    demand_l3 = sum_over(last3, "demand_units")
    supply_l3 = sum_over(last3, "supply_units")
    fulfilled_l3 = sum_over(last3, "demand_fulfilled_units")
    shortage_l3 = sum_over(last3, "shortage_units")
    capacity_l3 = sum_over(last3, "capacity_units")

    demand_p3 = sum_over(prev3, "demand_units")
    fulfilled_p3 = sum_over(prev3, "demand_fulfilled_units")
    shortage_p3 = sum_over(prev3, "shortage_units")

    fill_rate_l3 = safe_div(fulfilled_l3, demand_l3)
    fill_rate_p3 = safe_div(fulfilled_p3, demand_p3)
    shortage_rate_l3 = safe_div(shortage_l3, demand_l3)
    shortage_rate_p3 = safe_div(shortage_p3, demand_p3)
    util_l3 = safe_div(supply_l3, capacity_l3)

    # Forecast accuracy (MAPE) — actual demand vs forecast made for that month
    ape_sum, ape_n = 0.0, 0
    for r in actuals:
        if r["demand_units"] > 0:
            ape_sum += abs(r["forecast_units"] - r["demand_units"]) / r["demand_units"]
            ape_n += 1
    mape = safe_div(ape_sum, ape_n)

    ape_l3_sum, ape_l3_n = 0.0, 0
    for r in actuals:
        if month_key(r) in last3 and r["demand_units"] > 0:
            ape_l3_sum += abs(r["forecast_units"] - r["demand_units"]) / r["demand_units"]
            ape_l3_n += 1
    mape_l3 = safe_div(ape_l3_sum, ape_l3_n)

    # Days/weeks of supply from ending inventory vs trailing avg monthly demand
    avg_monthly_demand_l3 = demand_l3 / 3.0
    inv_end_latest = monthly[latest_month]["inventory_end_units"]
    weeks_of_supply = safe_div(inv_end_latest, avg_monthly_demand_l3) * 4.345

    # ---- Time series for charts (all actual months) ----
    series = {
        "months": months,
        "demand": [round(monthly[m]["demand_units"]) for m in months],
        "supply": [round(monthly[m]["supply_units"]) for m in months],
        "forecast": [round(monthly[m]["forecast_units"]) for m in months],
        "capacity": [round(monthly[m]["capacity_units"]) for m in months],
        "shortage": [round(monthly[m]["shortage_units"]) for m in months],
        "fill_rate_pct": [pct(safe_div(monthly[m]["demand_fulfilled_units"], monthly[m]["demand_units"])) for m in months],
        "inventory_end": [round(monthly[m]["inventory_end_units"]) for m in months],
    }

    fcst_months = sorted(monthly_fcst.keys())
    forward_series = {
        "months": fcst_months,
        "demand_forecast": [round(monthly_fcst[m]["demand_units"]) for m in fcst_months],
        "capacity": [round(monthly_fcst[m]["capacity_units"]) for m in fcst_months],
        "projected_shortage": [round(monthly_fcst[m]["shortage_units"]) for m in fcst_months],
    }

    # ---- By product ----
    by_product = defaultdict(lambda: defaultdict(float))
    prod_meta = {}
    for r in actuals:
        if month_key(r) not in last3:
            continue
        pc = r["product_code"]
        prod_meta[pc] = {"name": r["product_name"], "criticality": r["criticality"]}
        for k in NUM_FIELDS:
            by_product[pc][k] += r[k]

    products_summary = []
    for pc, vals in by_product.items():
        d = vals["demand_units"]
        s = vals["shortage_units"]
        products_summary.append({
            "code": pc,
            "name": prod_meta[pc]["name"],
            "criticality": prod_meta[pc]["criticality"],
            "demand": round(d),
            "supply": round(vals["supply_units"]),
            "fill_rate_pct": pct(safe_div(vals["demand_fulfilled_units"], d)),
            "shortage_units": round(s),
            "shortage_rate_pct": pct(safe_div(s, d)),
            "capacity_utilization_pct": pct(safe_div(vals["supply_units"], vals["capacity_units"])),
        })
    products_summary.sort(key=lambda x: -x["shortage_rate_pct"])

    # ---- By fab ----
    by_fab = defaultdict(lambda: defaultdict(float))
    fab_meta = {}
    for r in actuals:
        if month_key(r) not in last3:
            continue
        fc = r["fab_code"]
        fab_meta[fc] = r["fab_name"]
        for k in NUM_FIELDS:
            by_fab[fc][k] += r[k]

    fabs_summary = []
    for fc, vals in by_fab.items():
        fabs_summary.append({
            "code": fc,
            "name": fab_meta[fc],
            "demand": round(vals["demand_units"]),
            "supply": round(vals["supply_units"]),
            "capacity": round(vals["capacity_units"]),
            "capacity_utilization_pct": pct(safe_div(vals["supply_units"], vals["capacity_units"])),
            "shortage_units": round(vals["shortage_units"]),
        })
    fabs_summary.sort(key=lambda x: -x["capacity_utilization_pct"])

    # ---- Product x Fab shortage matrix (heatmap), last 3 months ----
    matrix = defaultdict(lambda: defaultdict(float))
    for r in actuals:
        if month_key(r) not in last3:
            continue
        matrix[r["product_code"]][r["fab_code"]] += r["shortage_units"]
    heatmap = {
        "products": sorted(matrix.keys()),
        "fabs": sorted({fc for v in matrix.values() for fc in v.keys()}),
        "values": [
            [round(matrix[p].get(f, 0.0)) for f in sorted({fc for v in matrix.values() for fc in v.keys()})]
            for p in sorted(matrix.keys())
        ],
    }

    # ---- At-risk list: products/fabs projected into forecast window with rising shortage ----
    risk_matrix = defaultdict(lambda: defaultdict(float))
    for r in forecast_rows:
        risk_matrix[r["product_code"]][r["fab_code"]] += r["shortage_units"]
    at_risk = []
    for pc, favs in risk_matrix.items():
        total_risk = sum(favs.values())
        if total_risk > 0:
            worst_fab = max(favs.items(), key=lambda kv: kv[1])
            at_risk.append({
                "product": prod_meta.get(pc, {}).get("name", pc),
                "code": pc,
                "criticality": prod_meta.get(pc, {}).get("criticality", "Unknown"),
                "projected_shortage_units": round(total_risk),
                "worst_fab": fab_meta.get(worst_fab[0], worst_fab[0]),
            })
    at_risk.sort(key=lambda x: -x["projected_shortage_units"])

    kpis = {
        "as_of_month": latest_month,
        "headline": {
            "fill_rate_pct": pct(fill_rate_l3),
            "fill_rate_pct_prior": pct(fill_rate_p3),
            "shortage_rate_pct": pct(shortage_rate_l3),
            "shortage_rate_pct_prior": pct(shortage_rate_p3),
            "capacity_utilization_pct": pct(util_l3),
            "forecast_mape_pct": pct(mape),
            "forecast_mape_pct_l3": pct(mape_l3),
            "weeks_of_supply": round(weeks_of_supply, 1),
            "total_shortage_units_l3": round(shortage_l3),
            "total_demand_units_l3": round(demand_l3),
        },
        "series": series,
        "forward_series": forward_series,
        "products_summary": products_summary,
        "fabs_summary": fabs_summary,
        "heatmap": heatmap,
        "at_risk": at_risk[:5],
    }

    with open(OUT_PATH, "w") as f:
        json.dump(kpis, f, indent=2)
    print(f"Wrote KPIs to {OUT_PATH}")
    print(json.dumps(kpis["headline"], indent=2))


if __name__ == "__main__":
    main()
