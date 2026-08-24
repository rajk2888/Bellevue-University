# 30-Day "Step by Step AI" LinkedIn Course

A daily LinkedIn post series that takes a reader from "what even is AI?" to
a working mental model of how modern AI systems are built, prompted, and
shipped. Written in a conversational style with a personal takeaway/question
at the end of each post to drive engagement.

Each day lives in its own file: `day-01-....md` through `day-30-....md`.
Copy the post body (everything below the `---`) straight into LinkedIn.

## How posting works

There's no LinkedIn auto-posting connector available in this environment,
so posts aren't published automatically. Instead, a daily Claude trigger
reads the next file in this folder and sends it to you as a chat message
each morning — you copy/paste it into LinkedIn (add an image or carousel
if you like, LinkedIn favors those). See "Scheduling" below for the trigger
details and how to change the time or pause it.

## Calendar

### Phase 1 — AI/ML Fundamentals (Days 1–10)
1. What is AI, really?
2. AI vs ML vs Deep Learning vs GenAI — the family tree
3. How machines "learn": training data explained simply
4. Supervised vs unsupervised vs reinforcement learning
5. Neural networks in plain English
6. What is a Large Language Model (LLM)?
7. Training vs inference — why ChatGPT doesn't "learn" from your chats
8. Tokens & embeddings: how AI understands language
9. Hallucinations: why AI confidently makes things up
10. AI ethics & bias — the human side of the machine

### Phase 2 — Practical Generative AI & Prompt Engineering (Days 11–20)
11. Your first great prompt: anatomy of a good instruction
12. Zero-shot vs few-shot prompting
13. Chain-of-thought: getting AI to "show its work"
14. Role prompting: turning AI into an expert on demand
15. Prompt iteration: treating prompts like code
16. Retrieval-Augmented Generation (RAG) explained
17. AI agents: giving models tools and autonomy
18. Multimodal AI: text, image, audio, and video together
19. Evaluating AI output: how do you know it's good?
20. Building your personal AI workflow toolkit

### Phase 3 — ML Engineering & Deployment (Days 21–30)
21. From notebook to product: what "ML engineering" means
22. Data pipelines: the unglamorous backbone of AI
23. Feature engineering: making raw data model-ready
24. Model evaluation metrics that actually matter
25. Overfitting vs underfitting — the balancing act
26. Fine-tuning vs prompting: when to customize a model
27. Deploying models: APIs, latency, and scaling
28. MLOps: monitoring models after they ship
29. Cost & compute: the economics of running AI
30. Putting it all together: your AI learning roadmap

## Infographics

`infographics/ai-trail-infographic.html` is a self-contained, animated
scrollytelling page covering all 30 days as waypoints along a trail split
into three phases (Basecamp, The Forge, Summit Ridge), with scroll-triggered
reveal animation and a live day/phase progress readout. Open it in any
browser — it isn't postable to LinkedIn directly (LinkedIn doesn't embed
HTML), but it's shareable as a link and a good source to screen-record for
a video post.

`infographics/carousels/day-XX-carousel.pdf` are the LinkedIn-native
equivalent: a 3-slide swipe deck per day (cover → key points → closing
question), 1080×1350px, in the same visual system as the animated page.
Upload the matching PDF as a "document" post alongside that day's text —
LinkedIn renders it as a swipeable carousel natively.

## Scheduling

A daily Routine is set up to message this session every day with that day's
post (tracked via `linkedin-ai-course/progress.json`). Default fire time is
9:00 AM UTC — tell Claude your timezone or a preferred local time and it'll
adjust the trigger. To pause or stop the series, just ask Claude to disable
or delete the trigger.
