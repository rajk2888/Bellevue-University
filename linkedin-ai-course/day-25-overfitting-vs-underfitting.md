Day 25/30 — Overfitting vs underfitting: the balancing act

---

The central tension in every model you'll ever train: performing well on
data it's already seen versus performing well on data it hasn't.

→ Overfitting: the model memorizes the training data — including its
noise and quirks — instead of learning the underlying pattern. It scores
great on training data and disappoints on anything new. Like a student who
memorizes last year's exam answers instead of understanding the subject —
perfect on that exact test, lost on a new one.

→ Underfitting: the model is too simple to capture the real pattern at
all, and performs poorly even on the training data. Like trying to fit a
straight line to a curve — it misses the shape no matter how much data you
give it.

The standard defense against overfitting: never evaluate a model only on
the data it trained on. Split your data into training, validation, and
test sets — train on one chunk, tune on a second, and get your final
honest score on a third the model has never touched, in any way, until the
very end.

If a model's training score and real-world score tell wildly different
stories, that gap itself is a diagnosis: it's telling you the model learned
the wrong thing.

#MachineLearning #DataScience #AI #ModelTraining
