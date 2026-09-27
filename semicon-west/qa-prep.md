# Q&A prep: SEMICON West

**Session:** Addressing the risks associated with the global semiconductor supply chain - Leveraging Data and AI Governance
**Format:** 20-minute slot, about 15 minutes of talk and 5 minutes of Q&A. Expect 3 or 4 questions.

Answers are written to be spoken and run 30 to 60 seconds each. Anything in `[brackets]` is a spot for your own number, example, or employer detail. Fill those in before the talk or leave them out; don't improvise a figure at the mic.

## How to handle the 5 minutes

- Repeat or paraphrase each question into the mic. The room and the recording need it, and it gives you three seconds to think.
- Answer in one point plus one example, then stop. A short answer leaves room for another question.
- If a question needs a whiteboard, say "Great one for after the session. Come find me" and offer your LinkedIn or card.
- If you don't know, say so and name what you'd check. Engineers respect that more than a guess.
- Keep one closing line ready for when the moderator calls time: "If you take one thing back, [your top takeaway]."

## 1. Data sharing and trust

**Q1. Suppliers won't share their data with us, let alone their suppliers' data. How does governance change that?**

It doesn't make anyone share by decree. What it does is lower the risk of sharing. When a supplier knows exactly which fields you'll see, who can access them, how long you'll keep them, and that they won't end up in a model trained for someone else, the conversation changes. Start with the data they already send you, like ship notices, lead-time commitments, and capacity signals. Put terms around its use and give something back, such as your forecast. In my experience, [your example of a supplier who started sharing once terms were clear].

**Q2. How do you get visibility past tier 1 when you have no contract with tier 2 or tier 3?**

You mostly get it through tier 1, so build the requirement into their agreements: disclose critical sub-tier sources for the parts you've flagged as high risk. You don't need the whole tree. You need the few nodes where a single site or region sits under several of your products. Combine that with outside data, such as trade records and news, and mark it clearly as lower confidence. Governance matters here because you're mixing sources of very different quality, and the people making decisions need to know which is which.

**Q3. Doesn't sharing this data create a security or IP risk of its own?**

Yes, and that's the honest tradeoff. A map of your single-source dependencies is exactly what a competitor or an attacker would want. So the sharing model has to be least-privilege. Share what's needed to act on a risk, aggregate where you can, and log who accessed what. For the most sensitive nodes, some companies keep the full map internal and only share alerts. The governance controls that protect it are the same ones I talked about: access control, lineage, and audit trails.

## 2. AI and model risk

**Q4. How do you trust an AI model's risk score when a wrong call could halt a line or cost millions?**

You don't trust the score on its own. You trust the process around it. That means knowing what data the model saw, validating it against past disruptions before it's used, monitoring for drift, and keeping a human decision point for anything that moves allocation or triggers a buy. The model's job is to rank where to look first. A planner or buyer makes the call and owns it. If the model can't explain which inputs drove a score, it shouldn't be driving a decision that big.

**Q5. What about generative AI? Are you using LLMs in supply chain planning?**

[Adjust to your actual use.] Where I've seen them help is reading unstructured information, such as supplier emails, news, and regulatory notices, and pulling out signals a planner would otherwise miss. Where I'd be careful is letting them generate numbers or commitments. An LLM can summarize a force majeure notice well. It shouldn't be the source of record for a lead time. Governance for these tools means grounding them in approved data, logging prompts and outputs, and keeping them out of transactional decisions until they've earned it.

**Q6. Your data has gaps and errors. Doesn't AI just make bad data look confident?**

That's the risk I worry about most. A clean dashboard on top of messy master data is more dangerous than a messy spreadsheet, because people stop questioning it. So data quality comes first. Measure completeness and accuracy on the few fields that feed risk decisions, like supplier site, lead time, and part-to-source mapping, and show that quality score next to the output. If the input confidence is low, the output should say so.

## 3. Cost, ownership, and getting started

**Q7. How do you justify the cost? Governance doesn't show up as revenue.**

Tie it to avoided cost on a scenario the leadership team already fears. Pick one real exposure, such as a single-source material, and estimate what a disruption would cost in lost output, expediting, and customer penalties. Then show how much earlier you'd have seen it with better data. [Your number, if you have one.] Governance also cuts cost you already pay: time spent reconciling conflicting reports, and audit and compliance work that's done by hand today.

