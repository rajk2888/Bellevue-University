Day 12/30 — Zero-shot vs few-shot prompting

---

One of the highest-leverage prompt engineering tricks costs you two extra
sentences: showing an example.

→ Zero-shot prompting: you ask for a task with no examples, relying purely
on the model's general training. "Classify this review as positive or
negative." Works fine for simple, common tasks.

→ Few-shot prompting: you include a couple of example input/output pairs
before your real request. Suddenly the model has a concrete pattern to
match, not just an abstract instruction — and quality jumps, especially
for tasks with a specific format, tone, or edge cases that are hard to
describe in words.

Example: instead of "extract the key entities from this text," show two
short examples of text plus the exact entity format you want first, then
give the real text. The model mimics the structure precisely instead of
guessing at what you meant.

Rule of thumb: if you find yourself re-explaining the same formatting
instructions in every prompt, stop explaining and start showing. One good
example is often worth three sentences of description.

Have you tried few-shot prompting, or have you mostly been doing zero-shot
without realizing it had a name?

#PromptEngineering #AI #LLM #GenerativeAI
