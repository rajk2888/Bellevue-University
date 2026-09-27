# humanizer-semicon

A customized copy of [Humanizer](https://github.com/blader/humanizer) v3.0.0 by blader (MIT). It rewrites AI-sounding text so it reads like you, without changing what it says.

## What's customized

**Mode 1: SEMICON West talk (default).** Tuned for the session *"Addressing the risks associated with the global semiconductor supply chain - Leveraging Data and AI Governance."*

- Protects semiconductor, supply chain, and AI governance terms (OSAT, HBM, EUV, CoWoS, tier-n suppliers, OTIF, S&OP, CHIPS Act, export controls, NIST AI RMF, ISO/IEC 42001, EU AI Act, and more).
- Never invents statistics; unsupported claims are flagged `[source?]`.
- Format rules for slide titles (takeaway, not topic), slide bullets, spoken speaker notes, session abstract, speaker bio, and LinkedIn/email promo posts.
- Keeps governance claims tied to a concrete control (lineage, validation, audit trail, human review).
- Plans for a **20-minute slot**: about 130 wpm (about 2,300 to 2,500 words of script), 12 to 15 content slides, a default run of show, and a per-slide timing table after every notes edit. The script is cut shorter if Q&A comes out of the 20 minutes.

**Mode 2: Bellevue University coursework.** APA 7 overrides: title-case APA headings, citations and references never altered, statistics and code left untouched, evidence-based hedging kept, `[citation needed]` flags instead of invented sources, and a reminder to follow each course's AI-use policy.

The upstream pattern catalog (25 AI-writing tells) is unchanged.

## Install

```
/plugin marketplace add rajk2888/Bellevue-University
/plugin install humanizer-semicon@bellevue-university
```

Then ask, for example: "Humanize my speaker notes for slide 4" or "Humanize this abstract, 150-word limit."
