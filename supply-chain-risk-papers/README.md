# Supply Chain Risk Mitigation: Supplier Constraints → AI Signaling & Supplier Recommendation

A series of papers that build on each other. The series starts with the problem framing and ends with an AI model that signals risk to suppliers and recommends which suppliers to use.

| File | Paper | Type | What it contributes |
|---|---|---|---|
| `00-introduction-variants.md` | Three alternative introductions | Academic / Practitioner / AI | Choose the framing for your audience |
| `paper-1-conceptual-framework.md` | *Supplier Constraints as Antecedents of Supply Chain Risk* | Conceptual / theory | 7-class constraint typology, constraint–mitigation fit matrix, 7 propositions, signaling perspective |
| `paper-2-quantitative-mitigation.md` | *Quantifying and Mitigating Supplier-Constraint Risk* | Analytical / quantitative | Expected loss via TTR/TTS, lever modeling, budgeted portfolio, worked numeric example |
| `paper-3-ai-signaling-recommendation.md` | *An AI-Driven Early-Warning, Signaling, and Supplier Recommendation Framework* | AI / applied analytics | 4-layer architecture, Green/Amber/Red supplier signals, risk-adjusted TOPSIS + LP allocation, prototype results |
| `prototype/supplier_risk_ai.py` | Companion code for Paper 3 | Python | Runs the full pipeline on synthetic data. Results are in `prototype/results/` |

## How the papers connect
Paper 1 names the constraints and the propositions. Paper 2 puts a dollar value on them and chooses mitigation levers. Paper 3 predicts risk with ML, sends signals to suppliers, and allocates demand.

## Before submitting
- **Check every citation** against the original source or a database (Google Scholar, the Bellevue University library). The references are well-known works, but confirm volume, issue, and page numbers yourself.
- **The prototype results use synthetic data.** Present them as an illustration of the method, not as empirical findings.
- Replace the `[Your Name]` / `[Course]` placeholders, and follow your course's formatting rules (APA 7 is used here).
- Follow your instructor's policy on AI assistance, and disclose it if required.
