"""
Regenerates analytics/output/kpis.json from data/semiconductor_ops_data.csv
and injects it into docs/dashboard.html so the dashboard reflects the
current data. Run this after regenerating or replacing the source CSV.
"""
import json
import re
import subprocess
import sys

KPIS_PATH = "analytics/output/kpis.json"
DASHBOARD_PATH = "docs/dashboard.html"


def main():
    subprocess.run([sys.executable, "analytics/compute_kpis.py"], check=True)

    with open(KPIS_PATH) as f:
        kpi_json = f.read()
        json.loads(kpi_json)  # fail fast on malformed output

    with open(DASHBOARD_PATH) as f:
        html = f.read()

    new_html, n = re.subn(
        r"const DATA = \{.*?\};",
        "const DATA = " + kpi_json.replace("\\", "\\\\") + ";",
        html,
        count=1,
        flags=re.S,
    )
    if n == 0:
        raise RuntimeError("Could not find `const DATA = {...};` block to replace in " + DASHBOARD_PATH)

    with open(DASHBOARD_PATH, "w") as f:
        f.write(new_html)
    print(f"Updated {DASHBOARD_PATH} with the latest KPIs.")


if __name__ == "__main__":
    main()
