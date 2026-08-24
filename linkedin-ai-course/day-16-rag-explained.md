Day 16/30 — Retrieval-Augmented Generation (RAG) explained

---

Remember Day 9: models hallucinate and their knowledge is frozen at a
training cutoff. RAG is the most common fix, and it's more straightforward
than the acronym suggests.

Instead of relying only on what the model memorized during training, RAG
adds a retrieval step before generation:

1. Your question gets converted into an embedding (Day 8).
2. The system searches a knowledge base — your company docs, a product
manual, today's news — for chunks of text with the closest matching
embeddings.
3. Those retrieved chunks get inserted into the prompt as context.
4. The model generates its answer grounded in that retrieved text, instead
of purely from memory.

This is why tools that "chat with your PDFs" or answer questions about
recent events actually work — they're not relying on the model's training
data at all for the facts, just its language ability to read the retrieved
context and write a coherent answer.

The practical upside: RAG dramatically reduces hallucination on
domain-specific questions and lets you update a system's "knowledge" by
updating a database, not retraining a multi-billion-parameter model.

Any tool you use daily is almost certainly RAG under the hood — customer
support bots, internal doc search, "ask your codebase" tools.

#RAG #AI #LLM #GenerativeAI
