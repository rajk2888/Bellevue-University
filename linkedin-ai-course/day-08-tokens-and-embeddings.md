Day 8/30 — Tokens & embeddings: how AI understands language

---

AI models don't read words. They read numbers. Here's how text becomes
math.

Step 1 — Tokenization: text gets chopped into "tokens," which are often
words but sometimes word fragments. "Unbelievable" might become "un" +
"believ" + "able." This is why AI pricing and limits are measured in
tokens, not words — and why it sometimes miscounts letters in a word (it's
not seeing letters, it's seeing token chunks).

Step 2 — Embeddings: each token gets converted into a long list of numbers
(a vector) that captures its meaning based on the contexts it appeared in
during training. The wild part: words with similar meanings end up with
similar numbers. "King" minus "man" plus "woman" lands mathematically close
to "queen." Meaning becomes geometry.

This is also the backbone of semantic search and RAG (Day 16) — instead of
matching exact keywords, systems compare the "closeness" of embeddings to
find text that means the same thing, even with completely different words.

Once you see language as coordinates in space, a lot of "how does AI even
understand me" stops feeling mysterious and starts feeling like math.

#AI #NLP #MachineLearning #Embeddings
