Day 27/30 — Deploying models: APIs, latency, and scaling

---

A trained model, sitting on your laptop, helps nobody. Deployment is the
process of turning it into something other systems and users can actually
call — and it introduces a whole new set of engineering constraints that
have nothing to do with model accuracy.

→ Serving via an API — the model gets wrapped behind an endpoint that
accepts input and returns predictions, so any application can call it like
any other web service.

→ Latency — how fast is fast enough? A fraud check blocking a payment
needs an answer in milliseconds. A report generated overnight can take
minutes. The acceptable latency shapes which model size and hardware you
can even consider.

→ Scaling — one request is easy. Ten thousand simultaneous requests
requires load balancing, request queuing, and often multiple model
replicas running in parallel — plus a plan for what happens when demand
spikes past capacity.

→ Cost — every inference call (Day 7) consumes real compute. At scale,
inference cost, not training cost, usually dominates the long-run budget of
an AI product.

The mindset shift from "building a model" to "deploying a model": accuracy
gets you in the door, but latency, reliability, and cost determine whether
the product actually survives contact with real users.

#MLOps #MachineLearning #AI #SoftwareEngineering
