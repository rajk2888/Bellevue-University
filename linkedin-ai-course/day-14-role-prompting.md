Day 14/30 — Role prompting: turning AI into an expert on demand

---

"You are a senior tax attorney specializing in small business deductions."
One sentence, and the model's entire response shifts — vocabulary,
structure, the questions it anticipates, even what it flags as a risk.

Role prompting (also called persona prompting) works because of how
training data is structured: the model has seen enormous amounts of text
written by professionals in specific voices — legal disclaimers, medical
explanations, code review comments, comedy writing. Telling it "you are an
X" activates the patterns most associated with that role in its training
data, which steers tone, depth, and vocabulary toward what an actual expert
in that field would produce.

Where this helps most:
→ Getting appropriately technical (or appropriately simple) language
→ Surfacing the right caveats a domain expert would think to mention
→ Adjusting tone — a "skeptical senior engineer" role catches different
issues in a code review than a generic "review this code" prompt

One caution: a role prompt makes output sound more authoritative, but it
doesn't make the underlying facts more accurate (Day 9 still applies).
Confidence isn't correctness — verify claims from an "expert" persona the
same way you'd verify claims from a generic response.

What's the most useful persona you've assigned an AI model?

#PromptEngineering #AI #GenerativeAI #ProductivityTips
