Day 6/30 — What is a Large Language Model (LLM)?

---

An LLM — the tech behind ChatGPT, Claude, Gemini — is, at its core, a very
sophisticated next-word predictor.

Trained on enormous amounts of text, it learns the statistical patterns of
language: which words tend to follow which other words, in which contexts.
Ask it a question, and it's generating its answer one token (a word or word
fragment) at a time, each one chosen based on everything written so far.

"Large" refers to two things: the size of the training data (a meaningful
chunk of the public internet, books, code) and the number of parameters —
the weights from Day 5's neural network — which run into the billions.

Here's the part that reframes everything: the model has no database of
facts it looks things up in. It generates a plausible continuation based on
patterns. Most of the time that continuation is accurate, because accurate
text was common in its training data. But sometimes plausible and accurate
diverge — which is exactly what causes hallucinations (Day 9).

Understanding "next-token prediction" is the single most useful mental model
for using these tools well: you're not talking to a database, you're
steering a very good pattern-completion engine.

#LLM #GenerativeAI #ChatGPT #AI
