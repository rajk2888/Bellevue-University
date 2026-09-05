"""
Generates a realistic synthetic dataset for a semiconductor manufacturing
operation: monthly Demand, Supply (production output), Capacity, Inventory,
and Forecast by product line and fab, from Jan 2024 through Aug 2026 (actuals)
plus a 6-month forward statistical forecast (Sep 2026 - Feb 2027).

The data is synthetic (no real customer/company data), but the dynamics are
modeled on real semiconductor industry patterns:
  - Post-2023 demand recovery with an AI/data-center driven upswing in 2025-26
  - A supply shock (equipment/substrate constraint) in mid-2024
  - Gradual capacity ramp as fabs bring new tools online
  - Seasonal order patterns tied to consumer electronics build cycles

Output: data/semiconductor_ops_data.csv
"""
import csv
import math
import random
from datetime import date

random.seed(42)

PRODUCTS = [
    {"code": "MCU-A32", "name": "Microcontroller A32", "base_demand": 420_000, "growth": 0.007, "criticality": "High"},
    {"code": "MEM-D4", "name": "DRAM Memory D4", "base_demand": 610_000, "growth": 0.013, "criticality": "High"},
    {"code": "LOGIC-X7", "name": "Logic IC X7", "base_demand": 260_000, "growth": 0.016, "criticality": "Critical"},
    {"code": "ANALOG-P9", "name": "Power Mgmt IC P9", "base_demand": 340_000, "growth": 0.005, "criticality": "Medium"},
    {"code": "SENSOR-S2", "name": "Sensor IC S2", "base_demand": 180_000, "growth": 0.009, "criticality": "Medium"},
]

FABS = [
    {"code": "FAB1-TW", "name": "Fab 1 - Taiwan", "share": 0.45, "base_capacity_factor": 1.15, "ramp": 0.013},
    {"code": "FAB2-AZ", "name": "Fab 2 - Arizona", "share": 0.30, "base_capacity_factor": 1.10, "ramp": 0.020},
    {"code": "FAB3-SG", "name": "Fab 3 - Singapore", "share": 0.25, "base_capacity_factor": 1.05, "ramp": 0.011},
]

START_YEAR, START_MONTH = 2024, 1
N_ACTUAL_MONTHS = 32   # Jan 2024 .. Aug 2026
N_FORECAST_MONTHS = 6  # Sep 2026 .. Feb 2027


def month_iter(n, start_year=START_YEAR, start_month=START_MONTH):
    y, m = start_year, start_month
    for i in range(n):
        yield i, date(y, m, 1)
        m += 1
        if m > 12:
            m = 1
            y += 1


def seasonal_factor(month_idx_in_year):
    # Consumer electronics build cycle: ramps into Q3/Q4, dips in Q1
    return 1.0 + 0.12 * math.sin((month_idx_in_year - 2) / 12 * 2 * math.pi)


def supply_shock_factor(i):
    # Mid-2024 substrate/equipment shortage (months index 5-10 => Jun-Nov 2024)
    if 5 <= i <= 10:
        depth = 0.18 * math.exp(-((i - 7.5) ** 2) / (2 * 2.2 ** 2))
        return 1.0 - depth
    return 1.0


def ai_demand_upswing(i):
    # AI/data-center driven demand acceleration starting 2025 (month index 12+),
    # tapering so it adds pressure without compounding out of control
    if i < 12:
        return 1.0
    return 1.0 + min(0.10, 0.0045 * (i - 12))


def gen():
    rows = []
    inventory_state = {(p["code"], f["code"]): p["base_demand"] * f["share"] * 1.0 for p in PRODUCTS for f in FABS}

    for i, dt in month_iter(N_ACTUAL_MONTHS + N_FORECAST_MONTHS):
        is_actual = i < N_ACTUAL_MONTHS
        month_in_year = dt.month
        for p in PRODUCTS:
            trend = (1 + p["growth"]) ** i
            season = seasonal_factor(month_in_year)
            ai_boost = ai_demand_upswing(i) if p["code"] in ("MEM-D4", "LOGIC-X7") else 1.0
            noise = random.gauss(1.0, 0.035)
            total_demand = p["base_demand"] * trend * season * ai_boost * noise

            # Forecast made ~1 month ahead: trend/season aware but misses shocks & noise partially
            fcst_noise = random.gauss(1.0, 0.05)
            total_forecast = p["base_demand"] * trend * season * ai_boost * fcst_noise

            for f in FABS:
                demand = total_demand * f["share"] * random.gauss(1.0, 0.02)
                forecast = total_forecast * f["share"]

                capacity = (p["base_demand"] * f["share"]) * f["base_capacity_factor"] * (1 + f["ramp"]) ** i
                shock = supply_shock_factor(i)
                util_noise = random.gauss(1.0, 0.02)
                planned_supply = capacity * shock * util_noise
                supply = min(planned_supply, capacity * 1.03)

                key = (p["code"], f["code"])
                inv_begin = inventory_state[key]
                available = inv_begin + supply
                fulfilled = min(demand, available)
                shortage = max(0.0, demand - available)
                inv_end = max(0.0, available - fulfilled)
                inventory_state[key] = inv_end

                rows.append({
                    "date": dt.isoformat(),
                    "year": dt.year,
                    "month": dt.month,
                    "period_type": "Actual" if is_actual else "Forecast",
                    "product_code": p["code"],
                    "product_name": p["name"],
                    "criticality": p["criticality"],
                    "fab_code": f["code"],
                    "fab_name": f["name"],
                    "demand_units": round(demand),
                    "forecast_units": round(forecast),
                    "capacity_units": round(capacity),
                    "supply_units": round(supply),
                    "demand_fulfilled_units": round(fulfilled),
                    "shortage_units": round(shortage),
                    "inventory_begin_units": round(inv_begin),
                    "inventory_end_units": round(inv_end),
                })
    return rows


def main():
    rows = gen()
    out_path = "data/semiconductor_ops_data.csv"
    fieldnames = list(rows[0].keys())
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
