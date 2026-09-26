"""
Supplier Risk Early-Warning, Signaling, and Recommendation Prototype
=====================================================================

Companion code for Paper 3 ("An AI-Driven Early-Warning Signaling and
Supplier Recommendation Framework for Mitigating Supplier-Constraint Risk").

The pipeline has four stages:
  1. Data     - generate a synthetic supplier-month panel (replace with real ERP/SRM data)
  2. Predict  - estimate P(disruption in next 3 months) with a gradient-boosted model
  3. Signal   - convert risk into Green/Amber/Red signals with the top drivers
  4. Recommend- rank suppliers per category (risk-adjusted TOPSIS) and allocate
                demand across them with a linear program

All data is SYNTHETIC. Results illustrate the method; they are not empirical findings.

Run:  python supplier_risk_ai.py            (writes outputs to ./results)
"""

from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import linprog
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

RNG = np.random.default_rng(42)
OUT = Path(__file__).parent / "results"

N_SUPPLIERS = 240
N_MONTHS = 24
N_CATEGORIES = 12
TRAIN_MONTHS = 18          # months 1-18 train, 19-24 test (time-based split)

FEATURES = [
    "capacity_utilization",     # share of supplier capacity already committed (0-1)
    "lead_time_days",           # mean quoted-to-actual lead time
    "lead_time_cv",             # coefficient of variation of lead time
    "otif_rate",                # on-time-in-full, trailing 3 months
    "defect_ppm",               # quality defects, parts per million
    "financial_health",         # 0-100 composite (liquidity, leverage, payment behaviour)
    "geo_risk_index",           # 0-1 country/region disruption exposure
    "single_source",            # 1 if the buyer has no qualified alternate for this part
    "backlog_growth",           # month-over-month change in open-order backlog
    "response_latency_days",    # days to acknowledge POs / answer RFIs
    "sub_tier_concentration",   # 0-1 dependence of supplier on its own few sources
]

# Signal thresholds on calibrated probability of disruption in the next 3 months
TIERS = [(0.35, "RED"), (0.15, "AMBER"), (0.0, "GREEN")]

DRIVER_ACTIONS = {
    "capacity_utilization": "Share a firm 6-month forecast and discuss reserved capacity or capacity-option contract.",
    "lead_time_days": "Review lead-time commitments; agree on buffer stock at supplier or buyer site.",
    "lead_time_cv": "Joint root-cause review of delivery variability; stabilise order release cadence.",
    "otif_rate": "Open a delivery-performance corrective action plan with weekly checkpoints.",
    "defect_ppm": "Trigger supplier quality audit and 8D corrective action.",
    "financial_health": "Request financial disclosure; evaluate supply-chain finance or early-payment terms.",
    "geo_risk_index": "Request business-continuity plan and alternate production site mapping.",
    "single_source": "Discuss dual-site production or tooling duplication; share a continuity plan for affected parts.",
    "backlog_growth": "Confirm order acknowledgements; prioritise critical SKUs in the supplier's queue.",
    "response_latency_days": "Escalate to account executive; establish a named communication owner.",
    "sub_tier_concentration": "Request tier-2 source mapping and sub-supplier contingency plans.",
}


