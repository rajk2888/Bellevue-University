# Introduction Variants: Supplier-Constraint Risk in Supply Chain Operations

Here are three alternative introductions. Each one is written for a different audience and makes a different argument, so you can choose the framing that fits your assignment, journal, or professor. Any of them can replace the introduction in Papers 1–3.

| Variant | Audience | Framing | Best paired with |
|---|---|---|---|
| A. Academic / theory-driven | Peer-reviewed journal, doctoral seminar | A gap in the literature on constraints as risk antecedents | Paper 1 |
| B. Practitioner / managerial | MBA course, industry white paper | The cost of disruptions and what managers can control | Paper 2 |
| C. Technology / AI-driven | Data science or analytics venue | Moving from reactive scorecards to predictive signaling | Paper 3 |

---

## Variant A: Academic / Theory-Driven Introduction

Over the past two decades, supply chain risk management (SCRM) has grown from a niche operations topic into a research field of its own (Ho et al., 2015; Tang, 2006). Early work focused on dramatic, low-probability disruptions such as fires, earthquakes, and pandemics. It sorted them into typologies (Chopra & Sodhi, 2004; Kleindorfer & Saad, 2005) and argued that firms should build resilience through redundancy and flexibility (Christopher & Peck, 2004; Sheffi & Rice, 2005). The COVID-19 pandemic and the semiconductor shortage that followed showed that disruptions spread along network structures, not only from single shocks (Ivanov, 2020; Ivanov & Dolgui, 2020).

Much less attention has gone to the ordinary *constraints* that sit inside the supply base before any disruption happens: limited capacity, long and variable lead times, fragile finances, concentrated sub-tier sourcing, and single-source dependencies. Most studies treat these as background conditions, but they are better understood as the *antecedents* that decide whether a shock turns into a disruption and how severe it becomes (Craighead et al., 2007). A supplier running at 97% capacity utilization has no buffer to absorb a demand spike. A supplier with weak liquidity cannot pay for expediting. A buyer with no qualified alternate cannot redirect volume. In each case, the constraint is what turns an ordinary fluctuation into a service failure.

This paper argues that supplier constraints deserve their own place in SCRM theory. We make three contributions. First, we build a typology of seven supplier-constraint classes and show how each one raises either the likelihood or the impact of a disruption. Second, we map established mitigation strategies (multi-sourcing, buffering, supplier development, contractual and relational mechanisms) to the constraint classes each one addresses. The result is a set of testable propositions. Third, we use signaling theory (Connelly et al., 2011; Spence, 1973) to explain why buyers and suppliers routinely under-share constraint information, and why structured, two-way risk signals can correct this. The rest of the paper reviews the literature, presents the framework, develops the propositions, and discusses implications for research and practice.

---

## Variant B: Practitioner / Managerial Introduction

When a single supplier fails, the damage rarely stays at that supplier. In their study of publicly announced disruptions, Hendricks and Singhal (2005) found that affected firms suffered abnormal stock returns of roughly −40% over the following three years, and their share-price volatility rose. More recent crises, including port closures, pandemic-era factory shutdowns, the global chip shortage, and export restrictions, have shown that even well-run companies can find themselves stuck behind a supplier that simply *cannot* deliver.

Most of these failures were not surprises. In hindsight, the warning signs were there: a supplier's on-time delivery slipping for three months, lead times drifting upward, slow responses to purchase orders, a key sub-supplier located in one flood-prone region, or a customer that had quietly become 40% of the supplier's revenue. The trouble is that this information is scattered across procurement, quality, finance, and logistics systems. Suppliers also have reasons to hide their constraints rather than disclose them.

This paper is written for supply chain and procurement leaders who want to move from *reacting* to supplier failures to *anticipating and mitigating* them. It answers three practical questions:

1. **What constraints make a supplier risky?** We identify capacity, lead-time, quality, financial, geographic, structural, and compliance constraints, and show how to measure each one.
2. **What can we do about them?** We compare mitigation levers (dual sourcing, safety stock, capacity reservation, supplier development, and contracts) on cost, speed, and effectiveness.
3. **How do we decide?** We present a simple quantitative method that combines expected disruption loss, time-to-recover, and time-to-survive (Simchi-Levi et al., 2014, 2015) to decide where mitigation spending pays off.

---

## Variant C: Technology / AI-Driven Introduction

Supplier risk has traditionally been managed with backward-looking tools: annual audits, quarterly scorecards, and spreadsheets that rate suppliers on last period's delivery and quality. These tools tell a buyer that a supplier *has* failed. They rarely say that a supplier *is about to* fail. Meanwhile, firms now collect a large volume of operational data that could reveal constraints early: purchase-order acknowledgements, advance ship notices, lead-time histories, defect logs, payment behavior, news feeds, and geospatial hazard data.

Artificial intelligence (AI) and machine learning (ML) offer a way to turn this data into forward-looking risk estimates. Reviews of the field show rapid growth in AI applications for supply chain risk management (SCRM), but they also point to recurring gaps. Models are often built on one-off datasets, lack explanations, and stop at prediction without connecting to decisions (Baryannis et al., 2019). Case evidence suggests that supplier delivery disruptions can be predicted from routine transactional data (Brintrup et al., 2020). What is still missing is a design that closes the loop: one that (a) predicts constraint-driven disruptions, (b) *signals* the risk and its drivers back to suppliers so they can act, and (c) *recommends* which suppliers to use and how to split volume among them.

This paper proposes such a design. We describe a four-layer architecture (data, prediction, signaling, and recommendation), give the formal model for each layer, and demonstrate it with a working prototype on a synthetic panel of 240 suppliers over 24 months. The prototype compares a rule-based scorecard with logistic regression and gradient boosting. It turns predictions into Green/Amber/Red signals with supplier-specific drivers and recommended actions, and it uses a risk-adjusted multi-criteria ranking plus a linear program to allocate demand. We close with governance, ethical, and validation considerations for deploying such a system with real suppliers.

---

### References for the introductions
See the full reference list in any of the three papers (all introductions draw on the same sources).
