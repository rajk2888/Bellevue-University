Day 29/30 — Cost & compute: the economics of running AI

---

The most surprising thing to newcomers building their first AI product
isn't a technical concept — it's the bill. Understanding where AI costs
actually come from changes how you design a product from day one.

→ Training cost — a one-time (or periodic) expense, often enormous for
large models, but amortized across every future use.

→ Inference cost — what you pay every single time the model runs (Day 7).
For a product with real usage, this dwarfs training cost over time — it's
the ongoing "cost of goods sold" for an AI feature, not a one-off R&D
expense.

→ The levers that actually move the number: model size (bigger models cost
more per call), output length (you're often billed per token generated),
prompt length (more context in = more cost), and call frequency (does
every user action trigger a model call, or only the ones that need one?).

Practical takeaways I've seen save real budget: cache repeated or similar
requests instead of recomputing them, use a smaller/cheaper model for
simple sub-tasks and reserve the expensive model for the hard parts, and
keep prompts as lean as they can be while staying effective.

The teams that treat inference cost as a design constraint from the start
build meaningfully more sustainable AI products than the ones who bolt on
efficiency after launch.

#AI #MLOps #Cost #GenerativeAI