**Q8. Who should own this: supply chain, IT, or a data office?**

Split the ownership, but make one person accountable. Supply chain owns the decisions and the definition of what's critical. IT or the data team owns the platform, access, and pipelines. Someone with authority, often a chief data officer or a supply chain risk leader, owns the policies and settles disputes. Where I've seen it fail is when governance lives only in IT and supply chain treats it as a compliance form. [Your organization's model, if you can share it.]

**Q9. We're a smaller company. Where do we start without a big program?**

Start with a list, not a platform. Pick your top 20 or so parts by revenue at risk, map where each comes from as far down as you can, and name an owner for each record. That list, kept current, will do more than most tools. Then add basic rules: who can edit it, how often it's reviewed, and where it came from. You can bring in AI later, once the data underneath is something you'd bet a decision on.

**Q10. What would you measure to know this is working?**

I'd track a few things. How far down the tree you can see for critical parts. How long it takes from an event happening to someone acting on it. How much of the time the risk data matched reality when a disruption hit. For AI specifically, track how often planners override the model and why. A high override rate tells you something is wrong with either the model or the trust in it. [Add any metric you already use, such as OTIF impact.]

## 4. Frameworks, regulation, and geopolitics

**Q11. Which framework should we use: NIST AI RMF, ISO/IEC 42001, or something else?**

They answer different needs. NIST AI RMF is voluntary and practical for structuring how you identify and manage AI risk. ISO/IEC 42001 is a certifiable management system standard, which matters if customers or regulators ask for proof. Many companies use NIST to design the practice and ISO to certify it. What matters more is picking one and applying it to a real use case rather than writing a policy nobody follows. [Mention the one your organization uses, if any.]

**Q12. How does the EU AI Act or other regulation affect supply chain AI?**

Most supply chain planning and risk-scoring uses aren't the high-risk categories the EU AI Act focuses on, but that can change depending on how a system is used and who it affects. The practical point is that the records regulators ask for, such as data sources, testing, and human oversight, are the same records good governance keeps anyway. If you build those habits now, compliance is mostly documentation. I'd check with your legal team for your specific use. I'm not giving legal advice from the stage.

**Q13. How do export controls and geopolitical shifts fit into this? Can data really help with something that political?**

Data won't predict policy. What it can do is tell you, within hours of a change, which parts, suppliers, customers, and sites are affected. That's often the slow part today. It means classifying items and parties correctly, keeping country of origin and site data current, and being able to run "what if this region were cut off" against your actual network. The companies that responded fastest to past changes were the ones who already knew their exposure. [Keep this neutral; avoid commenting on specific policies.]

## 5. The tough ones

**Q14. Isn't this just more bureaucracy that slows us down in a crisis?**

Bad governance does slow you down. Good governance should make a crisis faster, because the arguments about whose number is right and who's allowed to see what are settled ahead of time. The test I'd use is whether a planner can get a trusted answer faster with it than without it. If a control doesn't pass that test, simplify it. Governance that only produces paperwork deserves the pushback.

**Q15. You said all advanced logic capacity was in two places. Isn't that changing with the new fabs in the U.S.?**

It is changing, and the same SIA and BCG report shows it. They project the U.S. going from zero to about 28 percent of sub-10 nanometer logic capacity by 2032, with Europe and Japan adding a few points each. But Taiwan is still projected at 47 percent, and much of that new capacity arrives late in the decade. Those shares cover leading-edge logic only. Mature nodes, memory, and assembly and test are spread more widely. So concentration risk shrinks over time, but it doesn't go away within the next few planning cycles.

**Q16. If you had to pick one thing for us to do next quarter, what would it be?**

[Match this to your closing takeaway so the talk ends on the same note.] My suggestion: pick your single riskiest material or component, map it as far down as you can, and assign one owner for keeping that record accurate. It's small enough to finish in a quarter, and it will show you exactly where your data and governance gaps are.

## Before the talk

- [ ] Fill in every `[bracket]` or delete the sentence it sits in.
- [ ] Pick the 5 questions you think are most likely and say those answers out loud with a timer, aiming for under 60 seconds each.
- [ ] Prepare Q15 for your actual weakest claim.
- [ ] Check what you're allowed to say about your employer's programs, suppliers, and numbers.
- [ ] Have a backup slide with your contact info or a QR code for questions you take offline.