# --------------------------------------------------------------------------- #
# 1. Synthetic data
# --------------------------------------------------------------------------- #
def generate_panel() -> pd.DataFrame:
    """Supplier-month panel with slowly drifting latent risk and a 3-month-ahead label."""
    sup = pd.DataFrame({
        "supplier_id": [f"S{i:03d}" for i in range(N_SUPPLIERS)],
        "category": [f"C{i % N_CATEGORIES:02d}" for i in range(N_SUPPLIERS)],
        "base_risk": RNG.normal(0, 1, N_SUPPLIERS),
        "geo_risk_index": RNG.beta(2, 5, N_SUPPLIERS),
        "single_source": RNG.binomial(1, 0.3, N_SUPPLIERS),
        "sub_tier_concentration": RNG.beta(2, 3, N_SUPPLIERS),
        "unit_cost": RNG.lognormal(3.0, 0.25, N_SUPPLIERS),
        "monthly_capacity": RNG.integers(800, 3000, N_SUPPLIERS),
    })

    rows = []
    for _, s in sup.iterrows():
        latent = s.base_risk
        for m in range(1, N_MONTHS + 1):
            latent = 0.85 * latent + RNG.normal(0, 0.45)          # AR(1) drift in risk
            rows.append({
                "supplier_id": s.supplier_id, "category": s.category, "month": m,
                "latent": latent,
                "capacity_utilization": np.clip(0.72 + 0.08 * latent + RNG.normal(0, 0.06), 0.3, 1.0),
                "lead_time_days": max(5, 30 + 5 * latent + RNG.normal(0, 4)),
                "lead_time_cv": np.clip(0.15 + 0.05 * latent + RNG.normal(0, 0.04), 0.02, 0.8),
                "otif_rate": np.clip(0.93 - 0.035 * latent + RNG.normal(0, 0.03), 0.4, 1.0),
                "defect_ppm": max(0, 400 + 180 * latent + RNG.normal(0, 150)),
                "financial_health": np.clip(65 - 9 * latent + RNG.normal(0, 8), 0, 100),
                "geo_risk_index": s.geo_risk_index,
                "single_source": s.single_source,
                "backlog_growth": 0.04 * latent + RNG.normal(0, 0.05),
                "response_latency_days": max(0.2, 2 + 0.8 * latent + RNG.normal(0, 0.8)),
                "sub_tier_concentration": s.sub_tier_concentration,
                "unit_cost": s.unit_cost, "monthly_capacity": s.monthly_capacity,
            })
    df = pd.DataFrame(rows).sort_values(["supplier_id", "month"]).reset_index(drop=True)

    # Disruption hazard depends on latent state plus structural exposure
    logit = (-4.6 + 1.1 * df.latent + 2.2 * df.geo_risk_index
             + 0.8 * df.single_source * (df.latent > 0) + 1.2 * df.sub_tier_concentration)
    df["disruption_event"] = RNG.binomial(1, 1 / (1 + np.exp(-logit)))

    # Label: any disruption in months t+1..t+3 (forward-looking early warning)
    fwd = df.groupby("supplier_id")["disruption_event"]
    df["disruption_next_3m"] = (
        pd.concat([fwd.shift(-k) for k in (1, 2, 3)], axis=1).max(axis=1)
    )
    return df.dropna(subset=["disruption_next_3m"]).astype({"disruption_next_3m": int})


# --------------------------------------------------------------------------- #
# 2. Prediction
# --------------------------------------------------------------------------- #
def scorecard(X: pd.DataFrame) -> np.ndarray:
    """Rule-based baseline typical of manual supplier scorecards (0-1 scale)."""
    points = ((X.otif_rate < 0.9).astype(int) + (X.defect_ppm > 700).astype(int)
              + (X.financial_health < 50).astype(int) + X.single_source)
    return points / 4


def train_and_evaluate(df: pd.DataFrame):
    train, test = df[df.month <= TRAIN_MONTHS - 3], df[df.month > TRAIN_MONTHS]
    Xtr, ytr, Xte, yte = train[FEATURES], train.disruption_next_3m, test[FEATURES], test.disruption_next_3m

    models = {
        "Rule-based scorecard": None,
        "Logistic regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
        "Gradient boosting": GradientBoostingClassifier(
            n_estimators=300, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=0),
    }
    metrics, preds = [], {}
    for name, model in models.items():
        p = scorecard(Xte) if model is None else model.fit(Xtr, ytr).predict_proba(Xte)[:, 1]
        preds[name] = p
        top = np.argsort(-p)[: int(0.1 * len(p))]
        metrics.append({
            "model": name,
            "ROC-AUC": roc_auc_score(yte, p),
            "PR-AUC": average_precision_score(yte, p),
            "Brier": brier_score_loss(yte, p) if model is not None else np.nan,
            "Precision@top10%": yte.iloc[top].mean(),
        })
    metrics = pd.DataFrame(metrics)
    # Downstream signaling uses whichever learned model ranks disruptions best (PR-AUC)
    best = metrics[metrics.model != "Rule-based scorecard"].sort_values("PR-AUC").model.iloc[-1]
    model = models[best]
    imp = permutation_importance(model, Xte, yte, scoring="average_precision", n_repeats=10, random_state=0)
    importance = (pd.DataFrame({"feature": FEATURES, "importance": imp.importances_mean})
                  .sort_values("importance", ascending=False))
    return model, best, metrics, importance, test.assign(p_disruption=preds[best]), yte.mean()


