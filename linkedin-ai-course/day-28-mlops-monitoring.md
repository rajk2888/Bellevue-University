Day 28/30 — MLOps: monitoring models after they ship

---

Shipping a model isn't the finish line — it's the starting gun for a new
problem: the real world keeps changing, and your model doesn't, unless you
make it.

This is called drift, and it comes in two flavors:
→ Data drift — the incoming data starts looking statistically different
from the training data (new customer behavior, a market shift, a seasonal
change). The model is now making predictions on inputs it was never really
trained for.
→ Concept drift — the actual relationship between inputs and the right
answer changes over time (what counted as "normal spending" before a
recession isn't what counts as normal after one).

Either way, a model that was accurate on launch day can quietly get worse
every week without a single line of code changing — which is exactly why
monitoring matters as much post-launch as testing does pre-launch. Good
MLOps practice tracks prediction distributions over time, flags when
input data starts drifting from training data, and triggers retraining on
a schedule or when performance drops past a threshold.

The uncomfortable truth: a model with no monitoring isn't "done," it's a
ticking clock on an undetected failure.

Does your organization actively monitor deployed models for drift, or find
out about problems from users first?

#MLOps #MachineLearning #AI #DataScience