# --------------------------------------------------------------------------- #
# 3. Signaling
# --------------------------------------------------------------------------- #
def local_drivers(model, row: pd.Series, reference: pd.Series, k: int = 3):
    """Perturbation attribution: risk drop when a feature is reset to the portfolio median.
    A lightweight, model-agnostic stand-in for SHAP values."""
    x = row[FEATURES].to_frame().T.astype(float)
    base = model.predict_proba(x)[0, 1]
    contrib = {}
    for f in FEATURES:
        x2 = x.copy()
        x2[f] = reference[f]
        contrib[f] = base - model.predict_proba(x2)[0, 1]
    return sorted(contrib.items(), key=lambda kv: -kv[1])[:k]


def tier(p: float) -> str:
    return next(label for cut, label in TIERS if p >= cut)


def build_signals(model, scored: pd.DataFrame) -> pd.DataFrame:
    latest = scored[scored.month == scored.month.max()].copy()
    reference = scored[FEATURES].median()
    out = []
    for _, r in latest.iterrows():
        t = tier(r.p_disruption)
        drivers = local_drivers(model, r, reference) if t != "GREEN" else []
        drivers = [(f, d) for f, d in drivers if d > 0.005]
        out.append({
            "supplier_id": r.supplier_id, "category": r.category,
            "p_disruption_3m": round(r.p_disruption, 3), "signal": t,
            "top_drivers": "; ".join(f"{f} (+{d:.2f})" for f, d in drivers),
            "recommended_supplier_action": " | ".join(DRIVER_ACTIONS[f] for f, _ in drivers[:2]),
            "buyer_internal_action": {
                "RED": "Activate contingency: raise safety stock, expedite alternate source, weekly exec review.",
                "AMBER": "Increase monitoring cadence; pre-qualify alternate; share forecast with supplier.",
                "GREEN": "Standard monitoring; recognise performance in quarterly business review.",
            }[t],
        })
    return pd.DataFrame(out).sort_values("p_disruption_3m", ascending=False)


# --------------------------------------------------------------------------- #
# 4. Recommendation
# --------------------------------------------------------------------------- #
SHORTAGE_COST = 120.0   # cost per unit of demand not delivered because a supplier is disrupted

CRITERIA = {  # weight, direction (+1 benefit / -1 cost)
    "unit_cost": (0.25, -1), "otif_rate": (0.20, +1), "defect_ppm": (0.15, -1),
    "capacity_headroom": (0.15, +1), "p_disruption_3m": (0.25, -1),
}


def topsis(df: pd.DataFrame) -> pd.Series:
    M = df[list(CRITERIA)].astype(float)
    N = M / np.sqrt((M ** 2).sum())
    w = np.array([c[0] for c in CRITERIA.values()])
    d = np.array([c[1] for c in CRITERIA.values()])
    V = N * w
    ideal = np.where(d > 0, V.max(), V.min())
    anti = np.where(d > 0, V.min(), V.max())
    s_plus = np.sqrt(((V - ideal) ** 2).sum(axis=1))
    s_minus = np.sqrt(((V - anti) ** 2).sum(axis=1))
    return s_minus / (s_plus + s_minus)


def allocate(cands: pd.DataFrame, demand: float, max_share=0.6, shortage_cost=SHORTAGE_COST) -> np.ndarray:
    """LP: min sum_i x_i * (cost_i + p_i * shortage_cost)
       s.t. sum x_i = demand, 0 <= x_i <= min(headroom_i, max_share*demand)."""
    c = cands.unit_cost.values + cands.p_disruption_3m.values * shortage_cost
    ub = np.minimum(cands.capacity_headroom.values * cands.monthly_capacity.values, max_share * demand)
    res = linprog(c, A_eq=np.ones((1, len(c))), b_eq=[demand],
                  bounds=list(zip(np.zeros(len(c)), ub)), method="highs")
    return res.x if res.success else np.full(len(c), np.nan)


def recommend(scored: pd.DataFrame) -> pd.DataFrame:
    latest = scored[scored.month == scored.month.max()].copy()
    latest["capacity_headroom"] = 1 - latest.capacity_utilization
    latest = latest.rename(columns={"p_disruption": "p_disruption_3m"})
    out = []
    for cat, g in latest.groupby("category"):
        g = g.copy()
        g["topsis_score"] = topsis(g)
        g = g.sort_values("topsis_score", ascending=False)
        demand = 0.35 * g.monthly_capacity.sum() * g.capacity_headroom.mean()
        g["allocated_units"] = allocate(g, demand)
        g["cost_only_units"] = allocate(g, demand, shortage_cost=0.0)
        g["rank"] = range(1, len(g) + 1)
        out.append(g)
    cols = ["category", "rank", "supplier_id", "topsis_score", "unit_cost", "otif_rate",
            "defect_ppm", "capacity_headroom", "p_disruption_3m", "allocated_units", "cost_only_units"]
    return pd.concat(out)[cols].round(3)


def cost_only_comparison(rec: pd.DataFrame) -> pd.DataFrame:
    """Compare the risk-aware LP with the same LP when disruption risk is ignored
    (same demand, capacity, and 60% share cap)."""
    rows = []
    for cat, g in rec.groupby("category"):
        r = {"category": cat}
        for label, col in (("risk_aware", "allocated_units"), ("cost_only", "cost_only_units")):
            x, d = g[col], g[col].sum()
            purchase = (x * g.unit_cost).sum() / d
            exp_short = (x * g.p_disruption_3m).sum() / d
            r[f"{label}_unit_cost"] = purchase
            r[f"{label}_expected_disrupted_share"] = exp_short
            r[f"{label}_total_expected_cost_per_unit"] = purchase + exp_short * SHORTAGE_COST
        rows.append(r)
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
def main():
    OUT.mkdir(exist_ok=True)
    df = generate_panel()
    model, best, metrics, importance, scored, base_rate = train_and_evaluate(df)
    signals = build_signals(model, scored)
    rec = recommend(scored)
    comp = cost_only_comparison(rec)

    signals.to_csv(OUT / "supplier_signals.csv", index=False)
    rec.to_csv(OUT / "supplier_recommendations.csv", index=False)

    with open(OUT / "summary.md", "w") as f:
        f.write("# Prototype Results (synthetic data)\n\n")
        f.write(f"Panel: {N_SUPPLIERS} suppliers x {N_MONTHS} months, {N_CATEGORIES} categories. "
                f"Test-period disruption base rate: {base_rate:.1%}.\n\n")
        f.write("## Predictive performance (time-based hold-out, months 19-21 as origin)\n\n")
        f.write(metrics.round(3).to_markdown(index=False) + "\n\n")
        f.write(f"Model selected for signaling (highest PR-AUC): **{best}**.\n\n")
        f.write("## Global feature importance (permutation, PR-AUC drop)\n\n")
        f.write(importance.round(4).to_markdown(index=False) + "\n\n")
        f.write("## Signal distribution (latest month)\n\n")
        f.write(signals.signal.value_counts().to_frame("suppliers").to_markdown() + "\n\n")
        f.write("## Example RED signals\n\n")
        f.write(signals[signals.signal == "RED"].head(5)
                [["supplier_id", "p_disruption_3m", "top_drivers"]].to_markdown(index=False) + "\n\n")
        f.write("## Risk-aware vs. cost-only allocation (mean across categories; shortage cost = $120/unit)\n\n")
        f.write(comp.drop(columns="category").mean().round(3).to_frame("mean").to_markdown() + "\n")

    print((OUT / "summary.md").read_text())


if __name__ == "__main__":
    main()
